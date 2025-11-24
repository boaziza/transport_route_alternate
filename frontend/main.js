// FORM + UI ELEMENTS
const form = document.getElementById('routeForm');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');
const routeListEl = document.getElementById('routeList');

let map = L.map('map').setView([-1.95, 30.06], 8); // Rwanda default view (Kigali)

// Add OpenStreetMap layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

let routeLayer = null;

//-------------------- SEARCH ROUTE --------------------
async function searchRoute(from, to, profile='driving-car', preference='fastest') {
  setStatus("Searching...");
  resultsEl.hidden = true;

  try {
    const q = new URLSearchParams({ from, to, profile, preference });
    const res = await fetch(`http://3.87.59.198/api/route?${q.toString()}`);
    console.log("Data",res);

    if (!res.ok) {
      const err = await res.json().catch(()=>({error:'Unknown'}));
      throw new Error(err.error || 'Request failed');
    }

    const data = await res.json();    
    renderResults(data);
    drawRouteOnMap(data);
    setStatus("Route loaded.");

  } catch (err) {
    setStatus("Error: " + err.message);
  }
}

//-------------------- STATUS --------------------
function setStatus(text) {
  statusEl.textContent = text;
}

//-------------------- RENDER RESULTS --------------------
function renderResults(data) {
  resultsEl.hidden = false;
  routeListEl.innerHTML = '';

  const summary = data.summary;
  const segs = data.segments;

  const card = document.createElement('div');
  card.className = 'routeCard';

  const durationMin = (summary.duration / 60).toFixed(1);
  const distanceKm = (summary.distance / 1000).toFixed(2);

  card.innerHTML = `
    <strong>${data.start.label} → ${data.end.label}</strong>
    <div>Duration: <strong>${durationMin} min</strong></div>
    <div>Distance: <strong>${distanceKm} km</strong></div>
  `;

  routeListEl.appendChild(card);
}

//-------------------- MAP DRAWING --------------------
function drawRouteOnMap(data) {
  if (routeLayer) {
    map.removeLayer(routeLayer);
  }

  const coords = data.geometry; // [[lon, lat], ...]

  // Convert to Leaflet format [lat, lon]
  const latLngs = coords.map(c => [c[1], c[0]]);

  routeLayer = L.polyline(latLngs, {
    weight: 5
  }).addTo(map);

  map.fitBounds(routeLayer.getBounds());
}

async function geocodeSearch() {
  const query = document.getElementById('geocodeQuery').value;
  console.log(query);
  
  const resultDiv = document.getElementById('geocodeResult');
  
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = '<p class="loading">Searching...</p>';
  
  try {
    const response = await fetch(`http://3.87.59.198/api/geocode/search?query=${encodeURIComponent(query)}`);
    const data = await response.json();
    console.log("Data",data);
    
    
    if (data.success) {
      resultDiv.innerHTML = `
        <p class="success">✅ Found ${data.results.length} results</p>
        <pre>${JSON.stringify(data.results, null, 2)}</pre>
      `;
    } else {
      resultDiv.innerHTML = `<p class="error">❌ ${data.error}</p>`;
    }
  } catch (error) {
    resultDiv.innerHTML = `<p class="error">❌ Error: ${error.message}</p>`;
  }
}

//-------------------- FORM SUBMIT --------------------
form.addEventListener('submit', e => {
  e.preventDefault();

  const from = document.getElementById('from').value.trim();
  const to = document.getElementById('to').value.trim();
  const profile = document.getElementById('profile').value || `driving-car`;
  const preference = document.getElementById('preference').value;

  console.log('Profile value:', profile);
  console.log('Profile type:', typeof profile);
  console.log('Full params:', { from, to, profile, preference });

  if (!from || !to) return setStatus("Please enter both locations.");

  searchRoute(from, to, profile, preference);
});
