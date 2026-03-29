import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker.js?url';

maplibregl.setWorkerUrl(maplibreWorkerUrl);
import { fetchAgencies, fetchVehicles, fetchStations, fetchRawTrains } from './api.js';
import { updateTrainMarkers } from './trainLayer.js';
import { buildStationGeoJSON, addStationLayer } from './stationLayer.js';
import { buildRouteGeoJSON, addRouteLayer, ROUTE_CASING_WIDTH, ROUTE_FILL_WIDTH } from './railLayer.js';
import { buildPopupHTML } from './popup.js';
import { createGtfsLayer } from './gtfsLayer.js';
import { updateMbtaMarkers, buildMbtaPopupHTML } from './mbtaLayer.js';
import { updateNjtransitMarkers, buildNjtransitPopupHTML } from './njtransitLayer.js';

import caltrainRoute from './data/caltrain-route.json';
import aceRoute from './data/ace-route.json';
import metrolinkRoute from './data/metrolink-route.json';
import marcRoute from './data/marc-route.json';
import vreRoute from './data/vre-route.json';
import septaRoute from './data/septa-route.json';
import mbtaRoute from './data/mbta-route.json';
import brightlineRoute from './data/brightline-route.json';
import trirailRoute from './data/trirail-route.json';
import sunrailRoute from './data/sunrail-route.json';
import rtdRoute from './data/rtd-route.json';
import frontrunnerRoute from './data/frontrunner-route.json';
import smartRoute from './data/smart-route.json';
import wegostarRoute from './data/wegostar-route.json';
import nicdRoute from './data/nicd-route.json';
import northstarRoute from './data/northstar-route.json';
import capmetroRoute from './data/capmetro-route.json';
import soundtransitRoute from './data/soundtransit-route.json';
import exoRoute from './data/exo-route.json';
import metraRoute from './data/metra-route.json';
import goRoute from './data/go-route.json';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/bright';

