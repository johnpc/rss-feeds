import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface SearchParams {
  subreddit: string;
  sort: 'hot' | 'new' | 'top' | 'rising';
  timeframe?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  limit: number;
}

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const CACHE_DIR = path.join(process.cwd(), '.cache');

async function ensureCacheDir(): Promise<void> {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

function getCacheFileName(params: SearchParams): string {
  const cacheKey = `reddit-${params.subreddit}-${params.sort}${params.timeframe ? `-${params.timeframe}` : ''}.xml`;
  return path.join(CACHE_DIR, cacheKey);
}

async function getCachedData(params: SearchParams): Promise<string | null> {
  try {
    const cacheFile = getCacheFileName(params);
    const stats = await fs.stat(cacheFile);
    const now = Date.now();
    const fileAge = now - stats.mtime.getTime();
    
    if (fileAge < CACHE_DURATION) {
      console.log(`Using cached Reddit data for /r/${params.subreddit} (${Math.round(fileAge / 1000 / 60)} minutes old)`);
      return await fs.readFile(cacheFile, 'utf-8');
    } else {
      console.log(`Reddit cache expired for /r/${params.subreddit} (${Math.round(fileAge / 1000 / 60)} minutes old), fetching fresh data`);
      return null;
    }
  } catch {
    console.log(`No cache file found for /r/${params.subreddit}, fetching fresh data`);
    return null;
  }
}

async function setCachedData(params: SearchParams, data: string): Promise<void> {
  await ensureCacheDir();
  const cacheFile = getCacheFileName(params);
  await fs.writeFile(cacheFile, data, 'utf-8');
  console.log(`Reddit data cached successfully for /r/${params.subreddit}`);
}

async function fetchRedditRSS(params: SearchParams): Promise<string> {
  // Try to get cached data first
  const cachedData = await getCachedData(params);
  
  if (cachedData) {
    return cachedData;
  }

  try {
    // Build OpenRSS URL for Reddit
    let openRssUrl = `https://openrss.org/old.reddit.com/r/${params.subreddit}`;
    
    // Add sort parameter
    if (params.sort !== 'hot') {
      openRssUrl += `/${params.sort}`;
    }
    
    // Add timeframe for 'top' sort
    if (params.sort === 'top' && params.timeframe) {
      openRssUrl += `?t=${params.timeframe}`;
    }

    console.log(`Fetching Reddit RSS from OpenRSS: ${openRssUrl}`);

    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(openRssUrl, {
      headers: {
        'User-Agent': 'RSS-Feed-Bot/1.0 (Personal RSS aggregator)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        console.warn(`OpenRSS rate limit hit for /r/${params.subreddit}. Status: ${response.status}`);
        
        // Try to get any cached data, even if expired
        const expiredCache = await getExpiredCachedData(params);
        if (expiredCache) {
          console.log(`Using expired cache for /r/${params.subreddit} due to rate limiting`);
          return expiredCache;
        }
        
        throw new Error(`OpenRSS rate limit exceeded. Please try again later.`);
      }
      
      throw new Error(`OpenRSS request failed: ${response.status} ${response.statusText}`);
    }

    const rssContent = await response.text();
    
    if (!rssContent || (!rssContent.includes('<rss') && !rssContent.includes('<feed'))) {
      throw new Error('Invalid RSS/Atom content received from OpenRSS');
    }
    
    // Cache the response
    await setCachedData(params, rssContent);
    
    return rssContent;
  } catch (error) {
    console.error('Error fetching Reddit RSS from OpenRSS:', error);
    
    // Try to get any cached data, even if expired, as a fallback
    const expiredCache = await getExpiredCachedData(params);
    if (expiredCache) {
      console.log(`Using expired cache for /r/${params.subreddit} as fallback due to fetch error`);
      return expiredCache;
    }
    
    throw new Error(`Failed to fetch Reddit RSS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function getExpiredCachedData(params: SearchParams): Promise<string | null> {
  try {
    const cacheFile = getCacheFileName(params);
    const data = await fs.readFile(cacheFile, 'utf-8');
    console.log(`Found expired cache file for /r/${params.subreddit}`);
    return data;
  } catch {
    return null;
  }
}

function enhanceRSSFeed(content: string, params: SearchParams): string {
  // Add custom styling and branding to the RSS/Atom feed
  const now = new Date().toUTCString();
  const subredditTitle = `/r/${params.subreddit}`;
  const sortTitle = params.sort.charAt(0).toUpperCase() + params.sort.slice(1);
  const feedTitle = `🤖 Reddit: ${subredditTitle} (${sortTitle})`;
  
  // Check if it's an Atom feed or RSS feed
  const isAtomFeed = content.includes('<feed');
  
  if (isAtomFeed) {
    // Handle Atom feed - convert key elements but keep most of the structure
    const enhancedFeed = content
      .replace(/<title><!\[CDATA\[.*?\]\]><\/title>/, `<title><![CDATA[${feedTitle}]]></title>`)
      .replace(/<subtitle><!\[CDATA\[.*?\]\]><\/subtitle>/, `<subtitle><![CDATA[${sortTitle} posts from /r/${params.subreddit}${params.timeframe ? ` (${params.timeframe})` : ''} - Enhanced RSS feed with better formatting]]></subtitle>`)
      .replace(/<updated>.*?<\/updated>/, `<updated>${new Date().toISOString()}</updated>`);
    
    return enhancedFeed;
  } else {
    // Handle RSS feed
    let enhancedRss = content
      .replace(/<title>.*?<\/title>/, `<title>${feedTitle}</title>`)
      .replace(/<description>.*?<\/description>/, `<description>${sortTitle} posts from /r/${params.subreddit}${params.timeframe ? ` (${params.timeframe})` : ''} - Enhanced RSS feed with better formatting</description>`)
      .replace(/<lastBuildDate>.*?<\/lastBuildDate>/, `<lastBuildDate>${now}</lastBuildDate>`)
      .replace(/<pubDate>.*?<\/pubDate>/, `<pubDate>${now}</pubDate>`);
    
    // Add our custom atom:link for self-reference
    if (!enhancedRss.includes('atom:link')) {
      const atomLink = `<atom:link href="http://localhost:3000/api/reddit?subreddit=${params.subreddit}&amp;sort=${params.sort}${params.timeframe ? `&amp;timeframe=${params.timeframe}` : ''}" rel="self" type="application/rss+xml"/>`;
      enhancedRss = enhancedRss.replace('<channel>', `<channel>\n    ${atomLink}`);
    }
    
    return enhancedRss;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: SearchParams = {
      subreddit: searchParams.get('subreddit') || 'annarbor',
      sort: (searchParams.get('sort') as 'hot' | 'new' | 'top' | 'rising') || 'hot',
      timeframe: searchParams.get('timeframe') as 'hour' | 'day' | 'week' | 'month' | 'year' | 'all' || undefined,
      limit: Math.min(parseInt(searchParams.get('limit') || '25'), 100), // Max 100 posts
    };
    
    // Validate subreddit name (basic validation)
    if (!/^[a-zA-Z0-9_]+$/.test(params.subreddit)) {
      return NextResponse.json(
        { error: 'Invalid subreddit name' },
        { status: 400 }
      );
    }
    
    // Fetch Reddit RSS from OpenRSS (with caching)
    const rssContent = await fetchRedditRSS(params);
    
    // Enhance the RSS feed with our custom branding and metadata
    const enhancedRssFeed = enhanceRSSFeed(rssContent, params);
    
    return new NextResponse(enhancedRssFeed, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes
      },
    });
  } catch (error) {
    console.error('Error generating Reddit RSS feed:', error);
    return NextResponse.json(
      { error: `Failed to generate Reddit RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
