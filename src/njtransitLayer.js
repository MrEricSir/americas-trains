import maplibregl from 'maplibre-gl';

const markers = [];

export function updateNjtransitMarkers(map, geojson, onClickTrain) {
  for (const m of markers) m.remove();
  markers.length = 0;

  for (const feature of geojson.features) {
    const props = feature.properties;
    const coords = feature.geometry.coordinates;

    const el = document.createElement('div');
    el.className = 'gtfs-marker';
    el.textContent = '\u{1F683}';
    el.title = `NJ Transit #${props.label}`;

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

export function buildNjtransitPopupHTML(props) {
  const secLate = props.secLate || 0;
  let status;
  if (secLate <= 0) {
    status = 'On time';
  } else {
    const mins = Math.ceil(secLate / 60);
    status = `${mins} min late`;
  }

  return `
    <div class="popup-header" style="background:#003DA5">
      NJ Transit #${props.label}
    </div>
    <div class="popup-body">
      ${props.routeName ? `
      <div class="row">
        <span class="label">Line</span><br/>
        ${props.routeName}
      </div>` : ''}
      ${props.direction ? `
      <div class="row">
        <span class="label">Direction</span><br/>
        ${props.direction}
      </div>` : ''}
      ${props.nextStop ? `
      <div class="row">
        <span class="label">Next Stop</span><br/>
        ${props.nextStop}
      </div>` : ''}
      <div class="row">
        <span class="label">Status</span><br/>
        ${status}
      </div>
    </div>
  `;
}
