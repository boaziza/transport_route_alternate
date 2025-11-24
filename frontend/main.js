// Getting form elements
const form = document.getElementById('routeForm');
const status = document.getElementById('status');
const resultsEl = document.getElementById('results');
const routeList = document.getElementById('routeList');

// Rwanda default view (Kigali)
let map = L.map('map').setView([-1.95, 30.06], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

let routeLayer = null;

let selectedFrom = null;
let selectedTo = null;


async function setupGeocodeSearch(inputId, resultsId, selectionType) {
  const input = document.getElementById(inputId);
  const resultsDiv = document.getElementById(resultsId);
  
  let searchTimeout;
  
  input.addEventListener('input', function() {

    const query = this.value.trim();
    clearTimeout(searchTimeout);
    
    if (!query) {
      resultsDiv.style.display = 'none';
      return;
    }
    
    // Waiting for the user to stop typing to avoid too manu API calss
    searchTimeout = setTimeout(() => {
      performGeocodeSearch(query, resultsDiv, input, selectionType);
    }, 500);
  });
  
  //close when click another place than the search and result block 
  document.addEventListener('click', function(e) {
    if (!resultsDiv.contains(e.target) && e.target !== input) {
      resultsDiv.style.display = 'none';
    }
  });
}

async function performGeocodeSearch(query, resultsDiv, inputEl, selectionType) {
  resultsDiv.style.display = 'block';
  resultsDiv.innerHTML = '<div class="geocode-loading">Searching...</div>';
  
  try {
    const response = await fetch(`http://localhost:3000/api/geocode/search?query=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (data.success && data.results.length > 0) {
      displayGeocodeResults(data.results, resultsDiv, inputEl, selectionType);
    } else {
      resultsDiv.innerHTML = '<div class="geocode-no-results">No locations found</div>';
    }
  } catch (error) {
    resultsDiv.innerHTML = `<div class="geocode-error">Error: ${error.message}</div>`;
  }
}

function displayGeocodeResults(results, resultsDiv, inputEl, selectionType) {
  resultsDiv.innerHTML = '';

  for (let i = 0; i < results.length; i++) {
    const resultItem = document.createElement('div');
    resultItem.className = 'geocode-result-item';

    resultItem.innerHTML = `
      <div class="result-name">${results[i].name}</div>
      <div class="result-details">
        ${results[i].region ? results[i].region + ', ' : ''}${results[i].country || ''}
      </div>
    `;
    
    resultItem.addEventListener('click', function() {

      inputEl.value = results[i].name;
      
      if (selectionType === 'from') {
        selectedFrom = {
          name: results[i].name,
          coordinates: results[i].coordinates 
        };
        console.log('Selected FROM:', selectedFrom);
      } else {
        selectedTo = {
          name: results[i].name,
          coordinates: results[i].coordinates 
        };
        console.log('Selected TO:', selectedTo);
      }
      
      resultsDiv.style.display = 'none';
      
      // Add visual marker on map
      addLocationMarker(results[i].coordinates, results[i].name, selectionType);
    });
    
    resultsDiv.appendChild(resultItem);
    
  }
}

// Add markers for selected locations
let fromMarker = null;
let toMarker = null;

function addLocationMarker(coordinates, name, type) {
  const [lon, lat] = coordinates;
  
  const icon = L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-${type}">${type === 'from' ? 'A' : 'B'}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  });
  
  //remove old marker on the map
  if (type === 'from' && fromMarker) {
    map.removeLayer(fromMarker);
  } else if (type === 'to' && toMarker) {
    map.removeLayer(toMarker);
  }
  
  //Add new marker on map
  const marker = L.marker([lat, lon], { icon }).addTo(map);
  marker.bindPopup(`<b>${type === 'from' ? 'Start' : 'End'}:</b><br>${name}`).openPopup();
  
  if (type === 'from') {
    fromMarker = marker;
  } else {
    toMarker = marker;
  }
  
  map.setView([lat, lon], 12);
}

async function searchRoute(profile='driving-car', preference='fastest') {

  if (!selectedFrom || !selectedTo) {
    setStatus("Please select both locations from the search results.");
    return;
  }
  
  setStatus("Searching route...");
  resultsEl.hidden = true;

  try {

    const params = new URLSearchParams({
      fromLon: selectedFrom.coordinates[0],
      fromLat: selectedFrom.coordinates[1],
      toLon: selectedTo.coordinates[0],
      toLat: selectedTo.coordinates[1],
      fromName: selectedFrom.name,
      toName: selectedTo.name,
      profile: profile,
      preference: preference
    });
    
    const res = await fetch(`http://localhost:3000/api/route?${params.toString()}`);
    console.log("Route response:", res);

    if (!res.ok) {
      const err = await res.json().catch(()=>({error:'Unknown'}));
      throw new Error(err.error || 'Request failed');
    }

    const data = await res.json();    
    renderResults(data);
    drawRouteOnMap(data);
    setStatus("Route loaded !");

  } catch (err) {
    setStatus("Error: " + err.message);
    console.error('Route error:', err);
  }
}


function setStatus(text) {
  status.textContent = text;
}


function renderResults(data) {
  resultsEl.hidden = false;
  routeList.innerHTML = '';

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

  routeList.appendChild(card);
}

function drawRouteOnMap(data) {
  if (routeLayer) {
    map.removeLayer(routeLayer);
  }

  const coords = data.geometry;

  // Convert format [lat, lon]
  const latLngs = coords.map(c => [c[1], c[0]]);

  routeLayer = L.polyline(latLngs, {
    color: '#2563eb',
    weight: 5,
    opacity: 0.7
  }).addTo(map);

  map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
}

form.addEventListener('submit', e => {
  e.preventDefault();

  const profile = document.getElementById('profile').value || 'driving-car';
  const preference = document.getElementById('preference').value || 'fastest';

  searchRoute(profile, preference);
});

document.addEventListener('DOMContentLoaded', function() {
  setupGeocodeSearch('from', 'fromResults', 'from');
  setupGeocodeSearch('to', 'toResults', 'to');
  
  setStatus("Enter locations in Rwanda to search for routes.");
});