import protobuf from 'protobufjs';

// Minimal GTFS-RT schema for vehicle positions
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

async function getDecoder() {
  if (!FeedMessage) {
    const root = protobuf.parse(gtfsrtProto).root;
    FeedMessage = root.lookupType('FeedMessage');
  }
  return FeedMessage;
}

export async function decodeGtfsRt(arrayBuffer) {
  const decoder = await getDecoder();
  const message = decoder.decode(new Uint8Array(arrayBuffer));
  return decoder.toObject(message, { defaults: true });
}
