// main.js - mapa, carga data, buscador, filtros, bottom-panel, destacados, ver todos
const map = L.map('map').setView([-4.219167, -79.258333], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ maxZoom: 19 }).addTo(map);

// helpers
async function cargar(ruta){ const r = await fetch(ruta); return await r.json(); }
function iconoDe(ruta, size=36){
  return L.icon({ iconUrl:`data/${ruta}`, iconSize:[size,size], iconAnchor:[Math.round(size/2),size], popupAnchor:[0,-size+6] });
}

let ALL = { bienes: [], servicios: [], categorias: {} };
let markers = [];
let currentFilter = null;
let currentSearch = '';

// UI refs
const searchInput = () => document.getElementById('search-input');
const filtersBox = () => document.getElementById('filters');
const listaDestacadosBienes = () => document.getElementById('destacados-bienes');
const listaDestacadosServicios = () => document.getElementById('destacados-servicios');
const leyendaDrawer = () => document.getElementById('leyenda-drawer');
const leyendaItems = () => document.getElementById('leyenda-items');
const leyendaBar = () => document.getElementById('leyenda-bar');

async function iniciar(){
  // *** ÚNICO CAMBIO IMPORTANTE ***
  [ALL.bienes, ALL.servicios, ALL.categorias] = await Promise.all([
    cargar('data/bienes.json'),
    cargar('data/servicios.json'),
    cargar('data/categorias.json') // ← EXACTO como en tu GitHub
  ]);

  generarFiltros();
  bindControls();
  renderizarTodo();
  pintarLeyenda();
}

// clear markers
function clearMarkers(){
  markers.forEach(m=>map.removeLayer(m));
  markers = [];
}

// render everything considering filters & search
function renderizarTodo(){
  clearMarkers();

  const combined = [...ALL.bienes, ...ALL.servicios];

  const visibles = combined.filter(i=>{
    const text = (i.nombre + ' ' + (i.categoria||'') + ' ' + (i.descripcion||'')).toLowerCase();
    if(currentSearch && !text.includes(currentSearch.toLowerCase())) return false;
    if(currentFilter && i.categoria !== currentFilter) return false;
    return true;
  });

  // DESTACADOS
  const destacadosBien = ALL.bienes.filter(x => x.destacado);
  const destacadosServ = ALL.servicios.filter(x => x.destacado);

  renderListaDestacados(destacadosBien, 'destacados-bienes');
  renderListaDestacados(destacadosServ, 'destacados-servicios');

  // add markers
  visibles.forEach(item=>{
    const lat = parseFloat(item.latitud);
    const lng = parseFloat(item.longitud);
    if(Number.isNaN(lat) || Number.isNaN(lng)) return;

    let iconFile = item.icono || 
      (ALL.categorias[item.tipo] && ALL.categorias[item.tipo][item.categoria] && ALL.categorias[item.tipo][item.categoria].icono) 
      || 'icon-default.jpeg';

    const marker = L.marker([lat,lng], { icon: iconoDe(iconFile, 36) }).addTo(map);

    marker.on('click', ()=> {
      map.setView([lat,lng], 16, { animate:true });
    });

    markers.push(marker);
  });
}

function renderListaDestacados(arr, id){
  const cont = document.getElementById(id);
  if(!cont) return;

  cont.innerHTML = arr.map(it=>{
    const img = it.imagenes?.[0] ? `<img src="data/${it.imagenes[0]}">` : '';
    return `
      <div class="tarjeta destacado">
        ${img}
        <h3>${it.nombre} ⭐</h3>
        <p>${it.descripcion || it.direccion || ''}</p>
      </div>
    `;
  }).join('');
}

// filtros arriba
function generarFiltros(){
  const container = filtersBox();
  container.innerHTML = '';

  const cats = new Set();
  Object.keys(ALL.categorias.servicios || {}).forEach(k=>cats.add(k));
  Object.keys(ALL.categorias.bienes || {}).forEach(k=>cats.add(k));

  const btnAll = document.createElement('button');
  btnAll.className = 'filter-btn active';
  btnAll.textContent = 'Todos';
  btnAll.addEventListener('click', ()=>{
    currentFilter = null;
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btnAll.classList.add('active');
    renderizarTodo();
  });
  container.appendChild(btnAll);

  cats.forEach(cat=>{
    const b = document.createElement('button');
    b.className = 'filter-btn';
    b.textContent = cat;
    b.addEventListener('click', ()=>{
      document.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      currentFilter = cat;
      renderizarTodo();
    });
    container.appendChild(b);
  });
}

// leyenda
function pintarLeyenda(){
  const caja = leyendaItems();
  if(!caja) return;
  caja.innerHTML = '';

  Object.keys(ALL.categorias.bienes || {}).forEach(k => {
    caja.innerHTML += `<div class="leyenda-item"><img src="data/${ALL.categorias.bienes[k].icono}">${k}</div>`;
  });

  Object.keys(ALL.categorias.servicios || {}).forEach(k => {
    caja.innerHTML += `<div class="leyenda-item"><img src="data/${ALL.categorias.servicios[k].icono}">${k}</div>`;
  });
}

function bindControls(){
  searchInput().addEventListener('input', e=>{
    currentSearch = e.target.value;
    renderizarTodo();
  });

  leyendaBar().addEventListener('click', ()=>{
    leyendaDrawer().classList.toggle('open');
  });
}

iniciar();
