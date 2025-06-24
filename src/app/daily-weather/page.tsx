export default function DailyWeatherPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">🌤️ Daily Weather RSS Feed</h1>
      
      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">RSS Feed URL</h2>
        <code className="bg-white p-2 rounded block">
          http://localhost:3000/api/daily-weather?location=48103
        </code>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">✨ Daily Format Features:</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Individual Days</strong> - Each day as separate RSS item</li>
            <li><strong>Weather Emojis</strong> - Visual indicators in titles</li>
            <li><strong>NWS Weather Icons</strong> - Official weather service icons</li>
            <li><strong>Rich HTML</strong> - Styled descriptions with emojis</li>
            <li><strong>Complete RSS 2.0</strong> - All standard RSS fields included</li>
            <li><strong>Media Enclosures</strong> - Weather icons as attachments</li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">📱 How to use:</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Copy the RSS feed URL above</li>
            <li>Add it to your RSS reader (Feedly, Inoreader, etc.)</li>
            <li>Get individual daily weather updates</li>
            <li>Perfect for quick daily weather checks</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">🔄 Compare Formats:</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-semibold text-blue-800">📅 Weekly Format</h4>
            <p className="text-sm text-blue-600 mt-2">
              Each RSS item contains a full 7-day forecast with summary statistics and daily breakdowns. 
              Great for planning ahead and seeing weather patterns.
            </p>
            <a href="/weather" className="text-blue-600 underline text-sm">View Weekly →</a>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <h4 className="font-semibold text-green-800">🌤️ Daily Format</h4>
            <p className="text-sm text-green-600 mt-2">
              Each RSS item is a single day&apos;s forecast with detailed conditions. 
              Perfect for daily weather notifications and quick updates.
            </p>
            <a href="/daily-weather" className="text-green-600 underline text-sm">View Daily →</a>
          </div>
        </div>
      </div>
      
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">Parameters:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><code>location</code> - ZIP code (defaults to 48103 for Ann Arbor, MI)</li>
        </ul>
        
        <div className="mt-6 space-x-4">
          <a 
            href="/api/daily-weather?location=48103" 
            target="_blank"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            View Daily RSS Feed
          </a>
          <a 
            href="/api/weather?location=48103" 
            target="_blank"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            View Weekly RSS Feed
          </a>
        </div>
      </div>
    </div>
  );
}
