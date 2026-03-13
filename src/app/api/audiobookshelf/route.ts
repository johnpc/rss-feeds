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
  audioFile?: { 
    ino: string; 
    metadata: { size: number }; 
    mimeType: string;
    duration?: number;
    metaTags?: { tagDescription?: string; tagArtist?: string };
  };
}

interface AudioFile {
  ino: string;
  mimeType: string;
  duration?: number;
  metadata: { size: number };
  metaTags?: { tagDescription?: string; tagArtist?: string; tagAlbumArtist?: string };
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
    audioFiles?: AudioFile[];
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
  // Fetch all items - sorting happens client-side by parsed date from title
  const res = await fetch(`${ABS_URL}/api/libraries/${libraryId}/items?limit=0`, {
    headers: { Authorization: `Bearer ${ABS_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch library: ${res.status}`);
  const data: LibraryResponse = await res.json();

  // Fetch each item individually to get full details (episodes for podcasts, audioFiles for books)
  const items = await Promise.all(
    data.results.map(async (item) => {
      const itemRes = await fetch(`${ABS_URL}/api/items/${item.id}${type === 'podcast' ? '?include=episodes' : ''}`, {
        headers: { Authorization: `Bearer ${ABS_API_KEY}` },
      });
      return itemRes.ok ? itemRes.json() : item;
    })
  );
  return items;
}

const FALLBACK_COVER = 'https://s3.us-west-2.amazonaws.com/jpcbucket.com/podcast-placeholder.png';
const FALLBACK_AUDIOBOOK_COVER = 'https://s3.us-west-2.amazonaws.com/jpcbucket.com/audiobook-placeholder.png';

function parseDateFromTitle(title: string): Date | null {
  const match = title.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? new Date(match[1]) : null;
}

function buildPodcastRss(items: LibraryItem[], libraryName: string, baseUrl: string, maxAgeDays?: number): string {
  const cutoff = maxAgeDays ? Date.now() - maxAgeDays * 24 * 60 * 60 * 1000 : 0;

  interface EpisodeData {
    xml: string;
    sortDate: number;
  }
  const episodeData: EpisodeData[] = [];

  for (const item of items) {
    if (item.media.episodes) {
      const podcastTitle = item.media.metadata.title || '';
      const channelMatch = podcastTitle.match(/^(.+?) - \d{4}-\d{2}-\d{2}/);
      const creator = channelMatch ? channelMatch[1] : '';
      const titleDate = parseDateFromTitle(podcastTitle);
      
      for (const ep of item.media.episodes) {
        const ino = ep.audioFile?.ino;
        if (!ino) continue;
        
        // Use parsed date from title, fall back to publishedAt or addedAt
        const sortDate = titleDate?.getTime() || ep.publishedAt || item.addedAt;
        if (maxAgeDays && sortDate < cutoff) continue;
        
        const audioUrl = `${ABS_URL}/api/items/${item.id}/file/${ino}?token=${ABS_API_KEY}`;
        const pubDate = new Date(sortDate).toUTCString();
        const coverUrl = item.media.coverPath
          ? `${ABS_URL}/api/items/${item.id}/cover?token=${ABS_API_KEY}`
          : FALLBACK_COVER;
        const title = creator ? `${creator} - ${ep.title}` : ep.title;
        const description = ep.audioFile?.metaTags?.tagDescription || ep.description || item.media.metadata.description || '';

        episodeData.push({
          sortDate,
          xml: `
    <item>
      <title>${escapeXml(title)}</title>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${escapeXml(audioUrl)}" length="${ep.audioFile?.metadata?.size || 0}" type="${ep.audioFile?.mimeType || 'audio/mpeg'}"/>
      <guid isPermaLink="false">${item.id}-${ep.id}</guid>
      ${ep.duration || ep.audioFile?.duration ? `<itunes:duration>${formatDuration(ep.duration || ep.audioFile?.duration || 0)}</itunes:duration>` : ''}
      <itunes:image href="${escapeXml(coverUrl)}"/>
    </item>`
        });
      }
    }
  }

  // Sort by date descending (newest first)
  episodeData.sort((a, b) => b.sortDate - a.sortDate);

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(libraryName)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Audiobookshelf library: ${escapeXml(libraryName)}</description>
    <itunes:image href="${FALLBACK_COVER}"/>
    <atom:link href="${escapeXml(baseUrl)}" rel="self" type="application/rss+xml"/>
    ${episodeData.map(e => e.xml).join('')}
  </channel>
</rss>`;
}

function buildAudiobookRss(items: LibraryItem[], libraryName: string, baseUrl: string): string {
  const episodes: string[] = [];

  for (const item of items) {
    const audioFile = item.media.audioFiles?.[0];
    if (!audioFile) continue;

    const audioUrl = `${ABS_URL}/api/items/${item.id}/file/${audioFile.ino}?token=${ABS_API_KEY}`;
    const coverUrl = item.media.coverPath
      ? `${ABS_URL}/api/items/${item.id}/cover?token=${ABS_API_KEY}`
      : FALLBACK_AUDIOBOOK_COVER;
    const author = item.media.metadata.authorName || item.media.metadata.author || audioFile.metaTags?.tagArtist || audioFile.metaTags?.tagAlbumArtist || 'Unknown';
    const description = item.media.metadata.description || '';

    episodes.push(`
    <item>
      <title>${escapeXml(item.media.metadata.title)}</title>
      <description>${escapeXml(description)}</description>
      <pubDate>${new Date(item.addedAt).toUTCString()}</pubDate>
      <enclosure url="${escapeXml(audioUrl)}" length="${audioFile.metadata.size}" type="${audioFile.mimeType}"/>
      <guid isPermaLink="false">${item.id}</guid>
      ${item.media.duration || audioFile.duration ? `<itunes:duration>${formatDuration(item.media.duration || audioFile.duration || 0)}</itunes:duration>` : ''}
      <itunes:image href="${escapeXml(coverUrl)}"/>
      <itunes:author>${escapeXml(author)}</itunes:author>
    </item>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(libraryName)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Audiobookshelf library: ${escapeXml(libraryName)}</description>
    <itunes:image href="${FALLBACK_AUDIOBOOK_COVER}"/>
    <atom:link href="${escapeXml(baseUrl)}" rel="self" type="application/rss+xml"/>
    ${episodes.join('')}
  </channel>
</rss>`;
}

const LIBRARIES: Record<string, { id: string; type: 'podcast' | 'book'; maxAgeDays?: number }> = {
  pinchflat: { id: '891320d6-0376-4506-82e0-b50ee81b5dfa', type: 'podcast', maxAgeDays: 7 },
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
    const baseUrl = `https://rss-feeds.jpc.io/api/audiobookshelf?library=${libraryName}`;

    const rss = lib.type === 'podcast'
      ? buildPodcastRss(items, libraryName, baseUrl, lib.maxAgeDays)
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
      { 
        error: 'Failed to generate RSS', 
        message: error instanceof Error ? error.message : 'Unknown error',
        debug: { urlSet: !!ABS_URL, keyLength: ABS_API_KEY?.length || 0 }
      },
      { status: 500 }
    );
  }
}
