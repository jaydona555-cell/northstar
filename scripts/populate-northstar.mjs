// Populate northstar-c7201 with demo hazards (~1,000 per run):
// dense local clusters + Washington scatter, then US and world cities.
// Uses the Firestore REST API (public create allowed by the deployed rules).
// Run: node scripts/populate-northstar.mjs
'use strict';

const PROJECT = 'northstar-c7201';
const BASE = 'https://firestore.googleapis.com/v1/projects';

const TYPES = ['Pothole', 'Crash', 'Road block', 'Broken streetlight', 'Flood', 'Other'];
const DETAILS = [
  'Large pothole near the curb', 'Broken glass on the sidewalk',
  'Traffic cone knocked into the road', 'Faded crosswalk markings',
  'Cracked pavement, easy to trip on', 'Sign bent at the base',
  'Debris spilling into the bike lane', 'Standing water covering the gutter',
  'Loose manhole cover', 'Low-hanging branch over the path',
  'Construction barrier tipped over', 'Poor visibility at this corner',
  'Cracked curb cut for wheelchairs', 'Unlit section of sidewalk'
];
const REPORTERS = ['Sammamish Sentinel', 'Demo Reporter', 'Safety Scout', 'Pothole Patrol', 'WalkSafe', 'Neighborhood Watch'];

const rnd = (min, max) => min + Math.random() * (max - min);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const CLUSTERS = [
  { name: 'Hackathon venue', lat: 47.688951, lng: -122.150207, count: 25, radius: 0.006 },
  { name: 'Sammamish (20900 NE 44th St)', lat: 47.649127, lng: -122.061691, count: 20, radius: 0.005 },
  { name: 'Live report #2', lat: 47.773858, lng: -122.223238, count: 10, radius: 0.004 },
  { name: 'Washington scatter', lat: 47.4, lng: -121.8, count: 100, radius: 0.2, spread: [
    [47.6062, -122.3321], [47.2414, -122.4598], [47.9787, -122.2021],
    [47.0379, -122.9007], [47.6588, -117.4260], [46.2080, -119.1058],
    [48.7519, -122.4787], [45.6387, -122.6615], [46.6021, -120.5059],
    [47.4473, -120.3253]
  ]},
  { name: 'US cities', lat: 39.8, lng: -98.5, count: 420, radius: 0.2, spread: [
    [40.7128, -74.0060], [34.0522, -118.2437], [41.8781, -87.6298],
    [29.7604, -95.3698], [33.4484, -112.0740], [39.9526, -75.1652],
    [29.4241, -98.4936], [32.7157, -117.1611], [32.7767, -96.7970],
    [30.2672, -97.7431], [25.7617, -80.1918], [33.7490, -84.3880],
    [42.3601, -71.0589], [39.7392, -104.9903], [36.1699, -115.1398],
    [45.5152, -122.6784], [37.7749, -122.4194], [44.9778, -93.2650],
    [42.3314, -83.0458], [38.9072, -77.0369], [29.9511, -90.0715]
  ]},
  { name: 'World cities', lat: 20.0, lng: 0.0, count: 425, radius: 0.2, spread: [
    [51.5074, -0.1278], [48.8566, 2.3522], [52.5200, 13.4050],
    [40.4168, -3.7038], [41.9028, 12.4964], [35.6762, 139.6503],
    [37.5665, 126.9780], [39.9042, 116.4074], [1.3521, 103.8198],
    [-33.8688, 151.2093], [43.6532, -79.3832], [19.4326, -99.1332],
    [-23.5505, -46.6333], [25.2048, 55.2708], [19.0760, 72.8777],
    [30.0444, 31.2357], [-1.2921, 36.8219], [52.3676, 4.9041]
  ]}
];

async function createDoc(fields) {
  const url = `${BASE}/${PROJECT}/databases/(default)/documents/hazards`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });
  if (!res.ok) throw new Error(`create: HTTP ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log(`Seeding ~1,000 demo hazards into ${PROJECT}...`);
  const now = new Date().toISOString();
  let seeded = 0;
  for (const cluster of CLUSTERS) {
    for (let i = 0; i < cluster.count; i++) {
      let lat, lng;
      if (cluster.spread) {
        const [sLat, sLng] = pick(cluster.spread);
        lat = sLat + rnd(-0.08, 0.08);
        lng = sLng + rnd(-0.08, 0.08);
      } else {
        lat = cluster.lat + rnd(-cluster.radius, cluster.radius);
        lng = cluster.lng + rnd(-cluster.radius, cluster.radius);
      }
      const fields = {
        type: { stringValue: pick(TYPES) },
        details: { stringValue: pick(DETAILS) },
        lat: { doubleValue: lat },
        lng: { doubleValue: lng },
        activeVotes: { integerValue: String(Math.floor(rnd(0, 4))) },
        notThereVotes: { integerValue: '0' },
        resolved: { booleanValue: false },
        demo: { booleanValue: true },
        reporterId: { stringValue: 'demo-seed' },
        reporterName: { stringValue: pick(REPORTERS) },
        createdAt: { timestampValue: now }
      };
      await createDoc(fields);
      seeded++;
      if (seeded % 100 === 0) console.log(`   ...${seeded} seeded`);
    }
  }
  console.log(`\nDone! Seeded ${seeded} demo hazards into ${PROJECT}.`);
  console.log(`Verify: https://console.firebase.google.com/project/${PROJECT}/firestore/data`);
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});