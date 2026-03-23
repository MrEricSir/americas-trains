const MBTA_URL = 'https://api-v3.mbta.com/vehicles?filter[route_type]=2';

export async function fetch_(agencyConfig) {
  const headers = {};
  if (agencyConfig.apiKey) {
    headers['x-api-key'] = agencyConfig.apiKey;
  }

  const res = await globalThis.fetch(MBTA_URL, { headers });
  if (!res.ok) throw new Error(`MBTA API error: ${res.status}`);
  const apiData = await res.json();

  const vehicles = apiData.data || [];
  const features = [];

  for (const v of vehicles) {
    const a = v.attributes;
    if (a.latitude == null || a.longitude == null) continue;

    const routeId = v.relationships?.route?.data?.id || '';

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [a.longitude, a.latitude] },
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
