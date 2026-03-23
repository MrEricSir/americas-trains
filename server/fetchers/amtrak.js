const TRAINS_URL = 'https://api-v3.amtraker.com/v3/trains';
const STATIONS_URL = 'https://api-v3.amtraker.com/v3/stations';

export async function fetch_(agencyConfig) {
  const res = await globalThis.fetch(TRAINS_URL);
  if (!res.ok) throw new Error(`Amtrak trains API error: ${res.status}`);
  const data = await res.json();

  const features = [];

  for (const trainNum in data) {
    const trains = data[trainNum];
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
        geometry: { type: 'Point', coordinates: [train.lon, train.lat] },
        properties: {
          trainNum: String(train.trainNum),
          routeName: train.routeName || 'Unknown',
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

export async function fetchStations() {
  const res = await globalThis.fetch(STATIONS_URL);
  if (!res.ok) throw new Error(`Amtrak stations API error: ${res.status}`);
  return res.json();
}

/**
 * Fetch raw train data (for route line building on the frontend).
 */
export async function fetchRawTrains() {
  const res = await globalThis.fetch(TRAINS_URL);
  if (!res.ok) throw new Error(`Amtrak trains API error: ${res.status}`);
  return res.json();
}
