// main.js FINAL – FUNCIONANDO 100%
// ---------------------------------------------
// MAPA
// ---------------------------------------------
const map = L.map('map').setView([-4.219167, -79.258333], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

// ---------------------------------------------
// HELPERS Y ESTADO
// ---------------------------------------------
async function cargar(ruta) {
  const r = await fetch(ruta);
  return await r.json();
}

function iconoDe(ruta, size = 18) {  // ← ICONOS A LA MITAD (ANTES 36)
  return L.icon({
    iconUrl: `data/${ruta}`,
    iconSize: [size, size],
    iconAnchor: [Math.round(size / 2), size],
    popupAnchor: [0, -size + 6]
  });
}

let ALL = { bienes: [], servicios: [], categorias: {} };
let markers = [];
let currentFilter = null;
let currentSearch = '';
let currentGallery = [];
let galleryIndex = 0;

// ---------------------------------------------
// UI ELEMENTS
// ---------------------------------------------
const searchInput = () => document.getElementById('search-input');
const filtersBox = () => document.getElementById('filters');
const destacadosCont = () => document.getElementById('destacados-contenedor');
const leyendaDrawer = () => document.getElementById('leyenda-drawer');
const leyendaItems = () => document.getElementById('leyenda-items');
const leyendaBar = () => document.getElementById('leyenda-bar');
const bottomPanel = () => document.getElementById('bottom-panel');
const bpContent = () => document.getElementById('bp-content');
const bpClose = () => document.getElementById('bp-close');

// NO VAMOS A ELIMINAR EL BOTÓN, PERO YA NO HARÁ NADA
const btnResetServer = document.getElementById('btn-reset-server');

// LIGHTBOX
const lightbox = () => document.getElementById('lightbox');
const lbImg = () => document.getElementById('lb-img');
const lbPrev = () => document.getElementById('lb-prev');
const lbNext = () => document.getElementById('lb-next');
const lbClose = () => document.getElementById('lb-close');

// ---------------------------------------------
// INICIO
// ---------------------------------------------
async function iniciar() {
  const [bienes, servicios, categorias] = await Promise.all([
    cargar('data/bienes.json'),
    cargar('data/servicios.json'),
    cargar('data/categorias.json')
  ]);

  ALL.bienes = bienes;
  ALL.servicios = servicios;
  ALL.categorias = categorias;

  generarFiltros();
  bindControls();
  renderizarTodo();
  pintarLeyenda();
}

// ---------------------------------------------
// RENDER
// ---------------------------------------------
function clearMarkers() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
}

function renderizarTodo() {
  clearMarkers();
  const combined = [...ALL.bienes, ...ALL.servicios];

  const visibles = combined.filter(i => {
    const text = (i.nombre + ' ' + i.categoria + ' ' + (i.descripcion || '')).toLowerCase();
    if (currentSearch && !text.includes(currentSearch.toLowerCase())) return false;
    if (currentFilter && i.categoria.toLowerCase() !== currentFilter.toLowerCase()) return false;
    return true;
  });

  const dest = combined.filter(x => x.destacado === true);
  renderDestacados(dest);

  visibles.forEach(item => {
    const lat = parseFloat(item.latitud);
    const lng = parseFloat(item.longitud);
    if (isNaN(lat) || isNaN(lng)) return;

    const iconFile = item.icono || "icon-default.jpeg";
    const size = item.destacado ? 26 : 18; // ← MITAD DEL TAMAÑO ORIGINAL

    const marker = L.marker([lat, lng], {
      icon: iconoDe(iconFile, size)
    }).addTo(map);

    marker.on('click', () => {
      map.setView([lat, lng], 16);
      mostrarBottomPanel(item);
    });

    markers.push(marker);
  });
}

