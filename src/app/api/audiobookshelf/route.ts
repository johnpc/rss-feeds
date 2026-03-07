import { NextRequest, NextResponse } from 'next/server';

const ABS_URL = process.env.AUDIOBOOKSHELF_URL || 'https://audiobooks.jpc.io';
const ABS_API_KEY = process.env.AUDIOBOOKSHELF_API_KEY || '';

interface Episode {
  id: string;
  title: string;
  description?: string;
  pubDate?: string;
  publishedAt?: number;
  duration?: number;
  audioFile?: { metadata: { size: number }; mimeType: string };
  audioTrack?: { ino: string; mimeType: string };
}

interface Track {
  ino: string;
  mimeType: string;
  metadata: { size: number };
}

interface LibraryItem {
  id: string;
  addedAt: number;
  mediaType: 'podcast' | 'book';
  media: {
    metadata: {
      title: string;
      author?: string;
      authorName?: string;
      description?: string;
    };
    coverPath?: string;
    episodes?: Episode[];
    tracks?: Track[];
    duration?: number;
    size?: number;
  };
}

interface LibraryResponse {
  results: LibraryItem[];
  total: number;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

async function fetchLibraryItems(libraryId: string, type: 'podcast' | 'book'): Promise<LibraryItem[]> {
  const res = await fetch(`${ABS_URL}/api/libraries/${libraryId}/items?limit=500`, {
    headers: { Authorization: `Bearer ${ABS_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch library: ${res.status}`);
  const data: LibraryResponse = await res.json();

  if (type === 'podcast') {
    // Fetch each item with episodes included
    const items = await Promise.all(
      data.results.map(async (item) => {
        const itemRes = await fetch(`${ABS_URL}/api/items/${item.id}?include=episodes`, {
          headers: { Authorization: `Bearer ${ABS_API_KEY}` },
        });
        return itemRes.ok ? itemRes.json() : item;
      })
    );
    return items;
  }
  return data.results;
}

function buildPodcastRss(items: LibraryItem[], libraryName: string, baseUrl: string): string {
  const episodes: string[] = [];

  for (const item of items) {
    if (item.media.episodes) {
      for (const ep of item.media.episodes) {
        const audioUrl = `${ABS_URL}/api/items/${item.id}/file/${ep.audioTrack?.ino}?token=${ABS_API_KEY}`;
        const pubDate = ep.publishedAt
          ? new Date(ep.publishedAt).toUTCString()
          : new Date(item.addedAt).toUTCString();
        const coverUrl = item.media.coverPath
          ? `${ABS_URL}/api/items/${item.id}/cover?token=${ABS_API_KEY}`
          : '';

        episodes.push(`
    <item>
      <title>${escapeXml(ep.title)}</title>
      <description>${escapeXml(ep.description || item.media.metadata.description || '')}</description>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${escapeXml(audioUrl)}" length="${ep.audioFile?.metadata.size || 0}" type="${ep.audioTrack?.mimeType || 'audio/mpeg'}"/>
      <guid isPermaLink="false">${item.id}-${ep.id}</guid>
      ${ep.duration ? `<itunes:duration>${formatDuration(ep.duration)}</itunes:duration>` : ''}
      ${coverUrl ? `<itunes:image href="${escapeXml(coverUrl)}"/>` : ''}
    </item>`);
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(libraryName)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Audiobookshelf library: ${escapeXml(libraryName)}</description>
    <atom:link href="${escapeXml(baseUrl)}" rel="self" type="application/rss+xml"/>
    ${episodes.join('')}
  </channel>
</rss>`;
}

function buildAudiobookRss(items: LibraryItem[], libraryName: string, baseUrl: string): string {
  const episodes: string[] = [];

  for (const item of items) {
    const track = item.media.tracks?.[0];
    if (!track) continue;

    const audioUrl = `${ABS_URL}/api/items/${item.id}/file/${track.ino}?token=${ABS_API_KEY}`;
    const coverUrl = item.media.coverPath
      ? `${ABS_URL}/api/items/${item.id}/cover?token=${ABS_API_KEY}`
      : '';
    const author = item.media.metadata.authorName || item.media.metadata.author || 'Unknown';

    episodes.push(`
    <item>
      <title>${escapeXml(item.media.metadata.title)}</title>
      <description>${escapeXml(item.media.metadata.description || '')} - by ${escapeXml(author)}</description>
      <pubDate>${new Date(item.addedAt).toUTCString()}</pubDate>
      <enclosure url="${escapeXml(audioUrl)}" length="${track.metadata.size}" type="${track.mimeType}"/>
      <guid isPermaLink="false">${item.id}</guid>
      ${item.media.duration ? `<itunes:duration>${formatDuration(item.media.duration)}</itunes:duration>` : ''}
      ${coverUrl ? `<itunes:image href="${escapeXml(coverUrl)}"/>` : ''}
      <itunes:author>${escapeXml(author)}</itunes:author>
    </item>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(libraryName)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Audiobookshelf library: ${escapeXml(libraryName)}</description>
    <atom:link href="${escapeXml(baseUrl)}" rel="self" type="application/rss+xml"/>
    ${episodes.join('')}
  </channel>
</rss>`;
}

const LIBRARIES: Record<string, { id: string; type: 'podcast' | 'book' }> = {
  pinchflat: { id: '891320d6-0376-4506-82e0-b50ee81b5dfa', type: 'podcast' },
  audiobooks: { id: 'f922a634-4676-4e80-a578-d2727c765abf', type: 'book' },
  podcasts: { id: 'f2ab7c35-4f9d-4c95-9b59-ec457140ab46', type: 'podcast' },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const libraryName = searchParams.get('library')?.toLowerCase();

    if (!libraryName || !LIBRARIES[libraryName]) {
      return NextResponse.json(
        { error: 'Invalid library. Use: pinchflat, audiobooks, or podcasts' },
        { status: 400 }
      );
    }

    const lib = LIBRARIES[libraryName];
    const items = await fetchLibraryItems(lib.id, lib.type);
    const baseUrl = request.url;

    const rss = lib.type === 'podcast'
      ? buildPodcastRss(items, libraryName, baseUrl)
      : buildAudiobookRss(items, libraryName, baseUrl);

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml',
        'Cache-Control': 'public, max-age=1800',
      },
    });
  } catch (error) {
    console.error('Audiobookshelf RSS error:', error);
    return NextResponse.json(
      { error: 'Failed to generate RSS', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
