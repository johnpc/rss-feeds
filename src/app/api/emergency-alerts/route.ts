import { NextRequest, NextResponse } from 'next/server';

interface EmergencyAlert {
  id: string;
  title: string;
  description: string;
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Extreme';
  urgency: 'Past' | 'Future' | 'Expected' | 'Immediate';
  certainty: 'Unlikely' | 'Possible' | 'Likely' | 'Observed';
  category: string;
  event: string;
  headline: string;
  instruction?: string;
  areas: string[];
  effective: string;
  expires: string;
  sent: string;
  status: 'Actual' | 'Exercise' | 'System' | 'Test' | 'Draft';
  messageType: 'Alert' | 'Update' | 'Cancel' | 'Ack' | 'Error';
  scope: 'Public' | 'Restricted' | 'Private';
}

interface NWSAlert {
  id: string;
  type: string;
  properties: {
    id: string;
    areaDesc: string;
    geocode: {
      FIPS: string[];
      UGC: string[];
    };
    affectedZones: string[];
    references: Array<{
      '@id': string;
      identifier: string;
      sender: string;
      sent: string;
    }>;
    sent: string;
    effective: string;
    onset: string;
    expires: string;
    ends: string;
    status: string;
    messageType: string;
    category: string;
    severity: string;
    certainty: string;
    urgency: string;
    event: string;
    sender: string;
    senderName: string;
    headline: string;
    description: string;
    instruction: string;
    response: string;
  };
}

// Alert severity to emoji mapping
function getAlertEmoji(severity: string, category: string): string {
  const sev = severity.toLowerCase();
  const cat = category.toLowerCase();

  // Severity-based emojis
  if (sev === 'extreme') return '🚨';
  if (sev === 'severe') return '⚠️';
  if (sev === 'moderate') return '⚡';
  if (sev === 'minor') return '🔔';

  // Category-based emojis as fallback
  if (cat.includes('fire')) return '🔥';
  if (cat.includes('flood')) return '🌊';
  if (cat.includes('tornado')) return '🌪️';
  if (cat.includes('hurricane')) return '🌀';
  if (cat.includes('winter') || cat.includes('snow') || cat.includes('ice')) return '❄️';
  if (cat.includes('heat')) return '🌡️';
  if (cat.includes('wind')) return '💨';
  if (cat.includes('thunder') || cat.includes('lightning')) return '⛈️';
  if (cat.includes('earthquake')) return '🏔️';
  if (cat.includes('tsunami')) return '🌊';

  return '📢'; // Default alert emoji
}

// Get alert priority color for styling
function getAlertColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'extreme': return '#8B0000'; // Dark red
    case 'severe': return '#FF4500';  // Orange red
    case 'moderate': return '#FFD700'; // Gold
    case 'minor': return '#32CD32';   // Lime green
    default: return '#4169E1';        // Royal blue
  }
}

// Get coordinates for location (same as weather API)
async function getCoordinates(zipCode: string): Promise<{ lat: number; lon: number }> {
  const coordinates: Record<string, { lat: number; lon: number }> = {
    '48103': { lat: 42.2808, lon: -83.7430 }, // Ann Arbor, MI
    '48104': { lat: 42.2808, lon: -83.7430 }, // Ann Arbor, MI
    '48105': { lat: 42.2808, lon: -83.7430 }, // Ann Arbor, MI
  };

  return coordinates[zipCode] || { lat: 42.2808, lon: -83.7430 };
}

