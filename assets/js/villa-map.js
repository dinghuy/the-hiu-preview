/**
 * The Hiu Collection · Airbnb-style Interactive Villa Map
 * Powered by Leaflet & OpenStreetMap tiles.
 * Displays all 7 portfolio residences with custom interactive pill markers,
 * approximate privacy circle for active villa, and preview popup cards.
 */

document.addEventListener('DOMContentLoaded', () => {
  initVillaDetailMap();
  initHomePortfolioMap();
});

function initVillaDetailMap() {
  const mapElement = document.getElementById('villa-detail-map');
  const configElement = document.getElementById('villa-map-data');
  if (!mapElement || !configElement || typeof L === 'undefined') return;

  let mapData;
  try {
    mapData = JSON.parse(configElement.textContent);
  } catch (err) {
    console.error('Failed to parse villa map data:', err);
    return;
  }

  const { currentVilla, allVillas } = mapData;
  if (!currentVilla || !allVillas || !allVillas.length) return;

  // Initialize Leaflet map
  const initialCenter = [currentVilla.lat, currentVilla.lng];
  const map = L.map('villa-detail-map', {
    center: initialCenter,
    zoom: 15,
    minZoom: 10,
    maxZoom: 18,
    scrollWheelZoom: false, // Prevent page scrolling lock
    zoomControl: false // Custom controls positioned cleanly
  });

  // Add Esri World Street Map (Clean, international English labels, zero watermarks, warm luxury tone)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a> &mdash; DeLorme, NAVTEQ',
    maxZoom: 18
  }).addTo(map);

  // Position standard zoom control at bottom-right
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Add Airbnb signature approximate privacy circle for current villa
  const privacyCircle = L.circle(initialCenter, {
    radius: currentVilla.radius || 250,
    color: '#8E652B',
    weight: 1.5,
    opacity: 0.65,
    fillColor: '#8E652B',
    fillOpacity: 0.12,
    dashArray: '4, 6'
  }).addTo(map);

  privacyCircle.bindTooltip('Approximate villa neighborhood area', {
    direction: 'top',
    className: 'hiu-circle-tooltip'
  });

  // Add markers for all 7 villas in the collection
  const markers = [];
  const latLngs = [];

  allVillas.forEach(villa => {
    const isCurrent = villa.id === currentVilla.id;
    latLngs.push([villa.lat, villa.lng]);

    // Create custom Airbnb Pill HTML
    const markerHtml = `
      <div class="hiu-map-pill ${isCurrent ? 'is-active-villa' : ''}" aria-label="${villa.name} - ${villa.displayRate}">
        <span class="pill-dot"></span>
        <span class="pill-code">${villa.code}</span>
        <span class="pill-price">$${villa.startingUSD}</span>
      </div>
    `;

    const icon = L.divIcon({
      className: 'hiu-marker-wrapper',
      html: markerHtml,
      iconSize: isCurrent ? [124, 48] : [116, 44],
      iconAnchor: isCurrent ? [62, 24] : [58, 22],
      popupAnchor: [0, isCurrent ? -26 : -24]
    });

    const marker = L.marker([villa.lat, villa.lng], {
      icon,
      title: `${villa.name} - ${villa.displayRate}`,
      alt: `${villa.name} - ${villa.displayRate}`,
      zIndexOffset: isCurrent ? 1000 : 100
    }).addTo(map);

    // Create Airbnb preview popup card
    const popupHtml = `
      <div class="hiu-map-popup-card">
        <div class="popup-card-media">
          <img src="${villa.coverImage}" alt="${villa.name}" width="280" height="175" loading="lazy">
          <span class="popup-region-badge">${villa.code} · ${villa.region}</span>
          ${isCurrent ? '<span class="popup-current-tag">You are viewing this</span>' : ''}
        </div>
        <div class="popup-card-body">
          <h4 class="popup-card-title">${villa.name}</h4>
          <p class="popup-card-meta">${villa.bedrooms} · ${villa.capacity}</p>
          <div class="popup-card-footer">
            <div class="popup-card-price">
              <strong>$${villa.startingUSD}</strong>
              <small>/ night</small>
            </div>
            ${isCurrent
              ? '<span class="popup-status-label">Current Residence</span>'
              : `<a href="${villa.url}" class="button button-dark button-small popup-card-cta">Explore villa →</a>`
            }
          </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml, {
      className: 'hiu-leaflet-popup',
      maxWidth: 300,
      minWidth: 260,
      closeButton: true,
      autoPanPadding: [20, 20]
    });

    markers.push(marker);
  });

  // Action Button: Focus this villa
  const btnFocus = document.getElementById('map-btn-focus');
  if (btnFocus) {
    btnFocus.addEventListener('click', () => {
      map.flyTo(initialCenter, 15, {
        duration: 1.2,
        easeLinearity: 0.25
      });
      // Find current marker and open popup
      const curMarker = markers.find((_, i) => allVillas[i].id === currentVilla.id);
      if (curMarker) {
        setTimeout(() => curMarker.openPopup(), 1200);
      }
    });
  }

  // Action Button: View all 7 villas across Vũng Tàu & Hồ Tràm
  const btnAll = document.getElementById('map-btn-all');
  if (btnAll) {
    btnAll.addEventListener('click', () => {
      if (latLngs.length) {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 13
        });
      }
    });
  }
}

function initHomePortfolioMap() {
  const mapElement = document.getElementById('home-portfolio-map');
  const configElement = document.getElementById('home-map-data');
  if (!mapElement || !configElement || typeof L === 'undefined') return;

  let mapData;
  try {
    mapData = JSON.parse(configElement.textContent);
  } catch (err) {
    console.error('Failed to parse home portfolio map data:', err);
    return;
  }

  const { allVillas } = mapData;
  if (!allVillas || !allVillas.length) return;

  const map = L.map('home-portfolio-map', {
    center: [10.42, 107.20],
    zoom: 11,
    minZoom: 10,
    maxZoom: 18,
    scrollWheelZoom: false,
    zoomControl: false
  });

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  const markers = [];
  const latLngs = [];

  allVillas.forEach(villa => {
    latLngs.push([villa.lat, villa.lng]);

    const markerHtml = `
      <div class="hiu-map-pill" aria-label="${villa.name} - ${villa.displayRate}">
        <span class="pill-dot"></span>
        <span class="pill-code">${villa.code}</span>
        <span class="pill-price">$${villa.startingUSD}</span>
      </div>
    `;

    const icon = L.divIcon({
      className: 'hiu-marker-wrapper',
      html: markerHtml,
      iconSize: [116, 44],
      iconAnchor: [58, 22],
      popupAnchor: [0, -24]
    });

    const marker = L.marker([villa.lat, villa.lng], {
      icon,
      title: `${villa.name} - ${villa.displayRate}`,
      alt: `${villa.name} - ${villa.displayRate}`,
      zIndexOffset: 100
    }).addTo(map);

    const popupHtml = `
      <div class="hiu-map-popup-card">
        <div class="popup-card-media">
          <img src="${villa.coverImage}" alt="${villa.name}" width="280" height="175" loading="lazy">
          <span class="popup-region-badge">${villa.code} · ${villa.region}</span>
        </div>
        <div class="popup-card-body">
          <h4 class="popup-card-title">${villa.name}</h4>
          <p class="popup-card-meta">${villa.bedrooms} · ${villa.capacity}</p>
          <div class="popup-card-footer">
            <div class="popup-card-price">
              <strong>$${villa.startingUSD}</strong>
              <small>/ night</small>
            </div>
            <a href="${villa.url}" class="button button-dark button-small popup-card-cta">Explore villa →</a>
          </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml, {
      className: 'hiu-leaflet-popup',
      maxWidth: 300,
      minWidth: 260,
      closeButton: true,
      autoPanPadding: [20, 20]
    });

    markers.push(marker);
  });

  if (latLngs.length) {
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 12
    });
  }

  const btnAll = document.getElementById('map-btn-all-home');
  if (btnAll) {
    btnAll.addEventListener('click', () => {
      if (latLngs.length) {
        map.fitBounds(L.latLngBounds(latLngs), {
          padding: [40, 40],
          maxZoom: 12
        });
      }
    });
  }

  const btnVT = document.getElementById('map-btn-vt-home');
  if (btnVT) {
    btnVT.addEventListener('click', () => {
      const vtVillas = allVillas.filter(v => v.region === 'Vũng Tàu');
      if (vtVillas.length) {
        map.fitBounds(L.latLngBounds(vtVillas.map(v => [v.lat, v.lng])), {
          padding: [50, 50],
          maxZoom: 15
        });
      }
    });
  }

  const btnHT = document.getElementById('map-btn-ht-home');
  if (btnHT) {
    btnHT.addEventListener('click', () => {
      const htVilla = allVillas.find(v => v.region === 'Hồ Tràm');
      if (htVilla) {
        map.flyTo([htVilla.lat, htVilla.lng], 14, { duration: 1.2 });
        const htMarker = markers.find((_, i) => allVillas[i].id === htVilla.id);
        if (htMarker) {
          setTimeout(() => htMarker.openPopup(), 1200);
        }
      }
    });
  }
}
