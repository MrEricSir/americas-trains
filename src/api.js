export async function fetchAgencies() {
  const res = await fetch('/api/agencies');
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchVehicles(agencyId) {
  const res = await fetch(`/api/vehicles/${agencyId}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchStations() {
  const res = await fetch('/api/stations');
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchRawTrains() {
  const res = await fetch('/api/trains/raw');
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
