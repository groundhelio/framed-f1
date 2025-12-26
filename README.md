# The Framed Stream

A cinematic iptv streaming platform that transforms raw IPTV feeds into immersive, atmospheric viewing experiences. This application uses a split-architecture design with a **React** frontend for the UI and an **Express** backend to handle proxying and header manipulation, allowing for seamless playback of streams that usually enforce strict CORS or Referer policies.

## Features

- **Cinematic Interface**: Stadium-inspired gradients and glassmorphic UI elements.
- **IPTV Category Browsing**: Integrated browsing of categorized IPTV channels (Animation, Sports, Movies, etc.).
- **Smart Proxy**: Bypasses `X-Frame-Options` and manages `Referer`/`Origin` headers to play restricted streams.
- **HLS Support**: Native playback of `.m3u8` streams with a custom video player.
- **Responsive Design**: Collapsible sidebar and mobile-friendly layout.

---

## Architecture

The project consists of two main parts that must run simultaneously:

1.  **Backend (Root)**: Node.js + Express
    - Runs on port `3000` (default).
    - Fetches playlists.
    - Proxies video streams to bypass browser security restrictions (CORS/Frame ancestors).
2.  **Frontend (`/client`)**: React + Vite
    - Runs on port `5173` (default).
    - Provides the user interface (Channel list, Video Player).
    - Proxies API requests to the Backend via Vite configuration (or direct fetch).

---

## Getting Started

Choose one of the following methods to run the application.

### Option 1: Docker Compose (Recommended)

The easiest way to get up and running.

```bash
# Start the application
docker-compose up -d

# The app will be available at http://localhost:1507
```

### Option 2: Docker CLI

Run the pre-built image directly from DockerHub.

```bash
# Pull and run the container
docker run -p 1507:1507 eddiegulled/framed-tv:latest

# The app will be available at http://localhost:1507
```

**Build it yourself:**

```bash
# Build the image
docker build -t framed-tv .

# Run locally
docker run -p 1507:1507 framed-tv
```

### Option 3: Run as a Background Service

For a robust, "set and forget" installation that starts on boot and runs in the background, you can set up a **systemd user service** that manages the Docker container.

👉 **[Read the Service Setup Guide](service-launch.md)**

### Option 4: Manual Installation (Development)

Requires [Node.js](https://nodejs.org/) (v18+).

**1. Install Dependencies**

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

**2. Start Development Servers**

You need to run both the backend and frontend.

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
npm run client:dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

---

## Configuration

### Backend Options
- **Port**: Set the `PORT` environment variable to change the backend port (default: 3000).
- **Default Playlist**: Modify `DEFAULT_PLAYLIST_URL` in `server.js` to change the initial playlist loaded by the app.

### Adding Custom Channels
The application is designed to parse M3U playlists. You can modify the `CATEGORIES` array in `server.js` to add your own playlist sources.

```javascript
// server.js
const CATEGORIES = [
  { name: 'My Custom List', url: 'https://example.com/playlist.m3u' },
  // ...
];
```

## Troubleshooting

**Stream not loading?**
- Check the console in the browser developer tools.
- Ensure the backend is running on port 3000.
- Some streams may be geo-locked or require specific headers that the generic proxy doesn't handle.

**CORS Errors?**
- Ensure you possess the rights to view the content.
- The proxy attempts to handle CORS, but extremely strict servers might still reject the request.

## Known Issues

- Some streams may be geo-locked or require specific headers that the generic proxy doesn't handle.
- The backend server may not be able to handle high traffic or large playlists.
- The frontend may not be able to handle high traffic or large playlists.
---

## License

MIT
