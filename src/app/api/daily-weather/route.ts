import { NextRequest, NextResponse } from 'next/server';

interface WeatherData {
  date: string;
  temperature: {
    high: number;
    low: number;
  };
  description: string;
  humidity?: number;
  windSpeed?: number;
  precipitationChance?: number;
  icon?: string;
  windDirection?: string;
}

interface NWSForecast {
  properties: {
    periods: Array<{
      number: number;
      name: string;
      startTime: string;
      temperature: number;
      temperatureUnit: string;
      windSpeed: string;
      windDirection: string;
      shortForecast: string;
      detailedForecast: string;
      icon: string;
      probabilityOfPrecipitation?: {
        value: number;
      };
      relativeHumidity?: {
        value: number;
      };
    }>;
  };
}

// Weather condition to emoji mapping
function getWeatherEmoji(description: string): string {
  const desc = description.toLowerCase();
  
  if (desc.includes('sunny') || desc.includes('clear')) return '☀️';
  if (desc.includes('partly cloudy') || desc.includes('partly sunny')) return '⛅';
  if (desc.includes('mostly cloudy') || desc.includes('overcast')) return '☁️';
  if (desc.includes('cloudy')) return '🌤️';
  if (desc.includes('rain') && desc.includes('thunder')) return '⛈️';
  if (desc.includes('thunderstorm') || desc.includes('thunder')) return '🌩️';
  if (desc.includes('heavy rain') || desc.includes('downpour')) return '🌧️';
  if (desc.includes('rain') || desc.includes('shower')) return '🌦️';
  if (desc.includes('drizzle')) return '🌦️';
  if (desc.includes('snow') && desc.includes('heavy')) return '❄️';
  if (desc.includes('snow')) return '🌨️';
  if (desc.includes('sleet')) return '🌨️';
  if (desc.includes('hail')) return '🌨️';
  if (desc.includes('fog') || desc.includes('mist')) return '🌫️';
  if (desc.includes('windy') || desc.includes('breezy')) return '💨';
  if (desc.includes('hot')) return '🌡️';
  if (desc.includes('cold') || desc.includes('freezing')) return '🥶';
  
  return '🌤️'; // Default
}
// Get coordinates for Ann Arbor, MI (48103)
async function getCoordinates(zipCode: string): Promise<{ lat: number; lon: number }> {
  // For 48103 (Ann Arbor, MI), we'll use known coordinates
  // In a production app, you might use a geocoding service
  const coordinates: Record<string, { lat: number; lon: number }> = {
    '48103': { lat: 42.2808, lon: -83.7430 }, // Ann Arbor, MI
    '48104': { lat: 42.2808, lon: -83.7430 }, // Ann Arbor, MI
    '48105': { lat: 42.2808, lon: -83.7430 }, // Ann Arbor, MI
  };

  return coordinates[zipCode] || { lat: 42.2808, lon: -83.7430 };
}

async function fetchWeatherData(zipCode: string): Promise<WeatherData[]> {
  try {
    const { lat, lon } = await getCoordinates(zipCode);

    // Get NWS grid point
    const gridResponse = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
    if (!gridResponse.ok) {
      throw new Error('Failed to get grid point');
    }

    const gridData = await gridResponse.json();
    const forecastUrl = gridData.properties.forecast;

    // Get forecast
    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) {
      throw new Error('Failed to get forecast');
    }

    const forecastData: NWSForecast = await forecastResponse.json();

    // Process forecast data into our format
    const weatherData: WeatherData[] = [];
    const periods = forecastData.properties.periods;

    // Group periods by day (day/night pairs)
    for (let i = 0; i < Math.min(periods.length, 14); i += 2) {
      const dayPeriod = periods[i];
      const nightPeriod = periods[i + 1];

      if (!dayPeriod) continue;

      const date = new Date(dayPeriod.startTime);

      weatherData.push({
        date: date.toISOString().split('T')[0],
        temperature: {
          high: dayPeriod.temperature,
          low: nightPeriod?.temperature || dayPeriod.temperature - 15,
        },
        description: dayPeriod.shortForecast,
        precipitationChance: dayPeriod.probabilityOfPrecipitation?.value,
        humidity: dayPeriod.relativeHumidity?.value,
        windSpeed: parseInt(dayPeriod.windSpeed.split(' ')[0]) || undefined,
        windDirection: dayPeriod.windDirection,
        icon: dayPeriod.icon,
      });

      if (weatherData.length >= 7) break;
    }

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);

    // Fallback to mock data if API fails
    return generateMockWeatherData();
  }
}