const map = new maplibregl.Map({
  container: 'map',
  style: STYLE_URL,
  center: [-98.5, 39.8],
  zoom: 4,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

let stationLookup = {};

// --- Picture-in-Picture ---
const pipEl = document.getElementById('pip');
const pipInfoEl = document.getElementById('pip-info');
const pipCloseBtn = document.getElementById('pip-close');
let pipMap = null;
let pipMarker = null;
let pipRoutesAdded = false;

// Collected during main map load for replication on pipMap
const pipRouteData = []; // { sourceId, data, color }
let amtrakRouteGeoJSON = null;

function addRoutesToPipMap() {
  if (pipRoutesAdded || !pipMap) return;

  // OSM rail vectors from the base style's vector tiles
  pipMap.addLayer({
    id: 'osm-rail',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'transportation',
    filter: ['==', ['get', 'class'], 'rail'],
    paint: {
      'line-color': '#888',
      'line-width': 3,
      'line-opacity': 0.5,
    },
    layout: { 'line-cap': 'butt', 'line-join': 'round' },
  });

  // Amtrak dynamic routes
  if (amtrakRouteGeoJSON) {
    pipMap.addSource('routes', { type: 'geojson', data: amtrakRouteGeoJSON });
    pipMap.addLayer({
      id: 'route-casing', type: 'line', source: 'routes',
      paint: { 'line-color': '#222', 'line-width': ROUTE_CASING_WIDTH, 'line-opacity': 0.5 },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    });
    pipMap.addLayer({
      id: 'route-fill', type: 'line', source: 'routes',
      paint: { 'line-color': '#1a73e8', 'line-width': ROUTE_FILL_WIDTH, 'line-opacity': 0.8 },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    });
  }

  // All static routes (standalone + GTFS agencies)
  for (const r of pipRouteData) {
    pipMap.addSource(r.sourceId, { type: 'geojson', data: r.data });
    pipMap.addLayer({
      id: `${r.sourceId}-casing`, type: 'line', source: r.sourceId,
      paint: { 'line-color': '#222', 'line-width': ROUTE_CASING_WIDTH, 'line-opacity': 0.5 },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    });
    pipMap.addLayer({
      id: `${r.sourceId}-fill`, type: 'line', source: r.sourceId,
      paint: { 'line-color': r.color, 'line-width': ROUTE_FILL_WIDTH, 'line-opacity': 0.8 },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    });
  }

  pipRoutesAdded = true;
}

function showPiP(coords, html, emoji, logoUrl) {
  pipEl.classList.remove('hidden');
  const logoHtml = logoUrl ? `<img class="pip-logo" src="${logoUrl}" alt="" />` : '';
  pipInfoEl.innerHTML = logoHtml + html;

  // Position: default bottom-left, but top-left if the train is near the PiP area
  const point = map.project(coords);
  const container = map.getContainer();
  const nearLeft = point.x < 340;
  const nearBottom = point.y > container.clientHeight - 350;
  pipEl.classList.toggle('pip-top', nearLeft && nearBottom);

  // Remove previous marker
  if (pipMarker) { pipMarker.remove(); pipMarker = null; }

  const markerEl = document.createElement('div');
  markerEl.className = 'pip-marker';
  markerEl.textContent = emoji;

  if (!pipMap) {
    pipMap = new maplibregl.Map({
      container: 'pip-map',
      style: STYLE_URL,
      center: coords,
      zoom: 14,
      interactive: false,
      attributionControl: false,
    });
    pipMap.on('load', () => {
      addRoutesToPipMap();
      pipMarker = new maplibregl.Marker({ element: markerEl, anchor: 'center' })
        .setLngLat(coords)
        .addTo(pipMap);
    });
  } else {
    pipMap.setCenter(coords);
    pipMap.setZoom(14);
    pipMarker = new maplibregl.Marker({ element: markerEl, anchor: 'center' })
      .setLngLat(coords)
      .addTo(pipMap);
  }
}

function closePiP() {
  pipEl.classList.add('hidden');
}

pipCloseBtn.addEventListener('click', closePiP);

map.on('click', () => {
  closePiP();
});

// Route data keyed by agency id
const routeData = {
  caltrain: caltrainRoute,
  ace: aceRoute,
  metrolink: metrolinkRoute,
  marc: marcRoute,
  vre: vreRoute,
  septa: septaRoute,
  brightline: brightlineRoute,
  rtd: rtdRoute,
  frontrunner: frontrunnerRoute,
  smart: smartRoute,
  wegostar: wegostarRoute,
  nicd: nicdRoute,
  northstar: northstarRoute,
  capmetro: capmetroRoute,
  soundtransit: soundtransitRoute,
  exo: exoRoute,
  metra: metraRoute,
  go: goRoute,
};

// --- Amtrak / Via Rail ---
const AMTRAK_LOGO = '/logos/amtrak.png';
const VIARAIL_LOGO = '/logos/viarail.png';

function handleAmtrakClick(coords, props) {
  const isVia = props.provider === 'Via';
  const logo = isVia ? VIARAIL_LOGO : AMTRAK_LOGO;
  showPiP(coords, buildPopupHTML(props), '\u{1F686}', logo);
}

async function refreshAmtrak() {
  try {
    const geojson = await fetchVehicles('amtrak');
    updateTrainMarkers(map, geojson, handleAmtrakClick);

    if (Object.keys(stationLookup).length > 0) {
      const rawTrains = await fetchRawTrains();
      const routeGeoJSON = buildRouteGeoJSON(rawTrains, stationLookup);
      amtrakRouteGeoJSON = routeGeoJSON;
      const source = map.getSource('routes');
      if (source) source.setData(routeGeoJSON);
      // Sync to pipMap
      if (pipMap) {
        const pipSource = pipMap.getSource('routes');
        if (pipSource) pipSource.setData(routeGeoJSON);
      }
    }
  } catch (err) {
    console.error('Failed to refresh Amtrak:', err);
  }
}

// --- MBTA ---
const MBTA_LOGO = '/logos/mbta.png';

function handleMbtaClick(coords, props) {
  showPiP(coords, buildMbtaPopupHTML(props), '\u{1F683}', MBTA_LOGO);
}

async function refreshMbta() {
  try {
    const geojson = await fetchVehicles('mbta');
    updateMbtaMarkers(map, geojson, handleMbtaClick);
  } catch (err) {
    console.error('Failed to refresh MBTA:', err);
  }
}

// --- NJ Transit ---
const NJT_LOGO = '/logos/njtransit.png';

function handleNjtransitClick(coords, props) {
  showPiP(coords, buildNjtransitPopupHTML(props), '\u{1F683}', NJT_LOGO);
}

async function refreshNjtransit() {
  try {
    const geojson = await fetchVehicles('njtransit');
    updateNjtransitMarkers(map, geojson, handleNjtransitClick);
  } catch (err) {
    console.error('Failed to refresh NJ Transit:', err);
  }
}

// --- Generic GTFS agencies (populated from backend) ---
let gtfsAgencies = [];

async function refreshGtfs(agency) {
  try {
    const geojson = await fetchVehicles(agency.id);
    agency.layer.updateMarkers(map, geojson, (coords, props) => {
      showPiP(coords, agency.layer.buildPopupHTML(props), '\u{1F683}', agency.logo);
    });
  } catch (err) {
    console.error(`Failed to refresh ${agency.name}:`, err);
  }
}

async function refreshAll() {
  await Promise.all([
    refreshAmtrak(),
    refreshMbta(),
    refreshNjtransit(),
    ...gtfsAgencies.map((a) => refreshGtfs(a)),
  ]);
}

map.on('load', async () => {
  // Fetch agency list from backend (skip amtrak and mbta — handled specially)
  try {
    const allAgencies = await fetchAgencies();
    gtfsAgencies = allAgencies
      .filter((a) => a.id !== 'amtrak' && a.id !== 'mbta' && a.id !== 'njtransit')
      .map((a) => ({
        ...a,
        route: routeData[a.id] || null,
        layer: createGtfsLayer({
          name: a.name,
          emoji: '\u{1F683}',
          cssClass: 'gtfs-marker',
          color: a.color,
          format: 'geojson', // backend returns pre-normalized GeoJSON
        }),
        count: 0,
      }));
  } catch (err) {
    console.error('Failed to fetch agency list:', err);
  }

  // Load Amtrak stations
  try {
    const stationData = await fetchStations();
    stationLookup = stationData;
    const stationGeoJSON = buildStationGeoJSON(stationData);
    addStationLayer(map, stationGeoJSON);
  } catch (err) {
    console.error('Failed to load stations:', err);
  }

  // Fetch initial Amtrak raw data for route lines
  let trainData;
  try {
    trainData = await fetchRawTrains();
  } catch (err) {
    console.error('Failed to fetch initial trains:', err);
  }

  // Add Amtrak route lines
  try {
    if (trainData && Object.keys(stationLookup).length > 0) {
      const routeGeoJSON = buildRouteGeoJSON(trainData, stationLookup);
      amtrakRouteGeoJSON = routeGeoJSON;
      addRouteLayer(map, routeGeoJSON);
    }
  } catch (err) {
    console.error('Failed to add route layer:', err);
  }

  // Add standalone route overlays
  const standaloneRoutes = [
    { id: 'mbta', color: '#80276C', data: mbtaRoute },
    { id: 'trirail', color: '#006c86', data: trirailRoute },
    { id: 'sunrail', color: '#0076A8', data: sunrailRoute },
  ];
  for (const r of standaloneRoutes) {
    const sourceId = `route-${r.id}`;
    map.addSource(sourceId, { type: 'geojson', data: r.data });
    map.addLayer({
      id: `${sourceId}-casing`,
      type: 'line',
      source: sourceId,
      paint: { 'line-color': '#222', 'line-width': ROUTE_CASING_WIDTH, 'line-opacity': 0.5 },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    });
    map.addLayer({
      id: `${sourceId}-fill`,
      type: 'line',
      source: sourceId,
      paint: { 'line-color': r.color, 'line-width': ROUTE_FILL_WIDTH, 'line-opacity': 0.8 },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    });
    pipRouteData.push({ sourceId, data: r.data, color: r.color });
  }

  // Add all static GTFS route overlays
  for (const agency of gtfsAgencies) {
    if (!agency.route) continue;
    const sourceId = `route-${agency.name}`;
    map.addSource(sourceId, { type: 'geojson', data: agency.route });
    map.addLayer({
      id: `${sourceId}-casing`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#222',
        'line-width': ROUTE_CASING_WIDTH,
        'line-opacity': 0.5,
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    });
    map.addLayer({
      id: `${sourceId}-fill`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': agency.color,
        'line-width': ROUTE_FILL_WIDTH,
        'line-opacity': 0.8,
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    });
    pipRouteData.push({ sourceId, data: agency.route, color: agency.color });
  }

  // Initial load of Amtrak markers
  if (trainData) {
    const geojson = await fetchVehicles('amtrak');
    updateTrainMarkers(map, geojson, handleAmtrakClick);
  }

  // Initial load of all realtime feeds
  await Promise.all([
    refreshMbta(),
    refreshNjtransit(),
    ...gtfsAgencies.map((a) => refreshGtfs(a)),
  ]);

  // Poll every 60 seconds
  setInterval(refreshAll, 60_000);
});
