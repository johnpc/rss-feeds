import { NextRequest, NextResponse } from 'next/server';

const RSS_BRIDGE_URL = 'https://rss-bridge.org/bridge01/?action=display&bridge=CssSelectorBridge&home_page=https%3A%2F%2Fwww.mlive.com%2Ftopic%2Flocal-aa%2Findex.html&url_selector=%23river+%3E+li+%3E+a&url_pattern=&content_selector=%23river+%3E+li+%3E+a+%3E+div.river-item__content+%3E+p&content_cleanup=&title_cleanup=&limit=25&format=Atom';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching MLive RSS feed from RSS-Bridge...', { url: request.url, method: request.method });
    
    // Fetch the RSS feed from RSS-Bridge
    const response = await fetch(RSS_BRIDGE_URL, {
      headers: {
        'User-Agent': 'RSS-Feed-Bot/1.0 (Personal RSS aggregator)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      console.error(`RSS-Bridge request failed: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { 
          error: 'Failed to fetch MLive RSS feed',
          status: response.status,
          statusText: response.statusText 
        },
        { status: response.status }
      );
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'application/xml';
    
    // Get the RSS content
    const rssContent = await response.text();
    
    console.log(`Successfully fetched MLive RSS feed (${rssContent.length} characters)`);

    // Return the RSS content with appropriate headers
    return new NextResponse(rssContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes
        'Access-Control-Allow-Origin': '*', // Allow CORS for RSS readers
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error fetching MLive RSS feed:', error);
    
    // Handle timeout errors specifically
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Request timeout - RSS-Bridge took too long to respond' },
        { status: 504 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { 
        error: 'Failed to fetch MLive RSS feed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  console.log('CORS preflight request for MLive RSS', { url: request.url, method: request.method });
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
