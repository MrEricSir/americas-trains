import { get as cacheGet, set as cacheSet } from '../cache.js';

const BASE_URL = 'https://raildata.njtransit.com/api/TrainData';
const TOKEN_KEY = 'njt:token';
const TOKEN_TTL = 23 * 60 * 60 * 1000; // 23 hours

async function getToken(username, password) {
  const form = new FormData();
  form.append('username', username);
  form.append('password', password);

  const res = await globalThis.fetch(`${BASE_URL}/getToken`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`NJT getToken error: ${res.status} ${body}`);
  }
  const data = await res.json();
  const token = data.UserToken;
  cacheSet(TOKEN_KEY, token, TOKEN_TTL);
  return token;
}

async function getVehicleData(token) {
  const form = new FormData();
  form.append('token', token);

  const res = await globalThis.fetch(`${BASE_URL}/getVehicleData`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`NJT getVehicleData error: ${res.status}`);
  return res.json();
}

export async function fetch_(agency) {
  // Try cached token first (survives cold starts via GCS)
  let token = await cacheGet(TOKEN_KEY);
  if (!token) {
    token = await getToken(agency.username, agency.password);
  }

  let data;
  try {
    data = await getVehicleData(token);
  } catch {
    // Token may have expired — refresh and retry once
    token = await getToken(agency.username, agency.password);
    data = await getVehicleData(token);
  }

  // Handle "Invalid token" in response body
  if (typeof data === 'string' && data.includes('Invalid token')) {
    token = await getToken(agency.username, agency.password);
    data = await getVehicleData(token);
  }

  const vehicles = Array.isArray(data) ? data : [];

  const features = [];
  for (const v of vehicles) {
    // Filter out Amtrak (A-prefix), SEPTA (S-prefix), and non-revenue (X-prefix) trains
    if (/^[ASX]/i.test(v.ID)) continue;

    const lat = parseFloat(v.LATITUDE);
    const lon = parseFloat(v.LONGITUDE);
    if (isNaN(lat) || isNaN(lon)) continue;

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: {
        vehicleId: v.ID,
        label: v.ID,
        routeName: v.TRAIN_LINE || '',
        direction: v.DIRECTION || '',
        nextStop: v.NEXT_STOP || '',
        secLate: parseInt(v.SEC_LATE, 10) || 0,
      },
    });
  }

  return { type: 'FeatureCollection', features };
}