function generateMockWeatherData(): WeatherData[] {
  const mockData: WeatherData[] = [];
  const today = new Date();
  const conditions = [
    { desc: 'Sunny', icon: 'https://api.weather.gov/icons/land/day/skc?size=medium' },
    { desc: 'Partly Cloudy', icon: 'https://api.weather.gov/icons/land/day/sct?size=medium' },
    { desc: 'Cloudy', icon: 'https://api.weather.gov/icons/land/day/ovc?size=medium' },
    { desc: 'Light Rain', icon: 'https://api.weather.gov/icons/land/day/rain_light?size=medium' },
    { desc: 'Thunderstorms', icon: 'https://api.weather.gov/icons/land/day/tsra?size=medium' }
  ];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    mockData.push({
      date: date.toISOString().split('T')[0],
      temperature: {
        high: Math.floor(Math.random() * 20) + 70, // 70-90°F
        low: Math.floor(Math.random() * 15) + 50,  // 50-65°F
      },
      description: condition.desc,
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      windSpeed: Math.floor(Math.random() * 15) + 5,  // 5-20 mph
      windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
      precipitationChance: Math.floor(Math.random() * 100),
      icon: condition.icon,
    });
  }

  return mockData;
}

function generateRSSFeed(weatherData: WeatherData[], location: string): string {
  const now = new Date().toUTCString();

  const rssItems = weatherData.map(day => {
    const dayDate = new Date(day.date);
    const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
    const weatherEmoji = getWeatherEmoji(day.description);

    // Build description with available data and weather icon
    let description = `
      <div style="font-family: Arial, sans-serif;">
        <h3>${weatherEmoji} ${dayName}, ${dayDate.toLocaleDateString()}</h3>`;
    
    // Add weather icon if available from NWS
    if (day.icon) {
      description += `<p><img src="${day.icon}" alt="${day.description}" style="width: 64px; height: 64px; vertical-align: middle; margin-right: 10px;"/></p>`;
    }
    
    description += `
        <p><strong>🌡️ Temperature:</strong> High ${day.temperature.high}°F, Low ${day.temperature.low}°F</p>
        <p><strong>☁️ Conditions:</strong> ${day.description}</p>`;

    if (day.precipitationChance !== undefined) {
      description += `<p><strong>🌧️ Precipitation Chance:</strong> ${day.precipitationChance}%</p>`;
    }

    if (day.humidity !== undefined) {
      description += `<p><strong>💧 Humidity:</strong> ${day.humidity}%</p>`;
    }

    if (day.windSpeed !== undefined && day.windDirection) {
      description += `<p><strong>💨 Wind:</strong> ${day.windDirection} ${day.windSpeed} mph</p>`;
    } else if (day.windSpeed !== undefined) {
      description += `<p><strong>💨 Wind Speed:</strong> ${day.windSpeed} mph</p>`;
    }
    
    description += `</div>`;

    // Create a more descriptive title with emoji
    const title = `${weatherEmoji} ${dayName} - ${day.temperature.high}°/${day.temperature.low}°F - ${day.description}`;

    return `
    <item>
      <title>${title}</title>
      <description><![CDATA[${description}]]></description>
      <link>http://localhost:3000/api/weather?location=${location}</link>
      <pubDate>${dayDate.toUTCString()}</pubDate>
      <guid isPermaLink="false">weather-${location}-${day.date}</guid>
      <category>Weather</category>
      <author>weather-rss@localhost</author>
      ${day.icon ? `<enclosure url="${day.icon}" type="image/png" length="0"/>` : ''}
    </item>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:weather="http://localhost:3000/weather">
  <channel>
    <title>🌤️ 7-Day Weather Forecast - ${location}</title>
    <description>Daily weather forecast for ${location} (Ann Arbor, MI area) with icons and detailed conditions</description>
    <link>http://localhost:3000/api/weather?location=${location}</link>
    <atom:link href="http://localhost:3000/api/weather?location=${location}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <category>Weather</category>
    <copyright>Weather data from National Weather Service</copyright>
    <managingEditor>weather-rss@localhost</managingEditor>
    <webMaster>weather-rss@localhost</webMaster>
    <lastBuildDate>${now}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <ttl>360</ttl>
    <generator>Next.js Weather RSS Feed v1.1</generator>
    <image>
      <url>https://api.weather.gov/icons/land/day/skc?size=small</url>
      <title>Weather RSS Feed</title>
      <link>http://localhost:3000/api/weather?location=${location}</link>
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

    // Fetch weather data
    const weatherData = await fetchWeatherData(location);

    // Generate RSS feed
    const rssFeed = generateRSSFeed(weatherData, location);

    return new NextResponse(rssFeed, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating weather RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate weather RSS feed' },
      { status: 500 }
    );
  }
}
