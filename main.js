// main.js - mapa, carga data, buscador, filtros, bottom-panel (popup), galería de imágenes
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
const listaLugares = () => document.getElementById('lista-lugares');
const listaServicios = () => document.getElementById('lista-servicios');
const bannerArea = () => document.getElementById('banner-area');
const leyendaDrawer = () => document.getElementById('leyenda-drawer');
const leyendaItems = () => document.getElementById('leyenda-items');
const leyendaBar = () => document.getElementById('leyenda-bar');
const bottomPanel = () => document.getElementById('bottom-panel');
const bpContent = () => document.getElementById('bp-content');
const bpClose = () => document.getElementById('bp-close');

// NUEVO: Referencias del Lightbox
const lightbox = () => document.getElementById('lightbox');
const lbImg = () => document.getElementById('lb-img');
const lbClose = () => document.getElementById('lb-close');
const lbPrev = () => document.getElementById('lb-prev');
const lbNext = () => document.getElementById('lb-next');

let lbFotos = [];
let lbIndex = 0;

async function iniciar(){
  [ALL.bienes, ALL.servicios, ALL.categorias] = await Promise.all([
    cargar('data/bienes.json'),
    cargar('data/servicios.json'),
    cargar('data/categorias.json')
  ]);

  generarFiltros();
  bindControls();
  renderizarTodo();
  pintarLeyenda();
}

// Clear markers
function clearMarkers(){
  markers.forEach(m=>map.removeLayer(m));
  markers = [];
}

// Render all
function renderizarTodo(){
  clearMarkers();

  const combined = [...ALL.bienes, ...ALL.servicios];
  const visibles = combined.filter(i=>{
    const text = (i.nombre + ' ' + (i.categoria||'') + ' ' + (i.descripcion||'')).toLowerCase();
    if(currentSearch && !text.includes(currentSearch.toLowerCase())) return false;
    if(currentFilter && i.categoria !== currentFilter) return false;
    return true;
  });

  renderLista(ALL.bienes, 'lista-lugares');
  renderLista(ALL.servicios, 'lista-servicios');

  visibles.forEach(item=>{
    const lat = parseFloat(item.latitud);
    const lng = parseFloat(item.longitud);
    if(Number.isNaN(lat) || Number.isNaN(lng)) return;

    let iconFile = item.icono || (ALL.categorias[item.tipo] && ALL.categorias[item.tipo][item.categoria] && ALL.categorias[item.tipo][item.categoria].icono) || 'icon-default.jpeg';
    const size = item.destacado ? 52 : 36;
    const marker = L.marker([lat,lng], { icon: iconoDe(iconFile, size) }).addTo(map);

    marker.on('click', ()=> {
      map.setView([lat,lng], item.destacado ? 16 : 15, { animate:true });
      mostrarBottomPanel(item);
    });

    markers.push(marker);
  });

  const firstDest = visibles.find(v=>v.destacado);
  if(firstDest){
    map.setView([parseFloat(firstDest.latitud), parseFloat(firstDest.longitud)], 16);
  }
}

function renderLista(arr, id){
  const cont = document.getElementById(id);
  if(!cont) return;
  cont.innerHTML = arr.map(it=>{
    const destacadoClass = it.destacado ? 'destacado' : '';
    const img = it.imagenes?.[0] ? `<img src="data/${it.imagenes[0]}" alt="${it.nombre}">` : '';
    return `
      <div class="tarjeta ${destacadoClass}">
        ${img}
        <h3>${it.nombre}${it.destacado ? ' ⭐' : ''}</h3>
        <p>${it.descripcion || it.direccion || ''}</p>
        <button class="ver-btn" data-n="${it.nombre}">Ver</button>
      </div>
    `;
  }).join('');

  cont.querySelectorAll('.ver-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const nombre = e.currentTarget.dataset.n;
      const target = [...ALL.bienes, ...ALL.servicios].find(x => x.nombre === nombre);
      if(!target) return;
      map.setView([parseFloat(target.latitud), parseFloat(target.longitud)], 16);
      mostrarGaleria(target);  // ← AHORA "Ver" abre la GALERÍA
    });
  });
}