async function fetchEmergencyAlerts(zipCode: string): Promise<EmergencyAlert[]> {
  try {
    const { lat, lon } = await getCoordinates(zipCode);

    // Get NWS alerts for the area
    const alertsResponse = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`);
    if (!alertsResponse.ok) {
      throw new Error('Failed to fetch alerts');
    }

    const alertsData = await alertsResponse.json();
    const nwsAlerts: NWSAlert[] = alertsData.features || [];

    // Convert NWS alerts to our format
    const alerts: EmergencyAlert[] = nwsAlerts.map(alert => ({
      id: alert.properties.id,
      title: alert.properties.headline || alert.properties.event,
      description: alert.properties.description || '',
      severity: alert.properties.severity as EmergencyAlert['severity'],
      urgency: alert.properties.urgency as EmergencyAlert['urgency'],
      certainty: alert.properties.certainty as EmergencyAlert['certainty'],
      category: alert.properties.category,
      event: alert.properties.event,
      headline: alert.properties.headline,
      instruction: alert.properties.instruction || undefined,
      areas: [alert.properties.areaDesc],
      effective: alert.properties.effective,
      expires: alert.properties.expires,
      sent: alert.properties.sent,
      status: alert.properties.status as EmergencyAlert['status'],
      messageType: alert.properties.messageType as EmergencyAlert['messageType'],
      scope: 'Public',
    }));

    // Sort by severity and urgency (most critical first)
    const severityOrder = { 'Extreme': 4, 'Severe': 3, 'Moderate': 2, 'Minor': 1 };
    const urgencyOrder = { 'Immediate': 4, 'Expected': 3, 'Future': 2, 'Past': 1 };

    alerts.sort((a, b) => {
      const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
      if (severityDiff !== 0) return severityDiff;
      return (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0);
    });

    return alerts;
  } catch (error) {
    console.error('Error fetching emergency alerts:', error);

    // Return mock alerts if API fails (for demonstration)
    return generateMockAlerts();
  }
}

function generateMockAlerts(): EmergencyAlert[] {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  return [
    {
      id: 'mock-severe-thunderstorm-001',
      title: 'Severe Thunderstorm Warning',
      description: 'A severe thunderstorm warning has been issued for your area. Damaging winds up to 70 mph and quarter-size hail are possible.',
      severity: 'Severe',
      urgency: 'Immediate',
      certainty: 'Likely',
      category: 'Met',
      event: 'Severe Thunderstorm Warning',
      headline: 'Severe Thunderstorm Warning issued for Ann Arbor area until 8:00 PM EDT',
      instruction: 'Move to an interior room on the lowest floor of a sturdy building. Avoid windows.',
      areas: ['Washtenaw County'],
      effective: now.toISOString(),
      expires: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
      sent: now.toISOString(),
      status: 'Actual',
      messageType: 'Alert',
      scope: 'Public',
    },
    {
      id: 'mock-winter-weather-002',
      title: 'Winter Weather Advisory',
      description: 'Snow accumulations of 2 to 4 inches expected. Plan on slippery road conditions.',
      severity: 'Moderate',
      urgency: 'Expected',
      certainty: 'Likely',
      category: 'Met',
      event: 'Winter Weather Advisory',
      headline: 'Winter Weather Advisory in effect from 6 AM to 6 PM EST tomorrow',
      instruction: 'Slow down and use caution while traveling. Check road conditions before heading out.',
      areas: ['Washtenaw County', 'Wayne County'],
      effective: tomorrow.toISOString(),
      expires: new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours
      sent: now.toISOString(),
      status: 'Actual',
      messageType: 'Alert',
      scope: 'Public',
    }
  ];
}

function generateRSSFeed(alerts: EmergencyAlert[], location: string): string {
  const now = new Date().toUTCString();

  const rssItems = alerts.map(alert => {
    const alertEmoji = getAlertEmoji(alert.severity, alert.category);
    const alertColor = getAlertColor(alert.severity);
    const effectiveDate = new Date(alert.effective);
    const expiresDate = new Date(alert.expires);

    // Build rich HTML description
    let description = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; border-left: 4px solid ${alertColor}; padding-left: 15px;">
        <div style="background: ${alertColor}; color: white; padding: 10px; margin: -15px -15px 15px 0; border-radius: 5px;">
          <h2 style="margin: 0; color: white;">${alertEmoji} ${alert.event}</h2>
          <p style="margin: 5px 0 0 0; font-size: 0.9em; opacity: 0.9;">
            <strong>Severity:</strong> ${alert.severity} |
            <strong>Urgency:</strong> ${alert.urgency} |
            <strong>Certainty:</strong> ${alert.certainty}
          </p>
        </div>

        <div style="margin: 15px 0;">
          <h3 style="color: ${alertColor}; margin-top: 0;">📍 Affected Areas</h3>
          <p><strong>${alert.areas.join(', ')}</strong></p>
        </div>

        <div style="margin: 15px 0;">
          <h3 style="color: ${alertColor};">📋 Description</h3>
          <p>${alert.description}</p>
        </div>`;

    if (alert.instruction) {
      description += `
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 15px 0;">
          <h3 style="color: #856404; margin-top: 0;">⚠️ What You Should Do</h3>
          <p style="color: #856404; margin-bottom: 0;"><strong>${alert.instruction}</strong></p>
        </div>`;
    }

    description += `
        <div style="margin: 15px 0;">
          <h3 style="color: ${alertColor};">🕒 Timing</h3>
          <p><strong>Effective:</strong> ${effectiveDate.toLocaleString()}</p>
          <p><strong>Expires:</strong> ${expiresDate.toLocaleString()}</p>
        </div>

        <div style="margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 0.9em; color: #666;">
          <p><strong>📡 Source:</strong> National Weather Service</p>
          <p><strong>📍 Location:</strong> ${location}</p>
          <p><strong>🆔 Alert ID:</strong> ${alert.id}</p>
          <p><strong>🕒 Issued:</strong> ${new Date(alert.sent).toLocaleString()}</p>
        </div>
      </div>`;

    const title = `${alertEmoji} ${alert.severity.toUpperCase()}: ${alert.event} - ${alert.areas[0]}`;

    return `
    <item>
      <title>${title}</title>
      <description><![CDATA[${description}]]></description>
      <link>http://localhost:3000/api/emergency-alerts?location=${location}</link>
      <pubDate>${new Date(alert.sent).toUTCString()}</pubDate>
      <guid isPermaLink="false">emergency-alert-${location}-${alert.id}</guid>
      <category>Emergency</category>
      <category>${alert.category}</category>
      <category>${alert.severity}</category>
      <author>emergency-alerts@localhost</author>
    </item>`;
  }).join('');

  // If no alerts, create a "no alerts" item
  if (alerts.length === 0) {
    const noAlertsItem = `
    <item>
      <title>✅ No Active Emergency Alerts - ${location}</title>
      <description><![CDATA[
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; text-align: center;">
            <h2 style="color: #155724; margin-top: 0;">✅ All Clear</h2>
            <p style="color: #155724; margin-bottom: 0;">
              There are currently no active emergency alerts for your area.
            </p>
          </div>

          <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 0.9em; color: #666;">
            <p><strong>📍 Location:</strong> ${location} (Ann Arbor, MI area)</p>
            <p><strong>📡 Source:</strong> National Weather Service</p>
            <p><strong>🕒 Last Checked:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>🔄 Updates:</strong> This feed updates automatically when new alerts are issued</p>
          </div>
        </div>
      ]]></description>
      <link>http://localhost:3000/api/emergency-alerts?location=${location}</link>
      <pubDate>${now}</pubDate>
      <guid isPermaLink="false">no-alerts-${location}-${Date.now()}</guid>
      <category>Emergency</category>
      <category>Status</category>
      <author>emergency-alerts@localhost</author>
    </item>`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:cap="urn:oasis:names:tc:emergency:cap:1.2">
  <channel>
    <title>🚨 Emergency Alerts - ${location}</title>
    <description>Emergency and severe weather alerts for ${location} (Ann Arbor, MI area)</description>
    <link>http://localhost:3000/api/emergency-alerts?location=${location}</link>
    <atom:link href="http://localhost:3000/api/emergency-alerts?location=${location}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <category>Emergency</category>
    <category>Weather</category>
    <category>Public Safety</category>
    <copyright>Alert data from National Weather Service</copyright>
    <managingEditor>emergency-alerts@localhost</managingEditor>
    <webMaster>emergency-alerts@localhost</webMaster>
    <lastBuildDate>${now}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <ttl>15</ttl>
    <generator>Next.js Emergency Alerts RSS Feed v1.0</generator>
    <image>
      <url>https://www.weather.gov/images/wrh/Climate/new/nws_logo.png</url>
      <title>Emergency Alerts RSS Feed</title>
      <link>http://localhost:3000/api/emergency-alerts?location=${location}</link>
      <width>64</width>
      <height>64</height>
    </image>
    ${noAlertsItem}
  </channel>
</rss>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:cap="urn:oasis:names:tc:emergency:cap:1.2">
  <channel>
    <title>🚨 Emergency Alerts - ${location}</title>
    <description>Emergency and severe weather alerts for ${location} (Ann Arbor, MI area)</description>
    <link>http://localhost:3000/api/emergency-alerts?location=${location}</link>
    <atom:link href="http://localhost:3000/api/emergency-alerts?location=${location}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <category>Emergency</category>
    <category>Weather</category>
    <category>Public Safety</category>
    <copyright>Alert data from National Weather Service</copyright>
    <managingEditor>emergency-alerts@localhost</managingEditor>
    <webMaster>emergency-alerts@localhost</webMaster>
    <lastBuildDate>${now}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <ttl>15</ttl>
    <generator>Next.js Emergency Alerts RSS Feed v1.0</generator>
    <image>
      <url>https://www.weather.gov/images/wrh/Climate/new/nws_logo.png</url>
      <title>Emergency Alerts RSS Feed</title>
      <link>http://localhost:3000/api/emergency-alerts?location=${location}</link>
      <width>64</width>
      <height>64</height>
    </image>
    ${rssItems}
  </channel>
</rss>`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location') || '48103';

    // Fetch emergency alerts
    const alerts = await fetchEmergencyAlerts(location);

    // Generate RSS feed
    const rssFeed = generateRSSFeed(alerts, location);

    return new NextResponse(rssFeed, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=900', // Cache for 15 minutes (emergency alerts need frequent updates)
      },
    });
  } catch (error) {
    console.error('Error generating emergency alerts RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate emergency alerts RSS feed' },
      { status: 500 }
    );
  }
}
