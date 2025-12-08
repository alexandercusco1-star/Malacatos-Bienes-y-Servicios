// main.js - Leaflet map, markers from data/*.json, icons loaded from data/*.jpg

let map;
let openPopup = null;
let markerLayerGroup;

function imgPath(name) {
  if (!name) return "";
  return "data/" + encodeURIComponent(name);
}

async function init() {
  // inicializar mapa Leaflet
  map = L.map('map', { zoomControl: true }).setView([-4.2190, -79.2575], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  markerLayerGroup = L.layerGroup().addTo(map);

  // cargar datos
  const [categorias, bienes, servicios] = await Promise.all([
    fetch('data/categorias.json').then(r => r.json()).catch(()=>({})),
    fetch('data/bienes.json').then(r => r.json()).catch(()=>([])),
    fetch('data/servicios.json').then(r => r.json()).catch(()=>([]))
  ]);

  // agregar marcadores
  addMarkersFromList(bienes, categorias);
  addMarkersFromList(servicios, categorias);

  // cerrar popup al mover/alejar mapa
  map.on('movestart', () => {
    if (openPopup) {
      map.closePopup(openPopup);
      openPopup = null;
    }
  });

  // cerrar popup al click en mapa (si quieres)
  map.on('click', () => {
    if (openPopup) {
      map.closePopup(openPopup);
      openPopup = null;
    }
  });
}

function createIcon(iconFile) {
  // si no existe iconFile, devolver divIcon con marcador por defecto
  if (!iconFile) {
    return L.divIcon({ html: '📍', className: 'emoji-icon', iconSize: [28,28] });
  }
  return L.icon({
    iconUrl: imgPath(iconFile),
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
}

function addMarkersFromList(list, categorias) {
  if (!Array.isArray(list)) return;
  list.forEach(item => {
    // soporta nombres lat/long con strings
    const lat = parseFloat(item.lat || item.latitud || item.latitude || item.latitud);
    const lng = parseFloat(item.lng || item.longitud || item.longitude || item.longitud);

    if (isNaN(lat) || isNaN(lng)) return;

    // icono desde categorias (por categoría) o desde el propio item.icono
    let iconFile = null;
    if (item.icono) iconFile = item.icono;
    // buscar por categoria dentro de categorias.json si existe estructura
    try {
      if (categorias) {
        // categorias puede tener estructura { "bienes": { "Parque": {"icono": "icon-casa.jpg"} }, "servicios": {...} }
        const tipoGroup = item.tipo || (item.tipo === undefined ? "servicios" : item.tipo);
        if (categorias[tipoGroup] && categorias[tipoGroup][item.categoria] && categorias[tipoGroup][item.categoria].icono) {
          iconFile = categorias[tipoGroup][item.categoria].icono;
        }
      }
    } catch (e) { /* ignore */ }

    const marker = L.marker([lat, lng], { icon: createIcon(iconFile) }).addTo(markerLayerGroup);

    // popup con texto + hasta 3 fotos
    const fotos = Array.isArray(item.imagenes) ? item.imagenes.slice(0,3) : [];
    const fotosHtml = fotos.map(f => `<img src="${imgPath(f)}" class="popup-img" />`).join('');
    const direccion = item.direccion || item.ubicacion || "";

    const html = `
      <div style="min-width:220px">
        <h3 style="margin:0 0 6px 0">${item.nombre || ""}</h3>
        <div style="font-size:13px; margin-bottom:6px">${item.descripcion || ""}</div>
        ${direccion ? `<div style="font-size:13px"><strong>Dirección:</strong> ${direccion}</div>` : ""}
        ${item.telefono ? `<div style="font-size:13px"><strong>Tel:</strong> ${item.telefono}</div>` : ""}
        <div style="display:flex; gap:6px; margin-top:8px">${fotosHtml}</div>
      </div>
    `;

    marker.on('click', () => {
      // cerrar popup abierto
      if (openPopup) {
        map.closePopup(openPopup);
        openPopup = null;
      }
      const popup = L.popup({ maxWidth: 360 })
        .setLatLng([lat, lng])
        .setContent(html)
        .openOn(map);
      openPopup = popup;
      // centrar un poco y hacer zoom suave
      map.setView([lat, lng], 15, { animate: true });
    });
  });
}

// iniciar al cargar la página
document.addEventListener('DOMContentLoaded', init);
