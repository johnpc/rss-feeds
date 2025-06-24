export default function TicketmasterEventsPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">🎪 Ticketmaster Events RSS Feed</h1>
      
      <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-800">RSS Feed URL</h2>
        <code className="bg-white p-2 rounded block">
          http://localhost:3000/api/ticketmaster-events?location=48103
        </code>
        <p className="text-sm text-purple-600 mt-2">
          <strong>🎫 Live Data:</strong> Downloads and filters real Ticketmaster events for Ann Arbor area
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">🎭 Event Types Covered:</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>🎵 Music</strong> - Concerts, festivals, live performances</li>
            <li><strong>🏈 Sports</strong> - Michigan Wolverines, professional games</li>
            <li><strong>🎭 Theatre</strong> - Plays, musicals, performing arts</li>
            <li><strong>😂 Comedy</strong> - Stand-up shows, comedy tours</li>
            <li><strong>👨‍👩‍👧‍👦 Family</strong> - Kid-friendly shows and events</li>
            <li><strong>🎬 Special Events</strong> - Film screenings, conventions</li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">⚡ Feed Features:</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Real-time Data</strong> - Direct from Ticketmaster API</li>
            <li><strong>Local Focus</strong> - Filtered for Ann Arbor area events</li>
            <li><strong>Rich Details</strong> - Venue info, pricing, descriptions</li>
            <li><strong>Event Images</strong> - High-quality promotional images</li>
            <li><strong>Ticket Links</strong> - Direct links to purchase tickets</li>
            <li><strong>Smart Sorting</strong> - Events sorted by date</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">🎨 Event Categories & Emojis:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-red-100 p-3 rounded text-center">
            <div className="text-2xl">🎸</div>
            <div className="font-bold">Rock/Metal</div>
            <div className="text-sm">Live music</div>
          </div>
          <div className="bg-blue-100 p-3 rounded text-center">
            <div className="text-2xl">🏈</div>
            <div className="font-bold">Sports</div>
            <div className="text-sm">Games & matches</div>
          </div>
          <div className="bg-green-100 p-3 rounded text-center">
            <div className="text-2xl">🎭</div>
            <div className="font-bold">Theatre</div>
            <div className="text-sm">Plays & musicals</div>
          </div>
          <div className="bg-yellow-100 p-3 rounded text-center">
            <div className="text-2xl">😂</div>
            <div className="font-bold">Comedy</div>
            <div className="text-sm">Stand-up shows</div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">🏟️ Ann Arbor Venues Covered:</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-semibold text-blue-800">🏟️ Major Venues</h4>
            <ul className="text-sm text-blue-600 mt-2 space-y-1">
              <li>• Michigan Stadium (The Big House)</li>
              <li>• Crisler Center</li>
              <li>• Hill Auditorium</li>
              <li>• Power Center for the Performing Arts</li>
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <h4 className="font-semibold text-green-800">🎵 Music Venues</h4>
            <ul className="text-sm text-green-600 mt-2 space-y-1">
              <li>• The Ark</li>
              <li>• Michigan Theater</li>
              <li>• Blind Pig</li>
              <li>• Local bars and clubs</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">📱 Perfect For:</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-purple-50 p-4 rounded">
            <h4 className="font-semibold text-purple-800">🎫 Event Discovery</h4>
            <p className="text-sm text-purple-600 mt-2">
              Never miss concerts, shows, or games happening in your area.
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded">
            <h4 className="font-semibold text-orange-800">📅 Event Planning</h4>
            <p className="text-sm text-orange-600 mt-2">
              Plan your entertainment calendar with upcoming events.
            </p>
          </div>
          <div className="bg-teal-50 p-4 rounded">
            <h4 className="font-semibold text-teal-800">🎓 Student Life</h4>
            <p className="text-sm text-teal-600 mt-2">
              Perfect for University of Michigan students and local residents.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">🔄 How It Works:</h3>
        <div className="bg-gray-50 p-6 rounded-lg">
          <ol className="list-decimal list-inside space-y-3">
            <li><strong>Downloads</strong> the complete Ticketmaster events database (US)</li>
            <li><strong>Extracts</strong> the compressed JSON data automatically</li>
            <li><strong>Filters</strong> events for Ann Arbor area (ZIP codes 48103-48109)</li>
            <li><strong>Processes</strong> venue information and event details</li>
            <li><strong>Sorts</strong> events chronologically by date</li>
            <li><strong>Generates</strong> rich RSS feed with images and ticket links</li>
          </ol>
        </div>
      </div>
      
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">Parameters:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><code>location</code> - ZIP code (defaults to 48103 for Ann Arbor, MI)</li>
        </ul>
        
        <div className="mt-6 space-x-4">
          <a 
            href="/api/ticketmaster-events?location=48103" 
            target="_blank"
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            View Events RSS Feed
          </a>
          <a 
            href="/weather" 
            target="_blank"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            View Weather Forecasts
          </a>
          <a 
            href="/emergency-alerts" 
            target="_blank"
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            View Emergency Alerts
          </a>
        </div>
      </div>
      
      <div className="mt-8 bg-amber-50 border border-amber-200 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-amber-800">⚠️ Important Notes:</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-amber-700">
          <li>Event data is sourced directly from Ticketmaster&apos;s official API</li>
          <li>Feed updates hourly to balance freshness with API rate limits</li>
          <li>Ticket prices and availability may change - always verify on Ticketmaster</li>
          <li>Some events may sell out quickly, especially popular shows</li>
          <li>University of Michigan events are automatically included when detected</li>
        </ul>
      </div>
    </div>
  );
}
