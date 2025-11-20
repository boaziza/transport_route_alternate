require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ---------- YOUR OPENROUTESERVICE KEY ----------
const ORS_KEY = process.env.ORS_KEY;

// ---------- 1. GEOCODING FUNCTION ----------
async function geocode(placeName) {
  const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_KEY}&text=${encodeURIComponent(placeName)}&boundary.country=RW`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.features || data.features.length === 0) {
    throw new Error("Could not find location: " + placeName);
  }

  const [lon, lat] = data.features[0].geometry.coordinates;
  return { lat, lon };
}

// Convert two locations → ORS coordinate array
async function geocodeToCoords(from, to) {
  const start = await geocode(from);
  const end = await geocode(to);

  return [
    [start.lon, start.lat],
    [end.lon, end.lat]
  ];
}

// ---------- 2. MAIN ROUTE API ----------
app.get("/api/route", async (req, res) => {
  const { from, to, profile, preference } = req.query;

  try {
    // Convert addresses → ORS coordinates
    const coords = await geocodeToCoords(from, to);

    const url = `https://api.openrouteservice.org/v2/directions/${profile}`;

    const body = {
      coordinates: coords,
      preference: preference || "fastest"
    };

    const orsRes = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": ORS_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const ors = await orsRes.json();

    if (!ors.features) {
      console.log("ORS ERROR:", ors);
      return res.status(500).json({ error: "ORS API Error", details: ors });
    }

    const feature = ors.features[0];

    return res.json({
      start: { label: from },
      end: { label: to },
      summary: feature.properties.summary,
      segments: feature.properties.segments,
      geometry: feature.geometry.coordinates,
      raw: ors
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ---------- 3. DEPLOYMENT FRIENDLY ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend running on port", PORT));
