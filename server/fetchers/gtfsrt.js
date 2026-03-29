import protobuf from 'protobufjs';

const gtfsrtProto = `
syntax = "proto2";

message FeedMessage {
  required FeedHeader header = 1;
  repeated FeedEntity entity = 2;
}

message FeedHeader {
  required string gtfs_realtime_version = 1;
  optional uint64 timestamp = 5;
}

message FeedEntity {
  required string id = 1;
  optional VehiclePosition vehicle = 4;
}

message VehiclePosition {
  optional TripDescriptor trip = 1;
  optional VehicleDescriptor vehicle = 8;
  optional Position position = 2;
  optional uint64 timestamp = 5;
}

message TripDescriptor {
  optional string trip_id = 1;
  optional string route_id = 5;
}

message VehicleDescriptor {
  optional string id = 1;
  optional string label = 2;
}

message Position {
  required float latitude = 1;
  required float longitude = 2;
  optional float bearing = 3;
  optional float speed = 5;
}
`;

let FeedMessage = null;

function getDecoder() {
  if (!FeedMessage) {
    const root = protobuf.parse(gtfsrtProto).root;
    FeedMessage = root.lookupType('FeedMessage');
  }
  return FeedMessage;
}

export async function fetch_(agencyConfig) {
  const { url, headers = {}, filterRouteIds, filterRouteIdSuffixes, filterTripIds } = agencyConfig;

  const res = await globalThis.fetch(url, { headers });
  if (!res.ok) throw new Error(`GTFS-RT error ${res.status}: ${url}`);

  const buf = await res.arrayBuffer();
  const decoder = getDecoder();
  const message = decoder.decode(new Uint8Array(buf));
  const data = decoder.toObject(message, { defaults: true });

  const features = [];

  for (const e of (data.entity || [])) {
    const v = e.vehicle;
    if (!v || !v.position) continue;

    // Apply route ID filter
    if (filterRouteIds) {
      const routeId = v.trip?.routeId || '';
      if (!filterRouteIds.includes(routeId)) continue;
    }

    // Apply route ID suffix filter
    if (filterRouteIdSuffixes) {
      const routeId = v.trip?.routeId || '';
      if (!filterRouteIdSuffixes.some((s) => routeId.endsWith('-' + s))) continue;
    }

    // Apply trip ID filter
    if (filterTripIds) {
      const tripId = v.trip?.tripId || '';
      if (!filterTripIds.includes(tripId)) continue;
    }

    const lat = v.position.latitude;
    const lon = v.position.longitude;
    if (lat == null || lon == null) continue;
    if (lat === 0 && lon === 0) continue;

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: {
        vehicleId: v.vehicle?.id || e.id || '',
        label: v.vehicle?.label || '',
        routeName: v.trip?.routeId || '',
        bearing: v.position.bearing ?? 0,
        speed: v.position.speed ?? 0,
        timestamp: v.timestamp || 0,
      },
    });
  }

  return { type: 'FeatureCollection', features };
}
