import { NextRequest, NextResponse } from 'next/server';

interface TicketmasterEvent {
  id: string;
  name: string;
  type: string;
  url: string;
  locale: string;
  images: Array<{
    ratio: string;
    url: string;
    width: number;
    height: number;
    fallback: boolean;
  }>;
  sales: {
    public: {
      startDateTime: string;
      startTBD: boolean;
      startTBA: boolean;
      endDateTime: string;
    };
  };
  dates: {
    start: {
      localDate: string;
      localTime: string;
      dateTime: string;
      dateTBD: boolean;
      dateTBA: boolean;
      timeTBA: boolean;
      noSpecificTime: boolean;
    };
    status: {
      code: string;
    };
    spanMultipleDays: boolean;
  };
  classifications: Array<{
    primary: boolean;
    segment: {
      id: string;
      name: string;
    };
    genre: {
      id: string;
      name: string;
    };
    subGenre: {
      id: string;
      name: string;
    };
    type: {
      id: string;
      name: string;
    };
    subType: {
      id: string;
      name: string;
    };
    family: boolean;
  }>;
  promoter: {
    id: string;
    name: string;
    description: string;
  };
  promoters: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  info: string;
  pleaseNote: string;
  priceRanges: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  seatmap: {
    staticUrl: string;
  };
  accessibility: {
    ticketLimit: number;
    id: string;
  };
  ticketLimit: {
    info: string;
    id: string;
  };
  ageRestrictions: {
    legalAgeEnforced: boolean;
    id: string;
  };
  ticketing: {
    safeTix: {
      enabled: boolean;
      inAppOnlyEnabled: boolean;
    };
    allInclusivePricing: {
      enabled: boolean;
    };
    id: string;
  };
  _links: {
    self: {
      href: string;
    };
    attractions: Array<{
      href: string;
    }>;
    venues: Array<{
      href: string;
    }>;
  };
  _embedded: {
    venues: Array<{
      name: string;
      type: string;
      id: string;
      test: boolean;
      url: string;
      locale: string;
      images: Array<{
        ratio: string;
        url: string;
        width: number;
        height: number;
        fallback: boolean;
      }>;
      postalCode: string;
      timezone: string;
      city: {
        name: string;
      };
      state: {
        name: string;
        stateCode: string;
      };
      country: {
        name: string;
        countryCode: string;
      };
      address: {
        line1: string;
      };
      location: {
        longitude: string;
        latitude: string;
      };
      markets: Array<{
        name: string;
        id: string;
      }>;
      dmas: Array<{
        id: number;
      }>;
      social: {
        twitter: {
          handle: string;
        };
      };
      boxOfficeInfo: {
        phoneNumberDetail: string;
        openHoursDetail: string;
        acceptedPaymentDetail: string;
        willCallDetail: string;
      };
      parkingDetail: string;
      accessibleSeatingDetail: string;
      generalInfo: {
        generalRule: string;
        childRule: string;
      };
      upcomingEvents: {
        ticketmaster: number;
        _total: number;
        _filtered: number;
      };
      ada: {
        adaPhones: string;
        adaCustomCopy: string;
        adaHours: string;
      };
      _links: {
        self: {
          href: string;
        };
      };
    }>;
    attractions: Array<{
      name: string;
      type: string;
      id: string;
      test: boolean;
      url: string;
      locale: string;
      externalLinks: {
        youtube: Array<{
          url: string;
        }>;
        twitter: Array<{
          url: string;
        }>;
        itunes: Array<{
          url: string;
        }>;
        lastfm: Array<{
          url: string;
        }>;
        facebook: Array<{
          url: string;
        }>;
        spotify: Array<{
          url: string;
        }>;
        instagram: Array<{
          url: string;
        }>;
        musicbrainz: Array<{
          id: string;
        }>;
        homepage: Array<{
          url: string;
        }>;
      };
      images: Array<{
        ratio: string;
        url: string;
        width: number;
        height: number;
        fallback: boolean;
      }>;
      classifications: Array<{
        primary: boolean;
        segment: {
          id: string;
          name: string;
        };
        genre: {
          id: string;
          name: string;
        };
        subGenre: {
          id: string;
          name: string;
        };
        type: {
          id: string;
          name: string;
        };
        subType: {
          id: string;
          name: string;
        };
        family: boolean;
      }>;
      upcomingEvents: {
        ticketmaster: number;
        _total: number;
        _filtered: number;
      };
      _links: {
        self: {
          href: string;
        };
      };
    }>;
  };
}

interface ProcessedEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  state: string;
  address: string;
  url: string;
  image: string;
  category: string;
  genre: string;
  priceRange: string;
  description: string;
  saleStart: string;
  saleEnd: string;
}

