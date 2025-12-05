// main.js — mapa, filtros, panel deslizante y render
let map, markers = [];

const ICON_MAP = {
  "Restaurante": "icon_restaurante.png",
  "Hospedaje": "icon_hospedaje.png",
  "Tienda": "icon_tienda.png",
  "Farmacia": "icon_farmacia.png",
  "Ferretería": "icon_ferreteria.png",
  "Terreno": "icon_terreno.png",
  "Picantería":"icon_restaurante.png",
  "Mecánica de carros":"icon_mecanica_carros.png",
  "Mecánica de motos":"icon_mecanica_motos.png",
  "Lavadora de carros":"icon_lavadora.png",
  "Tecnología y accesorios":"icon_tecnologia.png",
  "Veterinaria":"icon_veterinaria.png",
  "Insumos agrícolas":"icon_agro.png",
  "Hostería":"icon_hospedaje.png",
  "Lugar de eventos":"icon_evento.png",
  "Jugos de caña":"icon_jugos.png",
  "Canchas fútbol":"icon_cancha.png",
  "Canchas ecuavoley":"icon_cancha.png",
  "Áreas verdes":"icon_parque.png",
  "Óptica":"icon_optica.png",
  "Papelería":"icon_papeleria.png",
  "Bazar":"icon_bazar.png",
  "Bazar y Papelería":"icon_bazar.png"
};

function getIconFor(type){
  const name = ICON_MAP[type] || "icon_default.png";
  return L.icon({
    iconUrl: `assents/img/${name}`,
    iconSize: [36,36],
    iconAnchor: [18,36],
    popupAnchor: [0,-30]
  });
}

function initMap(){
  map = L.map('map').setView([-4.1959, -79.1982], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
  renderLegend();
  buildMenus();
  renderAll(window.places);
  buildFilters();
  setupPanelControls();
}

function clearMarkers(){ markers.forEach(m => map.removeLayer(m)); markers = []; }

function renderAll(data){
  clearMarkers();
  const list = document.getElementById("list");
  if(list) list.innerHTML = "";
  data.forEach(p => { addMarker(p); addToList(p); });
}

function addMarker(p){
  if (p.lat === undefined || p.lon === undefined) return;
  const marker = L.marker([p.lat, p.lon], {icon: getIconFor(p.type)}).addTo(map);
  marker.on('click', () => openPanel(p));
  markers.push(marker);
}

function addToList(p){
  const list = document.getElementById("list");
  if(!list) return;
  const div = document.createElement("div");
  div.className = "item";
  div.innerHTML = `<strong>${p.name}</strong><br><small>${p.type} — ${p.address || ''}</small>`;
  div.onclick = ()=> { map.setView([p.lat, p.lon], 17); openPanel(p); };
  list.appendChild(div);
}

function openPanel(p){
  const panel = document.getElementById("panel");
  const content = document.getElementById("panel-content");
  let photos = "";
  if (p.photos && p.photos.length){
    photos = p.photos.slice(0,3).map(src=> `<img src="assents/img/${src}" alt="" />`).join("");
  } else {
    photos = `<img src="assents/img/icon_default.png" alt="" />`;
  }
  content.innerHTML = `
    <h2>${p.name}</h2>
    <p><strong>${p.type}</strong> · ${p.address || ''}</p>
    <p>${p.short || p.description || ''}</p>
    <div class="photos">${photos}</div>
    <p><strong>Tel:</strong> ${p.phone || '—'}</p>
    <div class="cta">
      <button class="btn" onclick="window.open('https://wa.me/${(p.phone||'').replace(/[^0-9]/g,'') }','_blank')">WhatsApp</button>
      <button class="btn" onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}','_blank')">Cómo llegar</button>
    </div>
  `;
  panel.classList.add("open");
}

function setupPanelControls(){ document.getElementById("panel-close").addEventListener("click", ()=>{ document.getElementById("panel").classList.remove("open"); }); }

function buildMenus(){
  const negociosEl = document.getElementById("menu-negocios");
  const serviciosEl = document.getElementById("menu-servicios");
  const negSet = new Set();
  const servSet = new Set();
  window.places.forEach(p=>{ if ((p.category||"").toLowerCase() === "negocio") negSet.add(p.type); else servSet.add(p.type); });
  negSet.forEach(t=>{ const btn=document.createElement("button"); btn.textContent=t; btn.onclick=()=> filterByType(t); negociosEl.appendChild(btn); });
  servSet.forEach(t=>{ const btn=document.createElement("button"); btn.textContent=t; btn.onclick=()=> filterByType(t); serviciosEl.appendChild(btn); });
}

function filterByType(type){ const filtered = window.places.filter(p=>p.type === type); renderAll(filtered); }

function renderLegend(){
  const el = document.getElementById("legend");
  const types = Array.from(new Set(window.places.map(p=>p.type)));
  el.innerHTML = "<strong>Leyenda</strong><br>";
  types.forEach(t=>{ const icon = ICON_MAP[t] || "icon_default.png"; el.innerHTML += `<div style="margin-top:6px"><img src="assents/img/${icon}" style="width:20px;height:20px;margin-right:6px;vertical-align:middle">${t}</div>`; });
}

function buildFilters(){ const fc = document.getElementById("filter-controls"); if(!fc) return; fc.innerHTML = `<input id="search" placeholder="Buscar por nombre o tipo" style="width:100%;padding:8px;border-radius:8px;border:1px solid #ddd"/>`; document.getElementById("search").addEventListener("input", (e)=>{ const q = e.target.value.toLowerCase(); const filtered = window.places.filter(p => (p.name||"").toLowerCase().includes(q) || (p.type||"").toLowerCase().includes(q)); renderAll(filtered); }); }