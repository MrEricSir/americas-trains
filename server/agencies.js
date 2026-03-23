import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const frontrunnerTrips = require('../src/data/frontrunner-trips.json');

export const agencies = [
  {
    id: 'amtrak', name: 'Amtrak', color: '#1a73e8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Amtrak_logo_2.svg/120px-Amtrak_logo_2.svg.png',
    fetcher: 'amtrak',
  },
  {
    id: 'mbta', name: 'MBTA', color: '#80276C',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/MBTA.svg/120px-MBTA.svg.png',
    fetcher: 'mbta',
    apiKey: process.env.MBTA_API_KEY,
  },
  {
    id: 'caltrain', name: 'Caltrain', color: '#e21836',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Caltrain_logo.svg/120px-Caltrain_logo.svg.png',
    fetcher: 'json511', code: 'CT',
    apiKey: process.env.API_KEY_511,
  },
  {
    id: 'ace', name: 'ACE', color: '#1b4b8a',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Altamont_Corridor_Express_logo.svg/120px-Altamont_Corridor_Express_logo.svg.png',
    fetcher: 'json511', code: 'CE',
    apiKey: process.env.API_KEY_511,
  },
  {
    id: 'smart', name: 'SMART', color: '#009DA5',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Sonoma-Marin_Area_Rail_Transit_logo.svg/120px-Sonoma-Marin_Area_Rail_Transit_logo.svg.png',
    fetcher: 'json511', code: 'SA',
    apiKey: process.env.API_KEY_511,
  },
  {
    id: 'metrolink', name: 'Metrolink', color: '#F26522',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Metrolink_logo.svg/120px-Metrolink_logo.svg.png',
    fetcher: 'gtfsrt',
    url: 'https://metrolink-gtfsrt.gbsdigital.us/feed/gtfsrt-vehicles',
    headers: { 'x-api-key': process.env.METROLINK_API_KEY },
  },
  {
    id: 'marc', name: 'MARC', color: '#004B87',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/MARC_train.svg/120px-MARC_train.svg.png',
    fetcher: 'gtfsrt',
    url: 'https://mdotmta-gtfs-rt.s3.amazonaws.com/MARC+RT/marc-vp.pb',
  },
  {
    id: 'vre', name: 'VRE', color: '#DA291C',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Virginia_Railway_Express.svg/120px-Virginia_Railway_Express.svg.png',
    fetcher: 'gtfsrt',
    url: 'https://gtfs.vre.org/containercdngtfsupload/VehiclePositionFeed',
  },
  {
    id: 'septa', name: 'SEPTA', color: '#1C4D8C',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/SEPTA.svg/120px-SEPTA.svg.png',
    fetcher: 'gtfsrt',
    url: 'https://www3.septa.org/gtfsrt/septarail-pa-us/Vehicle/rtVehiclePosition.pb',
  },
  {
    id: 'brightline', name: 'Brightline', color: '#F2E205',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Brightline_Logo.svg/120px-Brightline_Logo.svg.png',
    fetcher: 'gtfsrt',
    url: 'http://feed.gobrightline.com/position_updates.pb',
  },
  {
    id: 'rtd', name: 'RTD A/B', color: '#57C1E9',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Regional_Transportation_District_logo.svg/120px-Regional_Transportation_District_logo.svg.png',
    fetcher: 'gtfsrt',
    url: 'https://www.rtd-denver.com/files/gtfs-rt/VehiclePosition.pb',
    filterRouteIds: ['A', '113B'],
  },
  {
    id: 'frontrunner', name: 'FrontRunner', color: '#c227b9',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/UTA_logo.svg/120px-UTA_logo.svg.png',
    fetcher: 'gtfsrt',
    url: 'https://apps.rideuta.com/tms/gtfs/Vehicle',
    filterTripIds: frontrunnerTrips,
  },
  {
    id: 'wegostar', name: 'WeGo Star', color: '#001E61',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Logo_WeGo_Public_Transit.svg/120px-Logo_WeGo_Public_Transit.svg.png',
    fetcher: 'gtfsrt',
    url: 'http://transitdata.nashvillemta.org/TMGTFSRealTimeWebService/vehicle/vehiclepositions.pb',
    filterRouteIds: ['90'],
  },
  {
    id: 'nicd', name: 'NICD', color: '#005DAA',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/South_Shore_Line_logo_PD.svg/120px-South_Shore_Line_logo_PD.svg.png',
    fetcher: 'gtfsrt',
    url: 'https://s3.amazonaws.com/etatransit.gtfs/southshore.etaspot.net/position_updates.pb',
  },
  {
    id: 'northstar', name: 'Northstar', color: '#009BDA',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b5/Northstar_Commuter_Rail.svg/120px-Northstar_Commuter_Rail.svg.png',
    fetcher: 'gtfsrt',
    url: 'https://svc.metrotransit.org/mtgtfs/vehiclepositions.pb',
    filterRouteIds: ['888'],
  },
  {
    id: 'capmetro', name: 'MetroRail', color: '#E3242B',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/CapMetro--new_logo_2022.svg/120px-CapMetro--new_logo_2022.svg.png',
    fetcher: 'gtfsrt',
    url: 'https://data.texas.gov/download/eiei-9rpf/application%2Foctet-stream',
    filterRouteIds: ['550'],
  },
  {
    id: 'soundtransit', name: 'Sound Transit', color: '#005DAA',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Sound_Transit_logo_simplified.svg/120px-Sound_Transit_logo_simplified.svg.png',
    fetcher: 'gtfsrt',
    url: 'http://api.pugetsound.onebusaway.org/api/gtfs_realtime/vehicle-positions-for-agency/40.pb?key=' + process.env.SOUNDTRANSIT_API_KEY,
    filterRouteIds: ['100479', '2LINE', 'TLINE'],
  },
  {
    id: 'metra', name: 'Metra', color: '#00205B',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Metra_Logo.svg/120px-Metra_Logo.svg.png',
    fetcher: 'gtfsrt',
    url: 'https://gtfspublic.metrarr.com/gtfs/public/positions',
    headers: { 'Authorization': 'Bearer ' + process.env.METRA_API_TOKEN },
  },
  {
    id: 'exo', name: 'Exo', color: '#00A6A2',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Exo_logo.svg/120px-Exo_logo.svg.png',
    fetcher: 'gtfsrt',
    url: 'https://opendata.exo.quebec/ServiceGTFSR/VehiclePosition.pb?$agency=TRAINS&token=' + process.env.EXO_API_TOKEN,
  },
  {
    id: 'njtransit', name: 'NJ Transit', color: '#003DA5',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/NJT_logo.svg/120px-NJT_logo.svg.png',
    fetcher: 'njtransit',
    username: process.env.NJT_USERNAME,
    password: process.env.NJT_PASSWORD,
  },
];
