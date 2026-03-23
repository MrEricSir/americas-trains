const BASE_URL = 'https://raildata.njtransit.com/api/TrainData';

let cachedToken = null;

async function getToken(username, password) {
  const form = new FormData();
  form.append('username', username);
  form.append('password', password);

  const res = await globalThis.fetch(`${BASE_URL}/getToken`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`NJT getToken error: ${res.status}`);
  const data = await res.json();
  cachedToken = data.UserToken;
  return cachedToken;
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
  // Get or refresh token
  if (!cachedToken) {
    await getToken(agency.username, agency.password);
  }

  let data;
  try {
    data = await getVehicleData(cachedToken);
  } catch (err) {
    // Token may have expired — refresh and retry once
    await getToken(agency.username, agency.password);
    data = await getVehicleData(cachedToken);
  }

  // Handle "Invalid token" in response body
  if (typeof data === 'string' && data.includes('Invalid token')) {
    await getToken(agency.username, agency.password);
    data = await getVehicleData(cachedToken);
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
