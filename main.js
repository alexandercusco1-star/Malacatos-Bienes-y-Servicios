// main.js - versión base estable + destacados + ver todos

const map = L.map('map').setView([-4.219167, -79.258333], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ maxZoom: 19 }).addTo(map);

// helpers
async function cargar(ruta){ const r = await fetch(ruta); return await r.json(); }
function iconoDe(ruta, size=36){
  return L.icon({
    iconUrl:`data/${ruta}`,
    iconSize:[size,size],
    iconAnchor:[Math.round(size/2), size],
    popupAnchor:[0, -size + 6]
  });
}

let ALL = { bienes: [], servicios: [], categorias: {} };
let markers = [];
let currentSearch = '';
let currentFilter = null;

// UI refs
const searchInput = () => document.getElementById('search-input');
const filtersBox = () => document.getElementById('filters');
const leyendaBar = () => document.getElementById('Leyenda-bar');
const leyendaDrawer = () => document.getElementById('leyenda-drawer');
const leyendaItems = () => document.getElementById('leyenda-items');
const bannerArea = () => document.getElementById('banner-area');
const bottomPanel = () => document.getElementById('bottom-panel');
const bpContent = () => document.getElementById('bp-content');
const bpClose = () => document.getElementById('bp-close');
const listaDest = () => document.getElementById('lista-destacados');

async function iniciar(){
  [ALL.bienes, ALL.servicios, ALL.categorias] = await Promise.all([
    cargar('data/bienes.json'),
    cargar('data/servicios.json'),
    cargar('data/categorias.json')
  ]);

  generarFiltros();
  bindControls();
  renderizarMapa();
  renderizarDestacados();
  pintarLeyenda();
}

// limpia marcadores
function clearMarkers(){
  markers.forEach(m=>map.removeLayer(m));
  markers = [];
}

// renderizar mapa según búsqueda y filtro
function renderizarMapa(){
  clearMarkers();

  const combined = [...ALL.bienes, ...ALL.servicios];

  const visibles = combined.filter(i=>{
    const text = (i.nombre + ' ' + (i.categoria||'') + ' ' + (i.descripcion||'')).toLowerCase();
    if(currentSearch && !text.includes(currentSearch.toLowerCase())) return false;

    if(currentFilter && i.categoria !== currentFilter) return false;

    return true;
  });

  visibles.forEach(item=>{
    const lat = parseFloat(item.latitud);
    const lng = parseFloat(item.longitud);
    if(Number.isNaN(lat) || Number.isNaN(lng)) return;

    let iconFile =
      item.icono ||
      (ALL.categorias[item.tipo] &&
       ALL.categorias[item.tipo][item.categoria] &&
       ALL.categorias[item.tipo][item.categoria].icono) ||
      'icon-default.jpeg';

    const size = item.destacado ? 52 : 36;
    const marker = L.marker([lat,lng], { icon: iconoDe(iconFile,size) }).addTo(map);

    marker.on('click', ()=>{
      map.setView([lat,lng], 16, { animate:true });
      mostrarBottomPanel(item);
    });

    markers.push(marker);
  });
}

// DESTACADOS ABAJO
function renderizarDestacados(){
  const cont = listaDest();
  cont.innerHTML = '';

  const combined = [...ALL.bienes, ...ALL.servicios];
  const destacados = combined.filter(i=>i.destacado);

  cont.innerHTML = destacados.map(it=>{
    const img = it.imagenes?.[0] ? `data/${it.imagenes[0]}` : '';
    return `
      <div class="tarjeta" data-n="${it.nombre}">
        ${img ? `<img src="${img}">` : ''}
        <h3>${it.nombre} ⭐</h3>
        <p>${it.descripcion || it.direccion || ''}</p>
        <button class="ver-btn" data-nombre="${it.nombre}">Ver</button>
      </div>
    `;
  }).join('');

  cont.querySelectorAll('.ver-btn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const nombre = e.currentTarget.dataset.nombre;
      const item = combined.find(x=>x.nombre === nombre);
      if(!item) return;
      map.setView([item.latitud, item.longitud], 16);
      mostrarBottomPanel(item);
    });
  });

  // botón ver todos
  document.getElementById('btn-ver-todos').addEventListener('click', ()=>{
    window.open('ver-todos.html','_blank');
  });
}

// BOTTOM PANEL
function mostrarBottomPanel(item){
  const img = item.imagenes?.[0] ? `data/${item.imagenes[0]}` : '';
  const telBtn = item.telefono ? `<a class="btn" href="https://wa.me/${item.telefono.replace('+','')}" target="_blank">WhatsApp</a>` : '';
  const banner = item.banner ? `<img src="data/${item.banner}" style="width:100%;border-radius:8px;margin-top:10px;">` : '';

  bpContent().innerHTML = `
    <h2>${item.nombre} ${item.destacado?'⭐':''}</h2>
    ${img ? `<img src="${img}" style="width:100%;border-radius:8px;">` : ''}
    <p style="color:#666">${item.descripcion || item.direccion || ''}</p>
    <p>📍 ${item.ubicacion || item.direccion || ''}</p>
    <div>${telBtn}</div>
    ${banner}
  `;

  bottomPanel().classList.add('open');
}

// cerrar panel
bpClose().addEventListener('click', ()=>{
  bottomPanel().classList.remove('open');
});

document.addEventListener('click', e=>{
  const bp = bottomPanel();
  if(!bp.contains(e.target) && !e.target.classList.contains('ver-btn')){
    bp.classList.remove('open');
  }
});

// FILTROS
function generarFiltros(){
  const cont = filtersBox();
  cont.innerHTML = '';

  const cats = new Set();
  Object.keys(ALL.categorias.bienes || {}).forEach(k=>cats.add(k));
  Object.keys(ALL.categorias.servicios || {}).forEach(k=>cats.add(k));

  const btnAll = document.createElement('button');
  btnAll.textContent = 'Todos';
  btnAll.className = 'filter-btn active';
  btnAll.addEventListener('click', ()=>{
    currentFilter = null;
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btnAll.classList.add('active');
    renderizarMapa();
  });
  cont.appendChild(btnAll);

  cats.forEach(cat=>{
    const b = document.createElement('button');
    b.textContent = cat;
    b.className = 'filter-btn';
    b.addEventListener('click', ()=>{
      currentFilter = cat;
      document.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      renderizarMapa();
    });
    cont.appendChild(b);
  });
}

// BUSCADOR
searchInput().addEventListener('input', e=>{
  currentSearch = e.target.value.trim();
  renderizarMapa();
});

// LEYENDA
function pintarLeyenda(){
  const caja = leyendaItems();
  caja.innerHTML = '';

  Object.keys(ALL.categorias.bienes || {}).forEach(k=>{
    caja.innerHTML += `
      <div class="leyenda-item">
        <img src="data/${ALL.categorias.bienes[k].icono}">
        ${k}
      </div>`;
  });

  Object.keys(ALL.categorias.servicios || {}).forEach(k=>{
    caja.innerHTML += `
      <div class="leyenda-item">
        <img src="data/${ALL.categorias.servicios[k].icono}">
        ${k}
      </div>`;
  });
}

// toggle leyenda
document.getElementById('leyenda-bar').addEventListener('click', ()=>{
  document.getElementById('leyenda-drawer').classList.toggle('open');
});

// iniciar
iniciar();
