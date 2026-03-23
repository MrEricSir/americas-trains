export function buildRouteGeoJSON(trainData, stationLookup) {
  // Collect unique routes: use routeName as key, keep the longest station list
  const routes = {};

  for (const trainNum in trainData) {
    const trains = trainData[trainNum];
    for (const train of trains) {
      const name = train.routeName;
      if (!name) continue;
      const stations = train.stations || [];
      if (!routes[name] || stations.length > routes[name].length) {
        routes[name] = stations;
      }
    }
  }

  const features = [];

  for (const [routeName, stations] of Object.entries(routes)) {
    const coords = [];
    for (const s of stations) {
      const info = stationLookup[s.code];
      if (info && info.lat != null && info.lon != null) {
        coords.push([info.lon, info.lat]);
      }
    }

    if (coords.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: { routeName },
      });
    }
  }

  return { type: 'FeatureCollection', features };
}

// Shared line widths for all route overlays
export const ROUTE_CASING_WIDTH = ['interpolate', ['linear'], ['zoom'], 3, 4, 8, 6, 12, 8];
export const ROUTE_FILL_WIDTH   = ['interpolate', ['linear'], ['zoom'], 3, 2, 8, 4, 12, 6];

export function addRouteLayer(map, geojson) {
  map.addSource('routes', {
    type: 'geojson',
    data: geojson,
  });

  map.addLayer({
    id: 'route-casing',
    type: 'line',
    source: 'routes',
    paint: {
      'line-color': '#222',
      'line-width': ROUTE_CASING_WIDTH,
      'line-opacity': 0.5,
    },
    layout: { 'line-cap': 'round', 'line-join': 'round' },
  });

  map.addLayer({
    id: 'route-fill',
    type: 'line',
    source: 'routes',
    paint: {
      'line-color': '#1a73e8',
      'line-width': ROUTE_FILL_WIDTH,
      'line-opacity': 0.8,
    },
    layout: { 'line-cap': 'round', 'line-join': 'round' },
  });
}
