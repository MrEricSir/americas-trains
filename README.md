# America's Trains

_TODO: Come up with a catchier name._

Maps North American commuter and intercity rail along freight corridors in real-ish time.

Built with MapLibre GL and Express. 

Transit agencies are configured in `server/agencies.js`, using one of several fetcher types (`gtfsrt`, `json511`, `mbta`, `njtransit`, `amtrak`) that normalizes vendor-specific APIs into GeoJSON compatible data.

## Environment Variables

Some agencies require registration to use their data. All of these are free for personal use; see their respective licenses for more information.

| Variable | Used by |
|---|---|
| `API_KEY_511` | Caltrain, ACE, SMART (Bay Area 511.org) |
| `METROLINK_API_KEY` | Metrolink (Southern California) |
| `MBTA_API_KEY` | MBTA (Boston) |
| `SOUNDTRANSIT_API_KEY` | Sound Transit (Washington State) |
| `NJT_USERNAME` | NJ Transit |
| `NJT_PASSWORD` | NJ Transit |
| `EXO_API_TOKEN` | Exo (Montreal) |
| `GCS_CACHE_BUCKET` | Google Cloud Storage bucket for cache persistence (optional) |

## Run Locally

```bash
npm run dev
```

## Deployment

Hosted on Google Cloud Run (scales to zero, max 1 instance) with a GCS bucket for caching.

### Local (Docker)

```bash
docker build -t americas-trains .
docker run -p 8080:8080 --env-file .env americas-trains
```

### Deploy to Cloud Run

```bash
gcloud run deploy americas-trains --source . --region us-central1
```

Environment variables and the GCS cache bucket (`americas-trains-cache`) are pre-configured on the service at this point in time. The deploy command only needs to be re-run to push code changes.

## What's Next?

- Make sure we're using prod API keys
- Finish scripting deployment
- Create background service to regularly update cache
- Add additional passenger/commuter rail lines
