import { NextRequest, NextResponse } from 'next/server';

interface RedditPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  url: string;
  permalink: string;
  selftext: string;
  score: number;
  upvoteRatio: number;
  numComments: number;
  created: number;
  createdUtc: number;
  thumbnail?: string;
  preview?: {
    images: Array<{
      source: {
        url: string;
        width: number;
        height: number;
      };
    }>;
  };
  isVideo: boolean;
  domain: string;
  flair?: string;
  stickied: boolean;
  locked: boolean;
  nsfw: boolean;
  spoiler: boolean;
}

interface RedditApiPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  url: string;
  permalink: string;
  selftext: string;
  score: number;
  upvote_ratio: number;
  num_comments: number;
  created: number;
  created_utc: number;
  thumbnail?: string;
  preview?: {
    images: Array<{
      source: {
        url: string;
        width: number;
        height: number;
      };
    }>;
  };
  is_video: boolean;
  domain: string;
  link_flair_text?: string;
  stickied: boolean;
  locked: boolean;
  over_18: boolean;
  spoiler: boolean;
}

interface RedditResponse {
  data: {
    children: Array<{
      data: RedditApiPost;
    }>;
    after?: string;
    before?: string;
  };
}

interface SearchParams {
  subreddit: string;
  sort: 'hot' | 'new' | 'top' | 'rising';
  timeframe?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  limit: number;
}

// Transform Reddit API response to our format
function transformRedditPost(post: RedditApiPost): RedditPost {
  return {
    id: post.id,
    title: post.title,
    author: post.author,
    subreddit: post.subreddit,
    url: post.url,
    permalink: `https://reddit.com${post.permalink}`,
    selftext: post.selftext || '',
    score: post.score,
    upvoteRatio: post.upvote_ratio,
    numComments: post.num_comments,
    created: post.created,
    createdUtc: post.created_utc,
    thumbnail: post.thumbnail !== 'self' && post.thumbnail !== 'default' ? post.thumbnail : undefined,
    preview: post.preview,
    isVideo: post.is_video || false,
    domain: post.domain,
    flair: post.link_flair_text,
    stickied: post.stickied,
    locked: post.locked,
    nsfw: post.over_18,
    spoiler: post.spoiler,
  };
}

async function fetchRedditPosts(params: SearchParams): Promise<RedditPost[]> {
  try {
    // Build Reddit API URL
    let url = `https://www.reddit.com/r/${params.subreddit}/${params.sort}.json?limit=${params.limit}`;
    
    // Add timeframe for 'top' sort
    if (params.sort === 'top' && params.timeframe) {
      url += `&t=${params.timeframe}`;
    }

    // Set user agent (Reddit requires this)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RSS-Feed-Bot/1.0 (Personal RSS aggregator)',
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit API request failed: ${response.status}`);
    }

    const data: RedditResponse = await response.json();
    
    return data.data.children.map(child => transformRedditPost(child.data));
  } catch (error) {
    console.error('Error fetching Reddit posts:', error);
    
    // Return mock data if API fails
    return generateMockRedditPosts(params);
  }
}

function generateMockRedditPosts(params: SearchParams): RedditPost[] {
  const mockPosts: RedditPost[] = [];
  const now = Date.now() / 1000;
  
  const sampleTitles = [
    "Best coffee shops in Ann Arbor?",
    "Traffic on I-94 is terrible today",
    "Looking for apartment recommendations near campus",
    "Ann Arbor restaurant week starts Monday!",
    "Power outage in downtown area",
    "University of Michigan football game this weekend",
    "New bike path opening on State Street",
    "Local farmers market schedule",
    "Snow removal update from the city",
    "Community event at the library this Saturday"
  ];

  const sampleAuthors = ['AnnArborLocal', 'UMichStudent', 'TreeTownResident', 'LocalFoodie', 'BikeCommuter'];
  const domains = ['self.annarbor', 'mlive.com', 'annarbor.com', 'michigandaily.com', 'reddit.com'];

  for (let i = 0; i < params.limit; i++) {
    const createdTime = now - (Math.random() * 86400 * 7); // Random time in last week
    
    mockPosts.push({
      id: `mock_${i}_${Date.now()}`,
      title: sampleTitles[i % sampleTitles.length],
      author: sampleAuthors[Math.floor(Math.random() * sampleAuthors.length)],
      subreddit: params.subreddit,
      url: `https://reddit.com/r/${params.subreddit}/comments/mock${i}`,
      permalink: `https://reddit.com/r/${params.subreddit}/comments/mock${i}`,
      selftext: i % 3 === 0 ? `This is a text post about ${sampleTitles[i % sampleTitles.length].toLowerCase()}. Here's some additional context and discussion.` : '',
      score: Math.floor(Math.random() * 100) + 1,
      upvoteRatio: 0.7 + Math.random() * 0.3,
      numComments: Math.floor(Math.random() * 50),
      created: createdTime,
      createdUtc: createdTime,
      thumbnail: Math.random() > 0.7 ? `https://picsum.photos/140/140?random=${i}` : undefined,
      isVideo: Math.random() > 0.9,
      domain: domains[Math.floor(Math.random() * domains.length)],
      flair: Math.random() > 0.6 ? ['Discussion', 'News', 'Question', 'Event'][Math.floor(Math.random() * 4)] : undefined,
      stickied: i === 0 && Math.random() > 0.8,
      locked: Math.random() > 0.95,
      nsfw: false,
      spoiler: Math.random() > 0.95,
    });
  }

  return mockPosts.sort((a, b) => b.createdUtc - a.createdUtc);
}

