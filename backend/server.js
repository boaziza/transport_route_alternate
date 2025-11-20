// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cache = require('./cache');
const { allow } = require('./rateLimiter');

const ORS_KEY = process.env.ORS_API_KEY;
if (!ORS_KEY) {
  console.error("Missing ORS_API_KEY in environment. Copy .env.example to .env and set your key.");
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// helper: geocode a place string -> {lat, lon}
async function geocode(query) {
  const cacheKey = `geocode:${query}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = 'https://api.openrouteservice.org/geocode/search';
  const params = { api_key: ORS_KEY, text: query, size: 3, boundary_country: 'RWA' };
  const res = await axios.get(url, { params, timeout: 10000 });
  const features = res.data.features || [];
  if (features.length === 0) throw new Error('No geocode result');
  const first = features[0];
  const coords = { lon: first.geometry.coordinates[0], lat: first.geometry.coordinates[1], label: first.properties.label };
  cache.set(cacheKey, coords);
  return coords;
}

// helper: get directions between coordinates
async function getDirections(start, end, profile = 'driving-car', preference = 'fastest') {
  const cacheKey = `directions:${profile}:${start.lon},${start.lat}:${end.lon},${end.lat}:${preference}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;
  const body = {
    coordinates: [
      [start.lon, start.lat],
      [end.lon, end.lat]
    ],
    preference
  };

  const headers = {
    Authorization: ORS_KEY,
    'Content-Type': 'application/json'
  };

  const res = await axios.post(url, body, { headers, timeout: 15000 });
  // keep only needed parts
  const route = res.data;
  cache.set(cacheKey, route);
  return route;
}

// middleware: basic limiter per client IP to avoid flooding our calls
app.use((req, res, next) => {
  const key = req.ip || 'global';
  if (!allow(key)) {
    return res.status(429).json({ error: 'Too many requests locally; try again later' });
  }
  next();
});

// Endpoint: /api/route?from=Kigali&to=Huye&profile=driving-car&preference=fastest
app.get("/api/route", async (req, res) => {
  const { from, to, profile, preference } = req.query;

  try {
    const orsRes = await fetch("https://api.openrouteservice.org/v2/directions/" + profile, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.ORS_KEY
      },
      body: JSON.stringify({
        coordinates: await geocodeToCoords(from, to),
        preference: preference
      })
    });

    const ors = await orsRes.json();

    const feature = ors.features[0];

    const output = {
      start: { label: from },
      end: { label: to },
      summary: feature.properties.summary,
      segments: feature.properties.segments,
      geometry: feature.geometry.coordinates, // IMPORTANT!
      raw: ors
    };

    res.json(output);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// simple healthcheck for LB01
app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

// serve frontend static if you deploy single server
app.use('/', express.static(__dirname + '/../frontend'));

app.listen(PORT, () => { console.log(`Server started on port ${PORT}`); });
