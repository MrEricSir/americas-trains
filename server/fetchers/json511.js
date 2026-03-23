export async function fetch_(agencyConfig) {
  const { code, apiKey } = agencyConfig;
  const url = `https://api.511.org/transit/vehiclepositions?agency=${code}&api_key=${apiKey}&format=json`;

  const res = await globalThis.fetch(url);
  if (!res.ok) throw new Error(`511 ${code} API error: ${res.status}`);

  const text = await res.text();
  // 511 API returns UTF-8 with BOM - strip it
  const clean = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const data = JSON.parse(clean);

  const features = [];

  for (const e of (data.Entities || [])) {
    const vehicle = e.Vehicle;
    if (!vehicle || !vehicle.Position) continue;
    const pos = vehicle.Position;

    if (pos.Latitude == null || pos.Longitude == null) continue;
    if (pos.Latitude === 0 && pos.Longitude === 0) continue;

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [pos.Longitude, pos.Latitude] },
      properties: {
        vehicleId: vehicle.Vehicle?.Id || e.Id || '',
        label: vehicle.Vehicle?.Label || '',
        routeName: '',
        bearing: pos.Bearing ?? 0,
        speed: pos.Speed ?? 0,
        timestamp: vehicle.Timestamp || 0,
      },
    });
  }

  return { type: 'FeatureCollection', features };
}