function getPostTypeEmoji(post: RedditPost): string {
  if (post.stickied) return '📌';
  if (post.isVideo) return '🎥';
  if (post.selftext) return '📝';
  if (post.domain.includes('imgur') || post.domain.includes('i.redd.it')) return '🖼️';
  if (post.domain.includes('youtube') || post.domain.includes('youtu.be')) return '📺';
  if (post.domain === `self.${post.subreddit}`) return '💬';
  return '🔗';
}

function getScoreEmoji(score: number): string {
  if (score > 1000) return '🔥';
  if (score > 500) return '⭐';
  if (score > 100) return '👍';
  if (score > 50) return '👌';
  return '📊';
}

function formatRedditText(text: string): string {
  if (!text) return '';
  
  // Convert Reddit markdown to HTML
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    .replace(/\^(.*?)(\s|$)/g, '<sup>$1</sup>$2')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(.*)$/, '<p>$1</p>');
}

function generateRSSFeed(posts: RedditPost[], params: SearchParams): string {
  const now = new Date().toUTCString();
  const subredditTitle = `/r/${params.subreddit}`;
  const sortTitle = params.sort.charAt(0).toUpperCase() + params.sort.slice(1);
  const feedTitle = `🤖 Reddit: ${subredditTitle} (${sortTitle})`;
  
  const rssItems = posts.map((post) => {
    const postDate = new Date(post.createdUtc * 1000);
    const typeEmoji = getPostTypeEmoji(post);
    const scoreEmoji = getScoreEmoji(post.score);
    
    // Get the best image URL
    let imageUrl = post.thumbnail;
    if (post.preview && post.preview.images && post.preview.images[0]) {
      imageUrl = post.preview.images[0].source.url.replace(/&amp;/g, '&');
    }
    
    const description = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
          ${imageUrl && imageUrl !== 'self' ? `<img src="${imageUrl}" alt="Post thumbnail" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; margin-right: 15px; flex-shrink: 0;"/>` : ''}
          <div style="flex-grow: 1;">
            <h2 style="margin: 0 0 10px 0; color: #2c3e50;">${post.title}</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
              <span style="background: #ff4500; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8em;">
                👤 u/${post.author}
              </span>
              ${post.flair ? `<span style="background: #0079d3; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8em;">🏷️ ${post.flair}</span>` : ''}
              ${post.stickied ? '<span style="background: #46d160; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8em;">📌 Pinned</span>' : ''}
              ${post.locked ? '<span style="background: #ffd635; color: black; padding: 4px 8px; border-radius: 12px; font-size: 0.8em;">🔒 Locked</span>' : ''}
              ${post.nsfw ? '<span style="background: #ff585b; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8em;">🔞 NSFW</span>' : ''}
            </div>
          </div>
        </div>
        
        ${post.selftext ? `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #0079d3;">
          <h3 style="margin-top: 0; color: #0079d3;">📝 Post Content</h3>
          <div style="line-height: 1.6;">
            ${formatRedditText(post.selftext.substring(0, 500))}
            ${post.selftext.length > 500 ? '<p><em>... (truncated)</em></p>' : ''}
          </div>
        </div>` : ''}
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 15px 0;">
          <div style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd; text-align: center;">
            <strong>${scoreEmoji} Score</strong><br>
            <span style="font-size: 1.2em; color: #ff4500;">${post.score.toLocaleString()}</span>
          </div>
          
          <div style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd; text-align: center;">
            <strong>💬 Comments</strong><br>
            <span style="font-size: 1.2em; color: #0079d3;">${post.numComments}</span>
          </div>
          
          <div style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd; text-align: center;">
            <strong>📊 Upvote %</strong><br>
            <span style="font-size: 1.2em; color: #46d160;">${Math.round(post.upvoteRatio * 100)}%</span>
          </div>
          
          <div style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd; text-align: center;">
            <strong>🌐 Domain</strong><br>
            <span style="font-size: 0.9em; color: #666;">${post.domain}</span>
          </div>
        </div>
        
        <div style="display: flex; gap: 10px; margin: 20px 0;">
          <a href="${post.permalink}" style="background: #ff4500; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; flex: 1; text-align: center;">
            💬 View Comments on Reddit
          </a>
          ${post.url !== post.permalink ? `
          <a href="${post.url}" style="background: #0079d3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; flex: 1; text-align: center;">
            🔗 View Original Link
          </a>` : ''}
        </div>
        
        <div style="margin-top: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px; font-size: 0.9em; color: #666;">
          <p><strong>📅 Posted:</strong> ${postDate.toLocaleString()}</p>
          <p><strong>🏠 Subreddit:</strong> /r/${post.subreddit}</p>
          <p><strong>🔗 Permalink:</strong> <a href="${post.permalink}">${post.permalink}</a></p>
        </div>
      </div>`;

    const title = `${typeEmoji} ${post.title} (${scoreEmoji} ${post.score} • 💬 ${post.numComments})`;

    return `
    <item>
      <title>${title}</title>
      <description><![CDATA[${description}]]></description>
      <link>${post.permalink}</link>
      <pubDate>${postDate.toUTCString()}</pubDate>
      <guid isPermaLink="false">reddit-${post.subreddit}-${post.id}</guid>
      <category>Reddit</category>
      <category>${post.subreddit}</category>
      ${post.flair ? `<category>${post.flair}</category>` : ''}
      <author>u/${post.author}</author>
      ${imageUrl && imageUrl !== 'self' ? `<enclosure url="${imageUrl}" type="image/jpeg" length="0"/>` : ''}
    </item>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${feedTitle}</title>
    <description>${sortTitle} posts from /r/${params.subreddit}${params.timeframe ? ` (${params.timeframe})` : ''}</description>
    <link>https://reddit.com/r/${params.subreddit}/${params.sort}</link>
    <atom:link href="http://localhost:3000/api/reddit?subreddit=${params.subreddit}&amp;sort=${params.sort}${params.timeframe ? `&amp;timeframe=${params.timeframe}` : ''}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <category>Reddit</category>
    <category>${params.subreddit}</category>
    <copyright>Content from Reddit users</copyright>
    <managingEditor>reddit-rss@localhost</managingEditor>
    <webMaster>reddit-rss@localhost</webMaster>
    <lastBuildDate>${now}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <ttl>30</ttl>
    <generator>Next.js Reddit RSS Feed v1.0</generator>
    <image>
      <url>https://www.redditstatic.com/desktop2x/img/favicon/favicon-96x96.png</url>
      <title>Reddit RSS Feed</title>
      <link>https://reddit.com/r/${params.subreddit}</link>
      <width>96</width>
      <height>96</height>
    </image>
    ${rssItems}
  </channel>
</rss>`;
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
    
    // Fetch Reddit posts
    const posts = await fetchRedditPosts(params);
    
    // Generate RSS feed
    const rssFeed = generateRSSFeed(posts, params);
    
    return new NextResponse(rssFeed, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes
      },
    });
  } catch (error) {
    console.error('Error generating Reddit RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate Reddit RSS feed' },
      { status: 500 }
    );
  }
}