function renderDestacados(arr) {
  destacadosCont().innerHTML = arr.map(it => {
    const img = it.imagenes?.[0] ? `<img src="data/${it.imagenes[0]}" alt="">` : '';
    return `
      <div class="tarjeta">
        ${img}
        <h3>${it.nombre} ⭐</h3>
        <p>${it.descripcion || ''}</p>
        <button class="ver-btn" data-n="${it.nombre}">Ver</button>
      </div>
    `;
  }).join('');

  destacadosCont().querySelectorAll('.ver-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const nombre = e.currentTarget.dataset.n;
      const target = [...ALL.bienes, ...ALL.servicios].find(x => x.nombre === nombre);
      if (target) mostrarGaleria(target);
    });
  });
}

// ---------------------------------------------
// BOTTOM PANEL
// ---------------------------------------------
function mostrarBottomPanel(item) {
  const img = item.imagenes?.[0] ? `data/${item.imagenes[0]}` : '';
  const bannerHtml = item.banner ? `<img src="data/${item.banner}" class="bp-img">` : '';

  bpContent().innerHTML = `
    <div class="bp-top">
      ${img ? `<img src="${img}" class="bp-img">` : ''}
      <div>
        <h3>${item.nombre}</h3>
        <p>${item.descripcion || item.direccion || ''}</p>
        <p>📍 ${item.ubicacion || item.direccion || ''}</p>
      </div>
    </div>
    ${bannerHtml}
  `;

  bottomPanel().classList.add('open');
}

// ---------------------------------------------
// FILTROS
// ---------------------------------------------
function generarFiltros() {
  const container = filtersBox();
  container.innerHTML = '';

  const cats = Object.keys(ALL.categorias || {});

  const btnAll = document.createElement('button');
  btnAll.className = 'filter-btn active';
  btnAll.innerText = "Todos";
  btnAll.onclick = () => { currentFilter = null; activar(btnAll); renderizarTodo(); };
  container.appendChild(btnAll);

  cats.forEach(cat => {
    const b = document.createElement('button');
    b.className = 'filter-btn';
    b.innerText = cat;
    b.onclick = () => { currentFilter = cat; activar(b); renderizarTodo(); };
    container.appendChild(b);
  });
}

function activar(btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ---------------------------------------------
// CONTROLES
// ---------------------------------------------
function bindControls() {
  searchInput().addEventListener('input', e => {
    currentSearch = e.target.value.trim();
    renderizarTodo();
  });

  leyendaBar().onclick = () => leyendaDrawer().classList.toggle("open");
  bpClose().onclick = () => bottomPanel().classList.remove('open');

  // ⚠️ Botón Restablecer → YA NO FUNCIONA
  if (btnResetServer) {
    btnResetServer.onclick = () => {
      alert("Este botón está desactivado.");
    };
  }
}

// ---------------------------------------------
// LEYENDA
// ---------------------------------------------
function pintarLeyenda() {
  const caja = leyendaItems();
  caja.innerHTML = '';

  const cats = Object.keys(ALL.categorias || {});

  cats.forEach(cat => {
    const icon = ALL.categorias[cat]?.icono || '';
    caja.innerHTML += `
      <div class="leyenda-item">
        <img src="data/${icon}">
        ${cat}
      </div>
    `;
  });
}

// ---------------------------------------------
// GALERIA (lightbox)
// ---------------------------------------------
function mostrarGaleria(item) {
  currentGallery = item.imagenes || [];
  if (currentGallery.length === 0) return;

  galleryIndex = 0;
  lbImg().src = 'data/' + currentGallery[0];
  lightbox().classList.add("open");
}

lbClose().onclick = () => lightbox().classList.remove("open");
lbPrev().onclick = () => cambiarImg(-1);
lbNext().onclick = () => cambiarImg(1);

function cambiarImg(dir) {
  galleryIndex += dir;
  if (galleryIndex < 0) galleryIndex = currentGallery.length - 1;
  if (galleryIndex >= currentGallery.length) galleryIndex = 0;
  lbImg().src = 'data/' + currentGallery[galleryIndex];
}

// ---------------------------------------------
// START
// ---------------------------------------------
iniciar();