// Get event category emoji
function getEventEmoji(category: string, genre: string): string {
  const cat = category.toLowerCase();
  const gen = genre.toLowerCase();

  if (cat.includes('music') || gen.includes('music')) {
    if (gen.includes('rock') || gen.includes('metal')) return '🎸';
    if (gen.includes('pop') || gen.includes('dance')) return '🎤';
    if (gen.includes('country')) return '🤠';
    if (gen.includes('jazz') || gen.includes('blues')) return '🎷';
    if (gen.includes('classical')) return '🎼';
    if (gen.includes('hip hop') || gen.includes('rap')) return '🎧';
    return '🎵';
  }

  if (cat.includes('sports')) {
    if (gen.includes('football')) return '🏈';
    if (gen.includes('basketball')) return '🏀';
    if (gen.includes('baseball')) return '⚾';
    if (gen.includes('hockey')) return '🏒';
    if (gen.includes('soccer')) return '⚽';
    return '🏟️';
  }

  if (cat.includes('arts') || cat.includes('theatre')) return '🎭';
  if (cat.includes('family')) return '👨‍👩‍👧‍👦';
  if (cat.includes('comedy')) return '😂';
  if (cat.includes('film')) return '🎬';

  return '🎪'; // Default event emoji
}

// Process events data into our format
function processEventsData(events: TicketmasterEvent[]): ProcessedEvent[] {
  const processedEvents: ProcessedEvent[] = events.map(event => {
    const venue = event._embedded?.venues?.[0];
    const classification = event.classifications?.[0];
    const image = event.images?.find(img => img.ratio === '16_9') || event.images?.[0];
    const priceRange = event.priceRanges?.[0];

    return {
      id: event.id,
      name: event.name,
      date: event.dates?.start?.localDate || '',
      time: event.dates?.start?.localTime || '',
      venue: venue?.name || 'TBA',
      city: venue?.city?.name || '',
      state: venue?.state?.stateCode || '',
      address: venue?.address?.line1 || '',
      url: event.url,
      image: image?.url || '',
      category: classification?.segment?.name || 'Event',
      genre: classification?.genre?.name || 'General',
      priceRange: priceRange ? `$${priceRange.min} - $${priceRange.max}` : 'TBA',
      description: event.info || event.pleaseNote || '',
      saleStart: event.sales?.public?.startDateTime || '',
      saleEnd: event.sales?.public?.endDateTime || '',
    };
  });

  // Sort by date
  processedEvents.sort((a, b) => {
    const dateA = new Date(a.date + (a.time ? ` ${a.time}` : ''));
    const dateB = new Date(b.date + (b.time ? ` ${b.time}` : ''));
    return dateA.getTime() - dateB.getTime();
  });

  return processedEvents;
}

// Fetch Ticketmaster events using Discovery API
async function fetchTicketmasterEvents(): Promise<ProcessedEvent[]> {
  if (!process.env.TICKETMASTER_API_KEY) {
    throw new Error('TICKETMASTER_API_KEY environment variable is not set');
  }

  console.log(`[${new Date().toISOString()}] Starting Ticketmaster events fetch using Discovery API`);

  // Ann Arbor area coordinates and radius
  const latitude = 42.2808;
  const longitude = -83.7430;
  const radius = 25; // miles
  const size = 200; // max events per request

  // Build API URL with geographic filtering
  const apiUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${process.env.TICKETMASTER_API_KEY}&latlong=${latitude},${longitude}&radius=${radius}&unit=miles&size=${size}&sort=date,asc`;
  
  console.log(`[${new Date().toISOString()}] API URL: ${apiUrl.replace(process.env.TICKETMASTER_API_KEY, '[REDACTED]')}`);
  console.log(`[${new Date().toISOString()}] Searching within ${radius} miles of Ann Arbor (${latitude}, ${longitude})`);

  try {
    // Fetch events from Discovery API
    console.log(`[${new Date().toISOString()}] Fetching events from Ticketmaster Discovery API...`);
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.error(`[${new Date().toISOString()}] API request failed: ${response.status} ${response.statusText}`);
      console.error(`[${new Date().toISOString()}] Error response: ${errorText}`);
      throw new Error(`Failed to fetch events from Ticketmaster Discovery API: ${response.status} ${response.statusText}`);
    }

    console.log(`[${new Date().toISOString()}] API response received, content-type: ${response.headers.get('content-type')}`);

    // Parse the JSON response
    const eventsData = await response.json();
    const events: TicketmasterEvent[] = eventsData._embedded?.events || [];

    console.log(`[${new Date().toISOString()}] Found ${events.length} events in Ann Arbor area`);

    // Log some sample events for debugging
    if (events.length > 0) {
      console.log(`[${new Date().toISOString()}] Sample events:`);
      events.slice(0, 3).forEach((event, index) => {
        const venue = event._embedded?.venues?.[0];
        console.log(`[${new Date().toISOString()}]   ${index + 1}. ${event.name} at ${venue?.name} (${venue?.city?.name}, ${venue?.state?.stateCode})`);
      });
    }

    // Process events into our format
    const processedEvents = processEventsData(events);
    
    console.log(`[${new Date().toISOString()}] Processed ${processedEvents.length} events successfully`);
    return processedEvents;

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching Ticketmaster events:`, error);
    throw error;
  }
}

