// main.js
const form = document.getElementById('routeForm');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');
const routeListEl = document.getElementById('routeList');
const sortSelect = document.getElementById('sort');

async function searchRoute(from, to, profile='driving-car', preference='fastest') {
  setStatus('Searching...');
  resultsEl.hidden = true;
  routeListEl.innerHTML = '';
  try {
    const q = new URLSearchParams({ from, to, profile, preference });
    const res = await fetch(`/api/route?${q.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(()=>({error:'Unknown'}));
      throw new Error(err.error || 'Request failed');
    }
    const data = await res.json();
    setStatus('Route found.');
    renderResults(data);
  } catch (err) {
    setStatus('Error: ' + (err.message || 'Unknown error'));
  }
}

function setStatus(text) {
  statusEl.textContent = text;
}

function renderResults(data) {
  resultsEl.hidden = false;
  routeListEl.innerHTML = '';
  // summary object: duration (s), distance (m)
  const summary = data.summary || {};
  const segments = data.segments || [];
  // We'll create a simple display card
  const card = document.createElement('div');
  card.className = 'routeCard';
  const durationMin = (summary.duration || 0) / 60;
  const distanceKm = (summary.distance || 0) / 1000;
  card.innerHTML = `
    <strong>${data.start.label} → ${data.end.label}</strong>
    <div class="small">Duration: ${durationMin.toFixed(1)} min | Distance: ${distanceKm.toFixed(2)} km</div>
    <details>
      <summary>Segments (${segments.length})</summary>
      ${segments.map(s => `<div class="small">${s.distance} m, ${Math.round(s.duration)} s — ${s.steps ? s.steps.length+' steps' : ''}</div>`).join('')}
    </details>
  `;
  routeListEl.appendChild(card);
  // raw JSON viewer (hidden by default)
  const raw = document.getElementById('raw');
  raw.textContent = JSON.stringify(data.raw, null, 2);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const from = document.getElementById('from').value.trim();
  const to = document.getElementById('to').value.trim();
  const profile = document.getElementById('profile').value;
  const preference = document.getElementById('preference').value;
  if (!from || !to) return setStatus('Please fill from and to');
  searchRoute(from, to, profile, preference);
});
