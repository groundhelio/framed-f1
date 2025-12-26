const express = require('express');
const axios = require('axios');
const cors = require('cors');
const parser = require('iptv-playlist-parser');
const { URL } = require('url');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 1507;

app.use(cors());

// Serve static files from the React client build directory
app.use(express.static(path.join(__dirname, 'client/dist')));

// Default playlist URL (Animation category as requested)
const DEFAULT_PLAYLIST_URL = 'https://iptv-org.github.io/iptv/categories/animation.m3u';

const CATEGORIES = [
  { name: 'Animation', url: 'https://iptv-org.github.io/iptv/categories/animation.m3u' },
  { name: 'Auto', url: 'https://iptv-org.github.io/iptv/categories/auto.m3u' },
  { name: 'Business', url: 'https://iptv-org.github.io/iptv/categories/business.m3u' },
  { name: 'Classic', url: 'https://iptv-org.github.io/iptv/categories/classic.m3u' },
  { name: 'Comedy', url: 'https://iptv-org.github.io/iptv/categories/comedy.m3u' },
  { name: 'Cooking', url: 'https://iptv-org.github.io/iptv/categories/cooking.m3u' },
  { name: 'Culture', url: 'https://iptv-org.github.io/iptv/categories/culture.m3u' },
  { name: 'Documentary', url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u' },
  { name: 'Education', url: 'https://iptv-org.github.io/iptv/categories/education.m3u' },
  { name: 'Entertainment', url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u' },
  { name: 'Family', url: 'https://iptv-org.github.io/iptv/categories/family.m3u' },
  { name: 'General', url: 'https://iptv-org.github.io/iptv/categories/general.m3u' },
  { name: 'Interactive', url: 'https://iptv-org.github.io/iptv/categories/interactive.m3u' },
  { name: 'Kids', url: 'https://iptv-org.github.io/iptv/categories/kids.m3u' },
  { name: 'Legislative', url: 'https://iptv-org.github.io/iptv/categories/legislative.m3u' },
  { name: 'Lifestyle', url: 'https://iptv-org.github.io/iptv/categories/lifestyle.m3u' },
  { name: 'Movies', url: 'https://iptv-org.github.io/iptv/categories/movies.m3u' },
  { name: 'Music', url: 'https://iptv-org.github.io/iptv/categories/music.m3u' },
  { name: 'News', url: 'https://iptv-org.github.io/iptv/categories/news.m3u' },
  { name: 'Outdoor', url: 'https://iptv-org.github.io/iptv/categories/outdoor.m3u' },
  { name: 'Public', url: 'https://iptv-org.github.io/iptv/categories/public.m3u' },
  { name: 'Relax', url: 'https://iptv-org.github.io/iptv/categories/relax.m3u' },
  { name: 'Religious', url: 'https://iptv-org.github.io/iptv/categories/religious.m3u' },
  { name: 'Science', url: 'https://iptv-org.github.io/iptv/categories/science.m3u' },
  { name: 'Swahili', url: 'https://iptv-org.github.io/iptv/languages/swa.m3u' },
  { name: 'Series', url: 'https://iptv-org.github.io/iptv/categories/series.m3u' },
  { name: 'Shop', url: 'https://iptv-org.github.io/iptv/categories/shop.m3u' },
  { name: 'Sports', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u' },
  { name: 'Travel', url: 'https://iptv-org.github.io/iptv/categories/travel.m3u' },
  { name: 'Weather', url: 'https://iptv-org.github.io/iptv/categories/weather.m3u' },
  { name: 'Undefined', url: 'https://iptv-org.github.io/iptv/categories/undefined.m3u' }
];

app.get('/api/categories', (req, res) => {
  res.json(CATEGORIES);
});

// 1. Playlist Endpoint
app.get('/api/playlist', async (req, res) => {
  const playlistUrl = req.query.url || DEFAULT_PLAYLIST_URL;
  console.log(`📥 Fetching playlist: ${playlistUrl}`);

  try {
    const response = await axios.get(playlistUrl);
    const playlist = parser.parse(response.data);

    // Transform to a simpler format for frontend if needed, 
    // but the raw parser output is usually fine.
    // We'll filter out empty items.
    const channels = playlist.items.map(item => ({
      name: item.name,
      group: item.group.title || 'Manually Added',
      logo: item.tvg.logo,
      url: item.url,
      raw: item
    }));

    res.json({
      count: channels.length,
      channels: channels
    });
  } catch (error) {
    console.error('❌ Error fetching playlist:', error.message);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

// 2. Stream Proxy Endpoint
app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Missing url parameter');
  }

  // console.log(`🔄 Proxying: ${targetUrl}`);

  try {
    // Prepare headers to look like a normal browser/player request
    // Sometimes we need to fake the Referer/Origin based on the target URL
    const targetUrlObj = new URL(targetUrl);
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Connection': 'keep-alive',
      'Referer': `${targetUrlObj.protocol}//${targetUrlObj.host}/`,
      'Origin': `${targetUrlObj.protocol}//${targetUrlObj.host}`
    };

    const response = await axios({
      method: 'get',
      url: targetUrl,
      headers: headers,
      responseType: 'stream',
      timeout: 15000, // 15 seconds timeout
      validateStatus: () => true, // Don't throw on 4xx/5xx
    });

    // Copy critical headers to allow browser playback
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', response.headers['content-type']);

    // Check if it's a playlist (m3u8) that needs rewriting
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('application/vnd.apple.mpegurl') ||
      contentType.includes('application/x-mpegurl') ||
      targetUrl.endsWith('.m3u8')) {

      // We need to buffer the response to rewrite it
      let data = '';
      response.data.on('data', (chunk) => data += chunk);
      response.data.on('end', () => {
        const rewritten = rewriteM3u8(data, targetUrl);
        res.send(rewritten);
      });
      response.data.on('error', (err) => {
        console.error('Stream error:', err);
        res.end();
      });

    } else {
      // Binary segment (ts, mp4, etc.) - pipe directly
      response.data.pipe(res);
    }

  } catch (error) {
    console.error(`❌ Proxy error for ${targetUrl}:`, error.message);
    if (error.code === 'ECONNABORTED') {
      return res.status(504).send('Gateway Timeout');
    }
    res.status(500).send('Proxy error');
  }
});

function rewriteM3u8(content, originalUrl) {
  const lines = content.split('\n');
  const baseUrl = new URL(originalUrl);
  const proxyBase = `http://localhost:${PORT}/proxy?url=`;

  const rewrittenLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      // Handle #EXT-X-KEY URI rewriting if needed (for DRM/Encryption, simplified here)
      if (trimmed.startsWith('#EXT-X-KEY') || trimmed.startsWith('#EXT-X-MAP')) {
        return line.replace(/URI="([^"]+)"/, (match, uri) => {
          const absolute = new URL(uri, baseUrl).toString();
          return `URI="${proxyBase}${encodeURIComponent(absolute)}"`;
        });
      }
      return line;
    }

    // It's a segment URL
    try {
      const absoluteUrl = new URL(trimmed, baseUrl).toString();
      return `${proxyBase}${encodeURIComponent(absoluteUrl)}`;
    } catch (e) {
      return line;
    }
  });

  return rewrittenLines.join('\n');
}

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`📺 IPTV Mediator running on http://localhost:${PORT}`);
  console.log(`🔗 Playlist API: http://localhost:${PORT}/api/playlist`);
  console.log(`🔄 Stream Proxy: http://localhost:${PORT}/proxy?url=...`);
});