function generateRSSFeed(events: ProcessedEvent[], location: string): string {
  const now = new Date().toUTCString();

  const rssItems = events.map(event => {
    const eventEmoji = getEventEmoji(event.category, event.genre);
    const eventDate = new Date(event.date + (event.time ? ` ${event.time}` : ''));
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = event.time ? eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    }) : 'Time TBA';

    // Build rich HTML description
    let description = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: white;">${eventEmoji} ${event.name}</h2>
          <p style="margin: 10px 0 0 0; font-size: 1.1em; opacity: 0.9;">
            <strong>📅 ${formattedDate}</strong> at <strong>🕐 ${formattedTime}</strong>
          </p>
        </div>`;

    // Add event image if available
    if (event.image) {
      description += `
        <div style="text-align: center; margin: 20px 0;">
          <img src="${event.image}" alt="${event.name}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);"/>
        </div>`;
    }

    description += `
        <div style="display: grid; gap: 15px; margin: 20px 0;">
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
            <h3 style="color: #495057; margin-top: 0;">📍 Venue Information</h3>
            <p><strong>🏟️ Venue:</strong> ${event.venue}</p>
            <p><strong>🏙️ Location:</strong> ${event.city}, ${event.state}</p>`;

    if (event.address) {
      description += `<p><strong>📮 Address:</strong> ${event.address}</p>`;
    }

    description += `
          </div>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px;">
            <h3 style="color: #1976d2; margin-top: 0;">🎫 Event Details</h3>
            <p><strong>🎭 Category:</strong> ${event.category}</p>
            <p><strong>🎪 Genre:</strong> ${event.genre}</p>
            <p><strong>💰 Price Range:</strong> ${event.priceRange}</p>
          </div>`;

    if (event.description) {
      description += `
          <div style="background: #fff3e0; padding: 15px; border-radius: 8px;">
            <h3 style="color: #f57c00; margin-top: 0;">ℹ️ Description</h3>
            <p>${event.description}</p>
          </div>`;
    }

    // Add ticket sale information
    if (event.saleStart || event.saleEnd) {
      description += `
          <div style="background: #f3e5f5; padding: 15px; border-radius: 8px;">
            <h3 style="color: #7b1fa2; margin-top: 0;">🎟️ Ticket Sales</h3>`;

      if (event.saleStart) {
        const saleStartDate = new Date(event.saleStart);
        description += `<p><strong>🚀 Sales Start:</strong> ${saleStartDate.toLocaleString()}</p>`;
      }

      if (event.saleEnd) {
        const saleEndDate = new Date(event.saleEnd);
        description += `<p><strong>⏰ Sales End:</strong> ${saleEndDate.toLocaleString()}</p>`;
      }

      description += `</div>`;
    }

    description += `
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <a href="${event.url}" target="_blank" style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
            🎫 Buy Tickets on Ticketmaster
          </a>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 0.9em; color: #666;">
          <p><strong>📍 Location:</strong> ${location} (Ann Arbor, MI area)</p>
          <p><strong>🎫 Source:</strong> Ticketmaster</p>
          <p><strong>🆔 Event ID:</strong> ${event.id}</p>
          <p><strong>🕒 Last Updated:</strong> ${new Date().toLocaleString()}</p>
        </div>
      </div>`;

    const title = `${eventEmoji} ${event.name} - ${formattedDate} at ${event.venue}`;

    return `
    <item>
      <title>${title}</title>
      <description><![CDATA[${description}]]></description>
      <link>${event.url}</link>
      <pubDate>${eventDate.toUTCString()}</pubDate>
      <guid isPermaLink="false">ticketmaster-event-${location}-${event.id}</guid>
      <category>Events</category>
      <category>${event.category}</category>
      <category>${event.genre}</category>
      <author>ticketmaster-events@localhost</author>
      ${event.image ? `<enclosure url="${event.image}" type="image/jpeg" length="0"/>` : ''}
    </item>`;
  }).join('');

  // If no events, create a "no events" item
  if (events.length === 0) {
    const noEventsItem = `
    <item>
      <title>🎪 No Upcoming Events Found - ${location}</title>
      <description><![CDATA[
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <div style="background: #e8f5e8; border: 1px solid #c3e6cb; padding: 20px; border-radius: 10px; text-align: center;">
            <h2 style="color: #155724; margin-top: 0;">🎪 No Events Currently Listed</h2>
            <p style="color: #155724; margin-bottom: 0;">
              There are currently no upcoming events listed for the Ann Arbor area.
              Check back later for new events!
            </p>
          </div>

          <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 0.9em; color: #666;">
            <p><strong>📍 Location:</strong> ${location} (Ann Arbor, MI area)</p>
            <p><strong>🎫 Source:</strong> Ticketmaster</p>
            <p><strong>🕒 Last Checked:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>🔄 Updates:</strong> This feed updates regularly with new events</p>
          </div>
        </div>
      ]]></description>
      <link>http://localhost:3000/api/ticketmaster-events?location=${location}</link>
      <pubDate>${now}</pubDate>
      <guid isPermaLink="false">no-events-${location}-${Date.now()}</guid>
      <category>Events</category>
      <category>Status</category>
      <author>ticketmaster-events@localhost</author>
    </item>`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>🎪 Ticketmaster Events - ${location}</title>
    <description>Upcoming events and entertainment in ${location} (Ann Arbor, MI area) from Ticketmaster</description>
    <link>http://localhost:3000/api/ticketmaster-events?location=${location}</link>
    <atom:link href="http://localhost:3000/api/ticketmaster-events?location=${location}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <category>Events</category>
    <category>Entertainment</category>
    <category>Ticketmaster</category>
    <copyright>Event data from Ticketmaster</copyright>
    <managingEditor>ticketmaster-events@localhost</managingEditor>
    <webMaster>ticketmaster-events@localhost</webMaster>
    <lastBuildDate>${now}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <ttl>360</ttl>
    <generator>Next.js Ticketmaster Events RSS Feed v1.0</generator>
    <image>
      <url>https://www.ticketmaster.com/favicon.ico</url>
      <title>Ticketmaster Events RSS Feed</title>
      <link>http://localhost:3000/api/ticketmaster-events?location=${location}</link>
      <width>32</width>
      <height>32</height>
    </image>
    ${noEventsItem}
  </channel>
</rss>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>🎪 Ticketmaster Events - ${location}</title>
    <description>Upcoming events and entertainment in ${location} (Ann Arbor, MI area) from Ticketmaster</description>
    <link>http://localhost:3000/api/ticketmaster-events?location=${location}</link>
    <atom:link href="http://localhost:3000/api/ticketmaster-events?location=${location}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <category>Events</category>
    <category>Entertainment</category>
    <category>Ticketmaster</category>
    <copyright>Event data from Ticketmaster</copyright>
    <managingEditor>ticketmaster-events@localhost</managingEditor>
    <webMaster>ticketmaster-events@localhost</webMaster>
    <lastBuildDate>${now}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <ttl>360</ttl>
    <generator>Next.js Ticketmaster Events RSS Feed v1.0</generator>
    <image>
      <url>https://www.ticketmaster.com/favicon.ico</url>
      <title>Ticketmaster Events RSS Feed</title>
      <link>http://localhost:3000/api/ticketmaster-events?location=${location}</link>
      <width>32</width>
      <height>32</height>
    </image>
    ${rssItems}
  </channel>
</rss>`;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] RSS feed request started`);

  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location') || '48103';

    console.log(`[${new Date().toISOString()}] Request parameters - location: ${location}`);

    // Fetch Ticketmaster events
    console.log(`[${new Date().toISOString()}] Fetching Ticketmaster events...`);
    const events = await fetchTicketmasterEvents();

    // Generate RSS feed
    console.log(`[${new Date().toISOString()}] Generating RSS feed with ${events.length} events...`);
    const rssFeed = generateRSSFeed(events, location);

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] RSS feed generated successfully in ${duration}ms`);

    return new NextResponse(rssFeed, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] Error generating Ticketmaster events RSS feed after ${duration}ms:`, error);

    // Log the full error details
    if (error instanceof Error) {
      console.error(`[${new Date().toISOString()}] Error name: ${error.name}`);
      console.error(`[${new Date().toISOString()}] Error message: ${error.message}`);
      console.error(`[${new Date().toISOString()}] Error stack: ${error.stack}`);
    }

    return NextResponse.json(
      {
        error: 'Failed to generate Ticketmaster events RSS feed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
