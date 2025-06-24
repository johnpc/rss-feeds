export default function EmergencyAlertsPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">🚨 Emergency Alerts RSS Feed</h1>
      
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4 text-red-800">RSS Feed URL</h2>
        <code className="bg-white p-2 rounded block">
          http://localhost:3000/api/emergency-alerts?location=48103
        </code>
        <p className="text-sm text-red-600 mt-2">
          <strong>⚠️ Critical:</strong> This feed updates every 15 minutes for emergency situations
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">🚨 Alert Types Covered:</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Severe Weather</strong> - Thunderstorms, tornadoes, hurricanes</li>
            <li><strong>Winter Weather</strong> - Snow storms, ice storms, blizzards</li>
            <li><strong>Flood Warnings</strong> - Flash floods, river flooding</li>
            <li><strong>Fire Alerts</strong> - Wildfire warnings and evacuations</li>
            <li><strong>Heat/Cold</strong> - Extreme temperature warnings</li>
            <li><strong>Other Emergencies</strong> - Earthquake, tsunami, etc.</li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">⚡ Feed Features:</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Real-time Alerts</strong> - Direct from National Weather Service</li>
            <li><strong>Severity Levels</strong> - Extreme, Severe, Moderate, Minor</li>
            <li><strong>Rich Details</strong> - Instructions, timing, affected areas</li>
            <li><strong>Visual Indicators</strong> - Color-coded by severity</li>
            <li><strong>Smart Sorting</strong> - Most critical alerts first</li>
            <li><strong>No Alerts Status</strong> - Shows when area is clear</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">🎨 Severity Levels & Colors:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-red-900 text-white p-3 rounded text-center">
            <div className="text-2xl">🚨</div>
            <div className="font-bold">EXTREME</div>
            <div className="text-sm">Life-threatening</div>
          </div>
          <div className="bg-orange-600 text-white p-3 rounded text-center">
            <div className="text-2xl">⚠️</div>
            <div className="font-bold">SEVERE</div>
            <div className="text-sm">Significant threat</div>
          </div>
          <div className="bg-yellow-500 text-white p-3 rounded text-center">
            <div className="text-2xl">⚡</div>
            <div className="font-bold">MODERATE</div>
            <div className="text-sm">Possible threat</div>
          </div>
          <div className="bg-green-500 text-white p-3 rounded text-center">
            <div className="text-2xl">🔔</div>
            <div className="font-bold">MINOR</div>
            <div className="text-sm">Minimal threat</div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">📱 Perfect For:</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-semibold text-blue-800">🔔 Push Notifications</h4>
            <p className="text-sm text-blue-600 mt-2">
              RSS readers with notification support can alert you immediately when emergencies occur.
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <h4 className="font-semibold text-green-800">🏠 Home Automation</h4>
            <p className="text-sm text-green-600 mt-2">
              Integrate with smart home systems to trigger emergency protocols automatically.
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded">
            <h4 className="font-semibant text-purple-800">📊 Monitoring Systems</h4>
            <p className="text-sm text-purple-600 mt-2">
              Business continuity and emergency management systems can monitor this feed.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">🔄 Update Frequency:</h3>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <p className="text-yellow-800">
            <strong>⏱️ Every 15 minutes</strong> - Emergency alerts require frequent updates. 
            The feed checks for new alerts every 15 minutes to ensure you get critical information as quickly as possible.
          </p>
        </div>
      </div>
      
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">Parameters:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><code>location</code> - ZIP code (defaults to 48103 for Ann Arbor, MI)</li>
        </ul>
        
        <div className="mt-6 space-x-4">
          <a 
            href="/api/emergency-alerts?location=48103" 
            target="_blank"
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            View Emergency Alerts Feed
          </a>
          <a 
            href="/weather" 
            target="_blank"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            View Weather Forecasts
          </a>
          <a 
            href="https://validator.w3.org/feed/check.cgi?url=http%3A//localhost%3A3000/api/emergency-alerts%3Flocation%3D48103" 
            target="_blank"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Validate RSS Feed
          </a>
        </div>
      </div>
      
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">⚠️ Important Safety Notes:</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>This feed should supplement, not replace, official emergency alert systems</li>
          <li>Always follow official evacuation orders and emergency instructions</li>
          <li>Keep multiple sources of emergency information available</li>
          <li>Test your RSS reader&apos;s notification settings regularly</li>
          <li>Have backup communication methods during emergencies</li>
        </ul>
      </div>
    </div>
  );
}