// -----------------------------
// NUEVO: GALERÍA LIGHTBOX
// -----------------------------
function mostrarGaleria(item){
  lbFotos = item.imagenes?.map(i => `data/${i}`) || [];
  lbIndex = 0;

  if(lbFotos.length === 0) return;

  lbImg().src = lbFotos[lbIndex];
  lightbox().classList.add("open");
}

function cambiarFoto(dir){
  lbIndex += dir;
  if(lbIndex < 0) lbIndex = lbFotos.length - 1;
  if(lbIndex >= lbFotos.length) lbIndex = 0;
  lbImg().src = lbFotos[lbIndex];
}

// close lightbox
lbClose()?.addEventListener("click", ()=>{
  lightbox().classList.remove("open");
});

// botones prev/next
lbPrev()?.addEventListener("click", ()=> cambiarFoto(-1));
lbNext()?.addEventListener("click", ()=> cambiarFoto(1));

// ----------------------------------
// Bottom panel (solo para info)
// ----------------------------------
function mostrarBottomPanel(item){
  const img = item.imagenes?.[0] ? `data/${item.imagenes[0]}` : '';
  const telBtn = item.telefono ? `<a class="btn" href="https://wa.me/${item.telefono.replace('+','')}" target="_blank">WhatsApp</a>` : '';
  const bannerHtml = item.banner ? `<img src="data/${item.banner}" class="bp-banner">` : '';

  bpContent().innerHTML = `
    <div class="bp-top">
      ${img ? `<img src="${img}" class="bp-img">` : ''}
      <div class="bp-info">
        <h3>${item.nombre}</h3>
        <p>${item.descripcion || item.direccion || ''}</p>
        <p>📍 ${item.ubicacion || item.direccion || ''}</p>
        <div class="bp-actions">
          ${telBtn}
          <button class="btn" id="bp-dir-btn">Cómo llegar</button>
        </div>
      </div>
    </div>
    ${bannerHtml || ''}
  `;

  bottomPanel().classList.add('open');
}

// close bottom panel
bpClose()?.addEventListener('click', ()=>{
  bottomPanel().classList.remove('open');
});

// Filtros + buscador + leyenda
function generarFiltros(){
  const container = filtersBox();
  container.innerHTML = '';

  const cats = new Set();
  Object.keys(ALL.categorias.servicios || {}).forEach(k=>cats.add(k));
  Object.keys(ALL.categorias.bienes || {}).forEach(k=>cats.add(k));

  const btnAll = document.createElement('button');
  btnAll.className = 'filter-btn active';
  btnAll.textContent = 'Todos';
  btnAll.addEventListener('click', ()=>{ currentFilter = null; activar(btnAll); renderizarTodo(); });
  container.appendChild(btnAll);

  cats.forEach(cat=>{
    const b = document.createElement('button');
    b.className = 'filter-btn';
    b.textContent = cat;
    b.addEventListener('click', ()=> {
      currentFilter = cat;
      activar(b);
      renderizarTodo();
    });
    container.appendChild(b);
  });
}

function activar(btn){
  document.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');
}

function bindControls(){
  searchInput().addEventListener('input', (e)=>{
    currentSearch = e.target.value.trim();
    renderizarTodo();
  });

  leyendaBar().addEventListener('click', ()=>{
    leyendaDrawer().classList.toggle("open");
  });
}

function pintarLeyenda(){
  const caja = leyendaItems();
  caja.innerHTML = '';
  Object.keys(ALL.categorias.bienes || {}).forEach(k=>{
    caja.innerHTML += `<div class="leyenda-item"><img src="data/${ALL.categorias.bienes[k].icono}"> ${k}</div>`;
  });
  Object.keys(ALL.categorias.servicios || {}).forEach(k=>{
    caja.innerHTML += `<div class="leyenda-item"><img src="data/${ALL.categorias.servicios[k].icono}"> ${k}</div>`;
  });
}

// Start
iniciar();
