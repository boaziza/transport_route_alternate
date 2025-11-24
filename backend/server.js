require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const polyline = require('@mapbox/polyline');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

const ORS_API_KEY = process.env.ORS_API_KEY;

async function geocode(placeName) {
  const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(placeName)}, Rwanda`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.features || data.features.length === 0) {
    console.log("Geocode API result:", data);
    throw new Error("Could not find location: " + placeName);
  }

  const [lon, lat] = data.features[0].geometry.coordinates;
  return { lat, lon };
}

async function geocodeToCoords(from, to) {
  const start = await geocode(from);
  const end = await geocode(to);

  return [
    [start.lon, start.lat],
    [end.lon, end.lat]
  ];
}

app.get('/api/geocode/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ success: false, error: "Missing ?query=" });
    }

    const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(query)}&size=5&boundary.country=RW`;

    const orsRes = await fetch(url);
    const data = await orsRes.json();

    if (!data.features) {
      return res.status(500).json({
        success: false,
        error: "ORS geocoding error",
        details: data
      });
    }

    const results = data.features.map(f => ({
      name: f.properties.label,
      coordinates: f.geometry.coordinates,
      country: f.properties.country,
      region: f.properties.region
    }));

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error("Geocode search error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


app.get("/api/route", async (req, res) => {
  const { from, to, profile, preference, fromLon, fromLat, toLon, toLat, fromName, toName } = req.query;

  try {
    let coords;
    let startLabel, endLabel;

    if (fromLon && fromLat && toLon && toLat) {
      coords = [
        [parseFloat(fromLon), parseFloat(fromLat)],
        [parseFloat(toLon), parseFloat(toLat)]
      ];
      startLabel = fromName || 'Start Location';
      endLabel = toName || 'End Location';
      console.log('Using direct coordinates:', coords);
    } 

    else if (from && to) {
      coords = await geocodeToCoords(from, to);
      startLabel = from;
      endLabel = to;
    } 
    else {
      return res.status(400).json({ 
        error: "Missing from, to locations" 
      });
    }

    const url = `https://api.openrouteservice.org/v2/directions/${profile}`;
    const body = {
      coordinates: coords,
      preference: preference || "recommended"
    };

    const orsRes = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const ors = await orsRes.json();

    if (!ors.routes || ors.routes.length === 0) {
      console.error('API Error:', ors);
      return res.status(500).json({ error: "API Error", details: ors });
    }

    const route = ors.routes[0];
    
    const decodedGeometry = polyline.decode(route.geometry); // Returns [[lat, lon], ...]
    const coordinates = decodedGeometry.map(coord => [coord[1], coord[0]]); // Convert to [lon, lat]

    return res.json({
      start: {label: startLabel},
      end: {label: endLabel},
      summary: route.summary,
      segments: route.segments,
      geometry: coordinates,
      raw: ors
    });

  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend running on port", PORT));