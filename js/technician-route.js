/* Crystalina technician routing powered by Leaflet, OpenStreetMap, OSRM, and Photon. */
(() => {
  const planner = document.getElementById('technicianRoutePlanner');
  if (!planner || typeof L === 'undefined') return;

  const dateInput = document.getElementById('routeDate');
  const startInput = document.getElementById('routeStartTime');
  const list = document.getElementById('routeJobList');
  const selectedCount = document.getElementById('routeSelectedCount');
  const status = document.getElementById('routeMapStatus');
  const summary = document.getElementById('routeSummary');
  const itinerary = document.getElementById('routeItinerary');
  const selected = new Set();
  let map;
  let routeLayer;
  let markerLayer;

  const isInstallation = job => /install/i.test(job.type || '');
  const serviceMinutes = job => Number(job.installationMinutes || 30);
  const minutesLabel = minutes => minutes < 60 ? `${Math.round(minutes)} min` : `${Math.floor(minutes / 60)} hr ${Math.round(minutes % 60) ? `${Math.round(minutes % 60)} min` : ''}`.trim();
  const milesLabel = meters => `${(meters / 1609.344).toFixed(meters > 16093 ? 0 : 1)} mi`;
  const timeFromMinutes = total => {
    const value = ((total % 1440) + 1440) % 1440;
    const hour = Math.floor(value / 60); const minute = Math.round(value % 60);
    return new Date(`2026-01-01T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };
  const startMinutes = () => { const [hour, minute] = (startInput.value || '08:30').split(':').map(Number); return hour * 60 + minute; };
  const dateFromKey = key => new Date(`${key}T12:00:00`);

  function technicianJobs() {
    const session = Store.currentStaff();
    if (!session) return [];
    return Store.getAdminData().jobs
      .filter(job => job.technician === session.name && job.date === dateInput.value && job.status !== 'Completed')
      .sort((a, b) => Number(isInstallation(b)) - Number(isInstallation(a)) || String(a.time).localeCompare(String(b.time)));
  }

  function ensureMap() {
    if (map) { setTimeout(() => map.invalidateSize(), 0); return; }
    map = L.map('technicianMap', { zoomControl: false, attributionControl: true }).setView([40.7306, -73.9352], 10);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
  }

  function markerIcon(number, installation = false) {
    return L.divIcon({ className: '', html: `<span class="crystalina-map-marker ${installation ? 'installation' : ''}"><b>${number}</b></span>`, iconSize: [34, 42], iconAnchor: [17, 42], popupAnchor: [0, -38] });
  }

  function showSelectedMarkers(jobs = technicianJobs().filter(job => selected.has(job.id))) {
    ensureMap(); markerLayer.clearLayers();
    const located = jobs.filter(job => Number(job.lat) && Number(job.lon));
    located.forEach((job, index) => L.marker([Number(job.lat), Number(job.lon)], { icon: markerIcon(index + 1, isInstallation(job)) }).bindPopup(`<strong>${escapeHTML(job.customer)}</strong><br>${escapeHTML(job.address)}<br>${serviceMinutes(job)} min service`).addTo(markerLayer));
    if (located.length) map.fitBounds(L.latLngBounds(located.map(job => [Number(job.lat), Number(job.lon)])).pad(.22), { maxZoom: 13 });
  }

  function renderJobs({ preserveSelection = true } = {}) {
    const jobs = technicianJobs();
    if (!preserveSelection) { selected.clear(); jobs.forEach(job => selected.add(job.id)); }
    [...selected].forEach(id => { if (!jobs.some(job => job.id === id)) selected.delete(id); });
    list.innerHTML = jobs.length ? jobs.map(job => `<label class="route-job-option ${isInstallation(job) ? 'installation' : 'delivery'}"><input type="checkbox" value="${job.id}" ${selected.has(job.id) ? 'checked' : ''}><span class="route-job-order">${isInstallation(job) ? 'I' : 'D'}</span><span class="route-job-copy"><strong>${escapeHTML(job.customer)}</strong><small>${escapeHTML(job.type)} · ${escapeHTML(job.address)}</small></span><span class="route-duration-control"><small>Service</small><select aria-label="Service duration for ${escapeHTML(job.customer)}" onchange="TechnicianRouteUI.updateDuration('${job.id}',this.value)">${[15,30,45,60].map(value => `<option value="${value}" ${serviceMinutes(job) === value ? 'selected' : ''}>${value === 60 ? '1 hr' : `${value} min`}</option>`).join('')}</select></span></label>`).join('') : '<div class="route-empty"><strong>No jobs on this date</strong><span>Choose another date or ask dispatch to assign a job.</span></div>';
    selectedCount.textContent = `${selected.size} selected`;
    summary.hidden = true; itinerary.hidden = true;
    if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
    showSelectedMarkers();
    status.textContent = jobs.length < 2 ? 'At least two assigned stops are needed for route optimization.' : 'Select two or more stops, then optimize the route.';
    status.classList.remove('error', 'loading');
  }

  async function ensureCoordinates(job) {
    if (Number(job.lat) && Number(job.lon)) return job;
    const query = encodeURIComponent(`${job.address}, New York, NY, USA`);
    const response = await fetch(`https://photon.komoot.io/api/?q=${query}&limit=1&lang=en`);
    if (!response.ok) throw new Error(`Could not locate ${job.customer}`);
    const result = await response.json(); const coordinates = result.features?.[0]?.geometry?.coordinates;
    if (!coordinates) throw new Error(`No map result for ${job.customer}`);
    const located = { ...job, lon: coordinates[0], lat: coordinates[1] };
    Store.updateAdminItem('jobs', job.id, { lon: located.lon, lat: located.lat });
    return located;
  }

  function renderOptimizedRoute(ordered, trip) {
    markerLayer.clearLayers();
    ordered.forEach((job, index) => L.marker([Number(job.lat), Number(job.lon)], { icon: markerIcon(index + 1, isInstallation(job)) }).bindPopup(`<strong>Stop ${index + 1}: ${escapeHTML(job.customer)}</strong><br>${escapeHTML(job.type)}<br>${serviceMinutes(job)} min service`).addTo(markerLayer));
    const latLngs = trip.geometry.coordinates.map(point => [point[1], point[0]]);
    routeLayer = L.polyline(latLngs, { color: '#1479d1', weight: 6, opacity: .9, lineJoin: 'round' }).addTo(map);
    map.fitBounds(routeLayer.getBounds().pad(.12));

    let clock = startMinutes();
    const schedule = ordered.map((job, index) => {
      const arrival = clock; const finish = arrival + serviceMinutes(job);
      const driveAfter = Number(trip.legs?.[index]?.duration || 0) / 60;
      clock = finish + driveAfter;
      return { job, arrival, finish, driveAfter };
    });
    const serviceTotal = ordered.reduce((total, job) => total + serviceMinutes(job), 0);
    summary.hidden = false;
    summary.innerHTML = `<div><span>Stops</span><strong>${ordered.length}</strong></div><div><span>Drive</span><strong>${minutesLabel(trip.duration / 60)}</strong></div><div><span>Distance</span><strong>${milesLabel(trip.distance)}</strong></div><div><span>Service</span><strong>${minutesLabel(serviceTotal)}</strong></div><div><span>Finish</span><strong>${timeFromMinutes(startMinutes() + trip.duration / 60 + serviceTotal)}</strong></div>`;
    itinerary.hidden = false;
    itinerary.innerHTML = `<div class="panel-title-row"><div><span class="eyebrow">Optimized Itinerary</span><h3>${dateFromKey(dateInput.value).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3></div><span class="admin-badge">${isInstallation(ordered[0]) ? 'Installation-priority start' : 'Optimized driving order'}</span></div><div class="route-itinerary-list">${schedule.map((item, index) => `<article><span class="route-itinerary-number">${index + 1}</span><div><time>${timeFromMinutes(item.arrival)}</time><strong>${escapeHTML(item.job.customer)}</strong><p>${escapeHTML(item.job.address)}</p><small>${escapeHTML(item.job.type)} · ${serviceMinutes(item.job)} min service · finish ${timeFromMinutes(item.finish)}</small></div>${index < schedule.length - 1 ? `<span class="route-drive-leg">${minutesLabel(item.driveAfter)} drive</span>` : '<span class="route-drive-leg final">Route complete</span>'}</article>`).join('')}</div>`;
  }

  async function optimize() {
    const jobs = technicianJobs().filter(job => selected.has(job.id));
    if (jobs.length < 2) { toast('Select at least two customer stops'); return; }
    const button = document.getElementById('optimizeRouteBtn');
    button.disabled = true; button.textContent = 'Optimizing…';
    status.textContent = 'Locating stops and calculating the best driving order…'; status.classList.add('loading'); status.classList.remove('error');
    try {
      const located = [];
      for (const job of jobs) located.push(await ensureCoordinates(job));
      const coordinates = located.map(job => `${job.lon},${job.lat}`).join(';');
      const response = await fetch(`https://router.project-osrm.org/trip/v1/driving/${coordinates}?source=first&roundtrip=false&overview=full&geometries=geojson&steps=false`);
      if (!response.ok) throw new Error('The route service is temporarily unavailable');
      const result = await response.json();
      if (result.code !== 'Ok' || !result.trips?.[0]) throw new Error(result.message || 'No drivable route was found');
      const ordered = result.waypoints.map((waypoint, inputIndex) => ({ ...located[inputIndex], routeOrder: waypoint.waypoint_index })).sort((a, b) => a.routeOrder - b.routeOrder);
      renderOptimizedRoute(ordered, result.trips[0]);
      status.textContent = 'Route optimized. ETAs include the selected service duration at every stop.'; status.classList.remove('loading');
      Store.logActivity(Store.currentStaff().id, `Optimized ${ordered.length}-stop route`, dateInput.value);
    } catch (error) {
      status.textContent = `${error.message}. Check the addresses or try again in a moment.`;
      status.classList.remove('loading'); status.classList.add('error');
      toast('Route could not be optimized');
    } finally { button.disabled = false; button.textContent = 'Optimize Route'; }
  }

  list.addEventListener('change', event => {
    if (event.target.type !== 'checkbox') return;
    if (event.target.checked) selected.add(event.target.value); else selected.delete(event.target.value);
    selectedCount.textContent = `${selected.size} selected`; showSelectedMarkers(); summary.hidden = true; itinerary.hidden = true;
  });
  dateInput.addEventListener('change', () => renderJobs({ preserveSelection: false }));
  document.getElementById('selectInstallationStops').addEventListener('click', () => {
    selected.clear(); technicianJobs().filter(isInstallation).forEach(job => selected.add(job.id)); renderJobs();
  });
  document.getElementById('optimizeRouteBtn').addEventListener('click', optimize);

  window.TechnicianRouteUI = {
    render: () => renderJobs(),
    updateDuration(id, value) {
      Store.updateAdminItem('jobs', id, { installationMinutes: Number(value), updatedBy: Store.currentStaff().id, updatedAt: new Date().toISOString() });
      Store.logActivity(Store.currentStaff().id, `Set service duration to ${value} minutes`, id);
      summary.hidden = true; itinerary.hidden = true; toast('Service duration updated');
    }
  };

  function initialize() {
    const session = Store.currentStaff(); if (!session || planner.closest('.portal-shell')?.hidden) return;
    const jobs = Store.getAdminData().jobs.filter(job => job.technician === session.name && job.status !== 'Completed').sort((a, b) => a.date.localeCompare(b.date));
    dateInput.value = jobs[0]?.date || new Date().toISOString().slice(0, 10);
    ensureMap(); renderJobs({ preserveSelection: false });
  }
  window.addEventListener('technician-session-ready', initialize);
  initialize();
})();
