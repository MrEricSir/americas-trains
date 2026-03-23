import maplibregl from 'maplibre-gl';

const markers = [];

export function buildMbtaGeoJSON(apiData) {
  const vehicles = apiData.data || [];
  const features = [];

  for (const v of vehicles) {
    const a = v.attributes;
    if (a.latitude == null || a.longitude == null) continue;

    const routeId = v.relationships?.route?.data?.id || '';

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [a.longitude, a.latitude],
      },
      properties: {
        vehicleId: v.id,
        label: a.label || v.id,
        routeName: routeId,
        bearing: a.bearing ?? 0,
        speed: a.speed ?? 0,
        status: a.current_status || '',
        updatedAt: a.updated_at || '',
      },
    });
  }

  return { type: 'FeatureCollection', features };
}

export function updateMbtaMarkers(map, geojson, onClickTrain) {
  for (const m of markers) m.remove();
  markers.length = 0;

  for (const feature of geojson.features) {
    const props = feature.properties;
    const coords = feature.geometry.coordinates;

    const el = document.createElement('div');
    el.className = 'gtfs-marker';
    el.textContent = '🚃';
    el.title = `MBTA ${props.routeName} #${props.label}`;

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

const STATUS_LABELS = {
  'STOPPED_AT': 'Stopped',
  'IN_TRANSIT_TO': 'In transit',
  'INCOMING_AT': 'Arriving',
};

export function buildMbtaPopupHTML(props) {
  const speed = props.speed ? `${(props.speed * 2.237).toFixed(0)} mph` : 'Stopped';
  const status = STATUS_LABELS[props.status] || props.status;

  return `
    <div class="popup-header" style="background:#80276C">
      MBTA #${props.label}
    </div>
    <div class="popup-body">
      ${props.routeName ? `
      <div class="row">
        <span class="label">Line</span><br/>
        ${props.routeName}
      </div>` : ''}
      <div class="row">
        <span class="label">Speed</span><br/>
        ${speed}
      </div>
      ${status ? `
      <div class="row">
        <span class="label">Status</span><br/>
        ${status}
      </div>` : ''}
    </div>
  `;
}
