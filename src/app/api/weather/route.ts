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

interface WeeklyForecast {
  startDate: string;
  endDate: string;
  days: WeatherData[];
  summary: {
    avgHigh: number;
    avgLow: number;
    dominantCondition: string;
    totalPrecipChance: number;
    emoji: string;
  };
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

function generateWeeklyForecasts(weatherData: WeatherData[]): WeeklyForecast[] {
  const forecasts: WeeklyForecast[] = [];
  
  // Generate 3 weekly forecasts starting from different days
  for (let startOffset = 0; startOffset < 3; startOffset++) {
    const weekDays = weatherData.slice(startOffset, startOffset + 7);
    if (weekDays.length < 7) break;
    
    // Calculate summary statistics
    const avgHigh = Math.round(weekDays.reduce((sum, day) => sum + day.temperature.high, 0) / weekDays.length);
    const avgLow = Math.round(weekDays.reduce((sum, day) => sum + day.temperature.low, 0) / weekDays.length);
    
    // Find dominant weather condition
    const conditionCounts: Record<string, number> = {};
    weekDays.forEach(day => {
      conditionCounts[day.description] = (conditionCounts[day.description] || 0) + 1;
    });
    const dominantCondition = Object.keys(conditionCounts).reduce((a, b) => 
      conditionCounts[a] > conditionCounts[b] ? a : b
    );
    
    // Calculate average precipitation chance
    const precipChances = weekDays.filter(day => day.precipitationChance !== undefined);
    const totalPrecipChance = precipChances.length > 0 
      ? Math.round(precipChances.reduce((sum, day) => sum + (day.precipitationChance || 0), 0) / precipChances.length)
      : 0;
    
    forecasts.push({
      startDate: weekDays[0].date,
      endDate: weekDays[weekDays.length - 1].date,
      days: weekDays,
      summary: {
        avgHigh,
        avgLow,
        dominantCondition,
        totalPrecipChance,
        emoji: getWeatherEmoji(dominantCondition),
      }
    });
  }
  
  return forecasts;
}

function generateRSSFeed(weeklyForecasts: WeeklyForecast[], location: string): string {
  const now = new Date().toUTCString();

  const rssItems = weeklyForecasts.map((forecast, index) => {
    const startDate = new Date(forecast.startDate);
    const weekTitle = `7 Day Forecast starting ${startDate.toLocaleDateString()}`;
    
    // Build detailed weekly description
    let description = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>${forecast.summary.emoji} ${weekTitle}</h2>
        
        <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 10px 0;">
          <h3>📊 Week Summary</h3>
          <p><strong>🌡️ Average Temperature:</strong> High ${forecast.summary.avgHigh}°F, Low ${forecast.summary.avgLow}°F</p>
          <p><strong>☁️ Dominant Conditions:</strong> ${forecast.summary.dominantCondition}</p>
          <p><strong>🌧️ Average Precipitation Chance:</strong> ${forecast.summary.totalPrecipChance}%</p>
        </div>
        
        <h3>📅 Daily Breakdown</h3>
        <div style="display: grid; gap: 10px;">`;
    
    // Add each day's details
    forecast.days.forEach(day => {
      const dayDate = new Date(day.date);
      const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
      const emoji = getWeatherEmoji(day.description);
      
      description += `
        <div style="border: 1px solid #ddd; padding: 10px; border-radius: 5px; background: white;">
          <h4>${emoji} ${dayName}, ${dayDate.toLocaleDateString()}</h4>`;
      
      if (day.icon) {
        description += `<img src="${day.icon}" alt="${day.description}" style="width: 48px; height: 48px; float: right;"/>`;
      }
      
      description += `
          <p><strong>🌡️</strong> ${day.temperature.high}°/${day.temperature.low}°F</p>
          <p><strong>☁️</strong> ${day.description}</p>`;
      
      if (day.precipitationChance !== undefined) {
        description += `<p><strong>🌧️</strong> ${day.precipitationChance}% chance of precipitation</p>`;
      }
      
      if (day.windSpeed !== undefined && day.windDirection) {
        description += `<p><strong>💨</strong> ${day.windDirection} ${day.windSpeed} mph</p>`;
      }
      
      if (day.humidity !== undefined) {
        description += `<p><strong>💧</strong> ${day.humidity}% humidity</p>`;
      }
      
      description += `</div>`;
    });
    
    description += `
        </div>
        
        <div style="margin-top: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px; font-size: 0.9em; color: #666;">
          <p><strong>📍 Location:</strong> ${location} (Ann Arbor, MI area)</p>
          <p><strong>📡 Data Source:</strong> National Weather Service</p>
          <p><strong>🕒 Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
      </div>`;

    const title = `${forecast.summary.emoji} 7 Day Forecast starting ${startDate.toLocaleDateString()} - Avg ${forecast.summary.avgHigh}°/${forecast.summary.avgLow}°F - ${forecast.summary.dominantCondition}`;

    return `
    <item>
      <title>${title}</title>
      <description><![CDATA[${description}]]></description>
      <link>http://localhost:3000/api/weather?location=${location}</link>
      <pubDate>${startDate.toUTCString()}</pubDate>
      <guid isPermaLink="false">weekly-weather-${location}-${forecast.startDate}-${index}</guid>
      <category>Weather</category>
      <category>Weekly Forecast</category>
      <author>weather-rss@localhost</author>
      ${forecast.days[0]?.icon ? `<enclosure url="${forecast.days[0].icon}" type="image/png" length="0"/>` : ''}
    </item>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:weather="http://localhost:3000/weather">
  <channel>
    <title>📅 Weekly Weather Forecasts - ${location}</title>
    <description>7-day weather forecasts starting from different days for ${location} (Ann Arbor, MI area)</description>
    <link>http://localhost:3000/api/weather?location=${location}</link>
    <atom:link href="http://localhost:3000/api/weather?location=${location}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <category>Weather</category>
    <category>Weekly Forecast</category>
    <copyright>Weather data from National Weather Service</copyright>
    <managingEditor>weather-rss@localhost</managingEditor>
    <webMaster>weather-rss@localhost</webMaster>
    <lastBuildDate>${now}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <ttl>360</ttl>
    <generator>Next.js Weekly Weather RSS Feed v2.0</generator>
    <image>
      <url>https://api.weather.gov/icons/land/day/few?size=small</url>
      <title>Weekly Weather RSS Feed</title>
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
    
    // Generate weekly forecasts
    const weeklyForecasts = generateWeeklyForecasts(weatherData);
    
    // Generate RSS feed
    const rssFeed = generateRSSFeed(weeklyForecasts, location);
    
    return new NextResponse(rssFeed, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating weekly weather RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate weekly weather RSS feed' },
      { status: 500 }
    );
  }
}
