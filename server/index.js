import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { agencies } from './agencies.js';
import { fetchWithCache, flush, flushAll } from './cache.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import fetchers
import * as amtrakFetcher from './fetchers/amtrak.js';
import * as mbtaFetcher from './fetchers/mbta.js';
import * as json511Fetcher from './fetchers/json511.js';
import * as gtfsrtFetcher from './fetchers/gtfsrt.js';
import * as njtransitFetcher from './fetchers/njtransit.js';

const fetchers = {
  amtrak: amtrakFetcher,
  mbta: mbtaFetcher,
  json511: json511Fetcher,
  gtfsrt: gtfsrtFetcher,
  njtransit: njtransitFetcher,
};

const app = express();
const PORT = process.env.PORT || 3001;

// Serve Vite build output in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'dist')));
}

// --- Routes ---

// List all agencies
app.get('/api/agencies', (req, res) => {
  const list = agencies.map(({ id, name, color, logo }) => ({ id, name, color, logo }));
  res.json(list);
});

// Get cached vehicle positions for one agency
app.get('/api/vehicles/:agencyId', async (req, res) => {
  const { agencyId } = req.params;
  const agency = agencies.find((a) => a.id === agencyId);

  if (!agency) {
    return res.status(404).json({ error: `Unknown agency: ${agencyId}` });
  }

  const fetcher = fetchers[agency.fetcher];
  if (!fetcher) {
    return res.status(500).json({ error: `Unknown fetcher: ${agency.fetcher}` });
  }

  try {
    const data = await fetchWithCache(`vehicles:${agencyId}`, () => fetcher.fetch_(agency));
    res.json(data);
  } catch (err) {
    console.error(`Error fetching ${agencyId}:`, err.message);
    res.status(502).json({ error: `Failed to fetch ${agencyId}: ${err.message}` });
  }
});

// Amtrak stations (cached)
app.get('/api/stations', async (req, res) => {
  try {
    const data = await fetchWithCache('stations', () => amtrakFetcher.fetchStations());
    res.json(data);
  } catch (err) {
    console.error('Error fetching stations:', err.message);
    res.status(502).json({ error: `Failed to fetch stations: ${err.message}` });
  }
});

// Amtrak raw train data (for route lines, cached)
app.get('/api/trains/raw', async (req, res) => {
  try {
    const data = await fetchWithCache('trains:raw', () => amtrakFetcher.fetchRawTrains());
    res.json(data);
  } catch (err) {
    console.error('Error fetching raw trains:', err.message);
    res.status(502).json({ error: `Failed to fetch raw trains: ${err.message}` });
  }
});

// Flush cache for one agency
app.delete('/api/cache/:agencyId', (req, res) => {
  flush(`vehicles:${req.params.agencyId}`);
  res.json({ flushed: req.params.agencyId });
});

// Flush all caches
app.delete('/api/cache', (req, res) => {
  flushAll();
  res.json({ flushed: 'all' });
});

// SPA fallback in production
if (process.env.NODE_ENV === 'production') {
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
