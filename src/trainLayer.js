import maplibregl from 'maplibre-gl';

const markers = [];

export function buildTrainGeoJSON(apiData) {
  const features = [];

  for (const trainNum in apiData) {
    const trains = apiData[trainNum];
    for (const train of trains) {
      if (train.lon == null || train.lat == null) continue;

      const stations = train.stations || [];
      const origin = stations[0];
      const dest = stations[stations.length - 1];

      let lastStation = null;
      for (const s of stations) {
        if (s.status === 'Departed') lastStation = s;
      }

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [train.lon, train.lat],
        },
        properties: {
          trainNum: String(train.trainNum),
          routeName: train.routeName || 'Unknown',
          provider: train.provider || 'Amtrak',
          iconColor: train.iconColor || '#1a73e8',
          trainTimely: train.trainTimely || '',
          origName: origin ? origin.name : '',
          origCode: origin ? origin.code : '',
          destName: dest ? dest.name : '',
          destCode: dest ? dest.code : '',
          lastStaName: lastStation ? lastStation.name : '',
          lastStaCode: lastStation ? lastStation.code : '',
        },
      });
    }
  }

  return { type: 'FeatureCollection', features };
}

export function updateTrainMarkers(map, geojson, onClickTrain) {
  // Remove old markers
  for (const m of markers) m.remove();
  markers.length = 0;

  for (const feature of geojson.features) {
    const props = feature.properties;
    const coords = feature.geometry.coordinates;

    const isVia = props.provider === 'Via';
    const el = document.createElement('div');
    el.className = isVia ? 'train-marker via-marker' : 'train-marker';
    el.textContent = '🚆';
    el.title = `${isVia ? 'Via Rail' : 'Amtrak'} ${props.routeName} #${props.trainNum}`;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onClickTrain(coords, props);
    });

    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat(coords)
      .addTo(map);

    markers.push(marker);
  }
}
