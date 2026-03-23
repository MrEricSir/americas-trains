import maplibregl from 'maplibre-gl';
import { decodeGtfsRt } from './gtfsrt.js';

/**
 * Generic GTFS-RT layer factory. Handles both 511 JSON and raw protobuf formats.
 * Each instance manages its own set of markers independently.
 */
export function createGtfsLayer(config) {
  const { name, emoji, cssClass, color, format, filterEntity } = config;
  const markers = [];

  // Normalize entities from either 511 JSON or decoded protobuf
  function extractVehicles(data) {
    if (format === 'protobuf') {
      // Already decoded protobuf object
      return (data.entity || []).map((e) => {
        const v = e.vehicle;
        if (!v || !v.position) return null;
        if (filterEntity && !filterEntity(e)) return null;
        return {
          id: v.vehicle?.id || e.id || '',
          label: v.vehicle?.label || '',
          routeName: v.trip?.routeId || '',
          lat: v.position.latitude,
          lon: v.position.longitude,
          bearing: v.position.bearing ?? 0,
          speed: v.position.speed ?? 0,
          timestamp: v.timestamp || 0,
        };
      }).filter(Boolean);
    }

    // 511 JSON format
    return (data.Entities || []).map((e) => {
      const vehicle = e.Vehicle;
      if (!vehicle || !vehicle.Position) return null;
      const pos = vehicle.Position;
      return {
        id: vehicle.Vehicle?.Id || e.Id || '',
        label: vehicle.Vehicle?.Label || '',
        routeName: '',
        lat: pos.Latitude,
        lon: pos.Longitude,
        bearing: pos.Bearing ?? 0,
        speed: pos.Speed ?? 0,
        timestamp: vehicle.Timestamp || 0,
      };
    }).filter(Boolean);
  }

  function buildGeoJSON(data) {
    const vehicles = extractVehicles(data);
    const features = [];

    for (const v of vehicles) {
      if (v.lat == null || v.lon == null) continue;
      if (v.lat === 0 && v.lon === 0) continue;

      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [v.lon, v.lat] },
        properties: {
          vehicleId: v.id,
          label: v.label,
          routeName: v.routeName,
          bearing: v.bearing,
          speed: v.speed,
          timestamp: v.timestamp,
        },
      });
    }

    return { type: 'FeatureCollection', features };
  }

  function updateMarkers(map, geojson, onClickTrain) {
    for (const m of markers) m.remove();
    markers.length = 0;

    for (const feature of geojson.features) {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;

      const el = document.createElement('div');
      el.className = cssClass;
      el.textContent = emoji;
      el.title = `${name} #${props.label || props.vehicleId}`;

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

  function buildPopupHTML(props) {
    const speed = props.speed ? `${(props.speed * 2.237).toFixed(0)} mph` : 'Stopped';

    return `
      <div class="popup-header" style="background:${color}">
        ${name} #${props.label || props.vehicleId}
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
      </div>
    `;
  }

  return { buildGeoJSON, updateMarkers, buildPopupHTML };
}
