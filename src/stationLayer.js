export function buildStationGeoJSON(apiData) {
  const features = [];

  for (const code in apiData) {
    const station = apiData[code];
    if (station.lon == null || station.lat == null) continue;

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [station.lon, station.lat],
      },
      properties: {
        code: station.code || code,
        name: station.name || code,
        city: station.city || '',
        state: station.state || '',
      },
    });
  }

  return { type: 'FeatureCollection', features };
}

export function addStationLayer(map, geojson) {
  map.addSource('stations', {
    type: 'geojson',
    data: geojson,
  });

  map.addLayer({
    id: 'station-dots',
    type: 'circle',
    source: 'stations',
    minzoom: 6,
    paint: {
      'circle-radius': 4,
      'circle-color': '#555',
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 1,
    },
  });

  map.addLayer({
    id: 'station-labels',
    type: 'symbol',
    source: 'stations',
    minzoom: 8,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 11,
      'text-offset': [0, 1.2],
      'text-anchor': 'top',
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#444',
      'text-halo-color': '#fff',
      'text-halo-width': 1,
    },
  });
}
