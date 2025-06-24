export default function WeatherPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">📅 Weekly Weather RSS Feed</h1>
      
      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">RSS Feed URLs</h2>
        <div className="space-y-2">
          <div>
            <strong>Weekly Forecasts:</strong>
            <code className="bg-white p-2 rounded block mt-1">
              http://localhost:3000/api/weather?location=48103
            </code>
          </div>
          <div>
            <strong>Daily Forecasts:</strong>
            <code className="bg-white p-2 rounded block mt-1">
              http://localhost:3000/api/daily-weather?location=48103
            </code>
          </div>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">📅 Weekly Format Features:</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Multiple Week Views</strong> - 3 different 7-day periods</li>
            <li><strong>Week Summaries</strong> - Average temps & dominant conditions</li>
            <li><strong>Daily Breakdowns</strong> - Full details for each day</li>
            <li><strong>Rich HTML</strong> - Styled cards with weather icons</li>
            <li><strong>Weather Statistics</strong> - Precipitation averages</li>
            <li><strong>Visual Design</strong> - Color-coded sections</li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">🌤️ Daily Format Features:</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Individual Days</strong> - Each day as separate RSS item</li>
            <li><strong>Weather Emojis</strong> - Visual indicators in titles</li>
            <li><strong>NWS Icons</strong> - Official weather service images</li>
            <li><strong>Detailed Data</strong> - Humidity, wind, precipitation</li>
            <li><strong>Media Enclosures</strong> - Weather icons as attachments</li>
            <li><strong>Compact Format</strong> - Quick daily overview</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">📊 Weekly RSS Structure:</h3>
        <div className="bg-gray-50 p-4 rounded text-sm">
          <p><strong>Each RSS Item Contains:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Week Summary:</strong> Average high/low temps, dominant weather</li>
            <li><strong>Daily Breakdown:</strong> 7 days with full weather details</li>
            <li><strong>Visual Elements:</strong> Weather icons, emojis, styled HTML</li>
            <li><strong>Statistics:</strong> Precipitation chances, wind patterns</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">🌈 Weather Emoji Guide:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>☀️ Sunny/Clear</div>
          <div>⛅ Partly Cloudy</div>
          <div>☁️ Mostly Cloudy</div>
          <div>🌤️ Cloudy</div>
          <div>🌦️ Light Rain</div>
          <div>🌧️ Heavy Rain</div>
          <div>⛈️ Rain + Thunder</div>
          <div>🌩️ Thunderstorms</div>
          <div>🌨️ Snow/Sleet</div>
          <div>🌫️ Fog/Mist</div>
          <div>💨 Windy</div>
          <div>🌡️ Hot Weather</div>
        </div>
      </div>
      
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">Parameters:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><code>location</code> - ZIP code (defaults to 48103 for Ann Arbor, MI)</li>
        </ul>
        
        <div className="mt-6 space-x-4">
          <a 
            href="/api/weather?location=48103" 
            target="_blank"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            View Weekly RSS Feed
          </a>
          <a 
            href="/api/daily-weather?location=48103" 
            target="_blank"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            View Daily RSS Feed
          </a>
          <a 
            href="https://validator.w3.org/feed/check.cgi?url=http%3A//localhost%3A3000/api/weather%3Flocation%3D48103" 
            target="_blank"
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Validate Weekly Feed
          </a>
        </div>
      </div>
    </div>
  );
}
