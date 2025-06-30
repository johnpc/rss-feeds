import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface CraigslistItem {
  id: string;
  title: string;
  price: string;
  location: string;
  url: string;
  description: string;
  pubDate: string;
  category: string;
  images?: string[];
}

interface OpenRSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
}



// Cache configuration
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'craigslist-rss.xml');

async function ensureCacheDir(): Promise<void> {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

async function getCachedData(): Promise<string | null> {
  try {
    const stats = await fs.stat(CACHE_FILE);
    const now = Date.now();
    const fileAge = now - stats.mtime.getTime();
    
    if (fileAge < CACHE_DURATION) {
      console.log(`Using cached data (${Math.round(fileAge / 1000 / 60)} minutes old)`);
      return await fs.readFile(CACHE_FILE, 'utf-8');
    } else {
      console.log(`Cache expired (${Math.round(fileAge / 1000 / 60)} minutes old), fetching fresh data`);
      return null;
    }
  } catch {
    console.log('No cache file found, fetching fresh data');
    return null;
  }
}

async function setCachedData(data: string): Promise<void> {
  await ensureCacheDir();
  await fs.writeFile(CACHE_FILE, data, 'utf-8');
  console.log('Data cached successfully');
}

async function fetchCraigslistData(): Promise<CraigslistItem[]> {
  // Try to get cached data first
  const cachedData = await getCachedData();
  
  let xmlText: string;
  
  if (cachedData) {
    xmlText = cachedData;
  } else {
    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch('https://openrss.org/annarbor.craigslist.org/search/sss?sort=date', {
      headers: {
        'User-Agent': 'RSS-Feed-Bot/1.0 (Personal RSS aggregator)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenRSS API request failed: ${response.status} ${response.statusText}`);
    }

    xmlText = await response.text();
    
    // Cache the response
    await setCachedData(xmlText);
  }
  
  // Parse the RSS XML manually since we don't have an XML parser
  const items = parseRSSItems(xmlText);
  
  if (items.length === 0) {
    throw new Error('No items found in RSS feed');
  }
  
  console.log(`Successfully processed ${items.length} items from Craigslist RSS`);
  return items.map(item => transformCraigslistItem(item));
}

function parseRSSItems(xmlText: string): OpenRSSItem[] {
  const items: OpenRSSItem[] = [];
  
  // Simple regex-based XML parsing (not ideal but works for basic RSS)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const matches = xmlText.match(itemRegex);
  
  if (!matches) return items;
  
  matches.forEach(itemXml => {
    const title = extractXMLValue(itemXml, 'title');
    const link = extractXMLValue(itemXml, 'link');
    const description = extractXMLValue(itemXml, 'description');
    const pubDate = extractXMLValue(itemXml, 'pubDate');
    const guid = extractXMLValue(itemXml, 'guid');
    
    if (title && link) {
      items.push({
        title,
        link,
        description: description || '',
        pubDate: pubDate || new Date().toUTCString(),
        guid: guid || link,
      });
    }
  });
  
  return items;
}

function extractXMLValue(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'g');
  const match = xml.match(regex);
  if (!match) return '';
  
  let value = match[0].replace(new RegExp(`<${tag}[^>]*>|<\\/${tag}>`, 'g'), '').trim();
  
  // Handle CDATA sections
  value = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  
  // Decode HTML entities
  value = value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#36;/g, '$')
    .replace(/&#39;/g, "'");
  
  return value;
}

function transformCraigslistItem(item: OpenRSSItem): CraigslistItem {
  // Extract price from title (usually in format like "Item Title - $100 (Location)")
  const priceMatch = item.title.match(/\$[\d,]+/);
  const price = priceMatch ? priceMatch[0] : '';
  
  // Extract location from title (usually in parentheses at the end)
  const locationMatch = item.title.match(/\(([^)]+)\)$/);
  const location = locationMatch ? locationMatch[1] : 'Ann Arbor';
  
  // Clean title by removing price and location
  let cleanTitle = item.title
    .replace(/\s*-\s*\$[\d,]+/, '') // Remove price
    .replace(/\s*\([^)]+\)$/, '') // Remove location in parentheses
    .trim();
  
  // If title is empty after cleaning, use original
  if (!cleanTitle) {
    cleanTitle = item.title;
  }
  
  // Extract category from URL path
  const categoryMatch = item.link.match(/craigslist\.org\/([^\/]+)\//);
  let category = categoryMatch ? categoryMatch[1] : 'for-sale';
  
  // Map Craigslist category codes to readable names
  const categoryMap: { [key: string]: string } = {
    'for': 'furniture',
    'ele': 'electronics', 
    'spo': 'sporting',
    'mus': 'musical',
    'app': 'appliances',
    'bks': 'books',
    'cto': 'auto',
    'clo': 'clothing',
    'tls': 'tools',
    'grd': 'garden',
    'toy': 'toys',
    'jwl': 'jewelry',
    'art': 'art',
    'hea': 'health',
    'bty': 'beauty',
    'zip': 'free',
    'atq': 'antiques',
    'sss': 'general',
  };
  
  category = categoryMap[category] || category;
  
  // Generate ID from URL
  const idMatch = item.link.match(/\/(\d+)\.html/);
  const id = idMatch ? idMatch[1] : item.guid.replace(/[^a-zA-Z0-9]/g, '');
  
  // Clean up description by removing HTML tags but preserving text
  const cleanDescription = item.description
    .replace(/<a[^>]*><img[^>]*><\/a>/g, '') // Remove image links
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
  
  return {
    id,
    title: cleanTitle,
    price,
    location,
    url: item.link,
    description: cleanDescription,
    pubDate: item.pubDate,
    category,
  };
}



function getCategoryEmoji(category: string): string {
  const categoryMap: { [key: string]: string } = {
    'furniture': '🪑',
    'electronics': '📱',
    'sporting': '⚽',
    'musical': '🎸',
    'appliances': '🏠',
    'books': '📚',
    'auto': '🚗',
    'clothing': '👕',
    'tools': '🔧',
    'garden': '🌱',
    'toys': '🧸',
    'jewelry': '💎',
    'art': '🎨',
    'health': '💊',
    'beauty': '💄',
    'default': '🛍️',
  };
  
  return categoryMap[category] || categoryMap['default'];
}

function getPriceEmoji(price: string): string {
  if (!price) return '💰';
  
  const numericPrice = parseInt(price.replace(/[^0-9]/g, ''));
  
  if (numericPrice >= 1000) return '💎';
  if (numericPrice >= 500) return '💰';
  if (numericPrice >= 100) return '💵';
  if (numericPrice >= 50) return '💴';
  return '💳';
}

function formatDescription(description: string): string {
  if (!description) return '';
  
  // Clean up HTML and format for RSS
  return description
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

function generateRSSFeed(items: CraigslistItem[]): string {
  const now = new Date().toUTCString();
  const feedTitle = '🏪 Craigslist Ann Arbor - For Sale';
  const description = 'Latest items for sale on Craigslist Ann Arbor, sorted by date';
  
  const rssItems = items.map((item) => {
    const postDate = new Date(item.pubDate);
    const categoryEmoji = getCategoryEmoji(item.category);
    const priceEmoji = getPriceEmoji(item.price);
    
    const description = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
          <div style="flex-grow: 1;">
            <h2 style="margin: 0 0 10px 0; color: #2c3e50;">${item.title}</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">
              ${item.price ? `<span style="background: #27ae60; color: white; padding: 6px 12px; border-radius: 15px; font-size: 1.1em; font-weight: bold;">
                ${priceEmoji} ${item.price}
              </span>` : ''}
              <span style="background: #3498db; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.9em;">
                📍 ${item.location}
              </span>
              <span style="background: #9b59b6; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.9em;">
                ${categoryEmoji} ${item.category}
              </span>
            </div>
          </div>
        </div>
        
        ${item.description ? `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3498db;">
          <h3 style="margin-top: 0; color: #3498db;">📝 Description</h3>
          <div style="line-height: 1.6; color: #2c3e50;">
            <p>${formatDescription(item.description.substring(0, 300))}${item.description.length > 300 ? '...' : ''}</p>
          </div>
        </div>` : ''}
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin: 15px 0;">
          ${item.price ? `
          <div style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd; text-align: center;">
            <strong>${priceEmoji} Price</strong><br>
            <span style="font-size: 1.2em; color: #27ae60; font-weight: bold;">${item.price}</span>
          </div>` : ''}
          
          <div style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd; text-align: center;">
            <strong>📍 Location</strong><br>
            <span style="font-size: 1em; color: #3498db;">${item.location}</span>
          </div>
          
          <div style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd; text-align: center;">
            <strong>${categoryEmoji} Category</strong><br>
            <span style="font-size: 0.9em; color: #9b59b6;">${item.category}</span>
          </div>
        </div>
        
        <div style="margin: 20px 0;">
          <a href="${item.url}" style="background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; width: 100%; text-align: center; box-sizing: border-box;">
            🔗 View on Craigslist
          </a>
        </div>
        
        <div style="margin-top: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px; font-size: 0.9em; color: #666;">
          <p><strong>📅 Posted:</strong> ${postDate.toLocaleString()}</p>
          <p><strong>🔗 Link:</strong> <a href="${item.url}">${item.url}</a></p>
          <p><strong>⚠️ Safety:</strong> Meet in public places, inspect items before purchase, be cautious of scams</p>
        </div>
      </div>`;

    const title = `${categoryEmoji} ${item.title}${item.price ? ` - ${item.price}` : ''} (📍 ${item.location})`;

    return `
    <item>
      <title>${title}</title>
      <description><![CDATA[${description}]]></description>
      <link>${item.url}</link>
      <pubDate>${postDate.toUTCString()}</pubDate>
      <guid isPermaLink="false">craigslist-${item.id}</guid>
      <category>Craigslist</category>
      <category>${item.category}</category>
      <category>${item.location}</category>
    </item>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${feedTitle}</title>
    <description>${description}</description>
    <link>https://annarbor.craigslist.org/search/sss?sort=date</link>
    <atom:link href="http://localhost:3000/api/craigslist" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <category>Craigslist</category>
    <category>Ann Arbor</category>
    <category>For Sale</category>
    <copyright>Content from Craigslist users</copyright>
    <managingEditor>craigslist-rss@localhost</managingEditor>
    <webMaster>craigslist-rss@localhost</webMaster>
    <lastBuildDate>${now}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <ttl>60</ttl>
    <generator>Next.js Craigslist RSS Feed v1.0</generator>
    <image>
      <url>https://www.craigslist.org/favicon.ico</url>
      <title>Craigslist RSS Feed</title>
      <link>https://annarbor.craigslist.org</link>
      <width>32</width>
      <height>32</height>
    </image>
    ${rssItems}
  </channel>
</rss>`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Optional parameters for future enhancement
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);
    
    // Fetch Craigslist data
    const items = await fetchCraigslistData();
    
    // Limit results if requested
    const limitedItems = items.slice(0, limit);
    
    // Generate RSS feed
    const rssFeed = generateRSSFeed(limitedItems);
    
    return new NextResponse(rssFeed, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating Craigslist RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate Craigslist RSS feed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
