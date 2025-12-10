// main.js — versión estable basada en tu base original + destacados

// MAPA
const map = L.map('map').setView([-4.219167, -79.258333], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

// HELPERS
async function cargar(ruta) {
  const r = await fetch(ruta);
  return await r.json();
}

function iconoDe(ruta, size = 36) {
  return L.icon({
    iconUrl: `data/${ruta}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 6]
  });
}

// GLOBAL
let ALL = { bienes: [], servicios: [], categorias: {} };
let markers = [];
let currentFilter = null;
let currentSearch = "";

// UI
const searchInput = () => document.getElementById("search-input");
const filtersBox = () => document.getElementById("filters");
const listaLugares = () => document.getElementById("lista-lugares");
const listaServicios = () => document.getElementById("lista-servicios");
const leyendaBar = () => document.getElementById("leyenda-bar");
const leyendaDrawer = () => document.getElementById("leyenda-drawer");
const leyendaItems = () => document.getElementById("leyenda-items");
const bottomPanel = () => document.getElementById("bottom-panel");
const bpContent = () => document.getElementById("bp-content");
const bpClose = () => document.getElementById("bp-close");

// INICIO
async function iniciar() {
  [ALL.bienes, ALL.servicios, ALL.categorias] = await Promise.all([
    cargar("data/bienes.json"),
    cargar("data/servicios.json"),
    cargar("data/categorias.json")
  ]);

  generarFiltros();
  bindControls();
  renderizarTodo();
  pintarLeyenda();
}

// LIMPIAR MARKERS
function clearMarkers() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
}

// RENDER GENERAL
function renderizarTodo() {
  clearMarkers();

  const combined = [...ALL.bienes, ...ALL.servicios];

  const visibles = combined.filter(item => {
    const texto = (
      item.nombre +
      " " +
      (item.categoria || "") +
      " " +
      (item.descripcion || "")
    ).toLowerCase();

    if (currentSearch && !texto.includes(currentSearch.toLowerCase()))
      return false;

    if (currentFilter && item.categoria !== currentFilter)
      return false;

    return true;
  });

  // LISTAS
  renderLista(ALL.bienes, "lista-lugares");
  renderLista(ALL.servicios, "lista-servicios");

  // MARKERS
  visibles.forEach(item => {
    const lat = parseFloat(item.latitud);
    const lng = parseFloat(item.longitud);
    if (isNaN(lat) || isNaN(lng)) return;

    const iconFile =
      item.icono ||
      (ALL.categorias[item.tipo] &&
        ALL.categorias[item.tipo][item.categoria] &&
        ALL.categorias[item.tipo][item.categoria].icono);

    const marker = L.marker([lat, lng], { icon: iconoDe(iconFile) }).addTo(map);

    marker.on("click", () => abrirBottomPanel(item));
    markers.push(marker);
  });

  // AUTO CENTRO DESTACADO
  const firstDest = combined.find(i => i.destacado);
  if (firstDest) {
    map.setView(
      [parseFloat(firstDest.latitud), parseFloat(firstDest.longitud)],
      16
    );
  }
}

// RENDER LISTAS
function renderLista(arr, id) {
  const cont = document.getElementById(id);
  cont.innerHTML = arr
    .map(item => {
      const img = item.imagenes?.[0]
        ? `<img src="data/${item.imagenes[0]}" alt="${item.nombre}">`
        : "";

      return `
        <div class="tarjeta">
          ${img}
          <h3>${item.nombre}</h3>
          <div class="desc">${item.descripcion || item.direccion || ""}</div>
          <button class="ver-btn" data-n="${item.nombre}">Ver</button>
        </div>
      `;
    })
    .join("");

  cont.querySelectorAll(".ver-btn").forEach(b =>
    b.addEventListener("click", e => {
      const nombre = e.target.dataset.n;
      const item = [...ALL.bienes, ...ALL.servicios].find(
        x => x.nombre === nombre
      );
      abrirBottomPanel(item);
    })
  );
}

// BOTTOM PANEL
function abrirBottomPanel(item) {
  const img = item.imagenes?.[0]
    ? `<img src="data/${item.imagenes[0]}" class="bp-img">`
    : "";

  bpContent().innerHTML = `
    ${img}
    <h2>${item.nombre}</h2>
    <p>${item.descripcion || item.direccion || ""}</p>
  `;

  bottomPanel().classList.add("open");
}

bpClose().onclick = () => {
  bottomPanel().classList.remove("open");
};

// FILTROS
function generarFiltros() {
  const c = filtersBox();
  c.innerHTML = "";

  // Botón todos
  const btn = document.createElement("button");
  btn.className = "filter-btn active";
  btn.textContent = "Todos";
  btn.onclick = () => {
    currentFilter = null;
    document
      .querySelectorAll(".filter-btn")
      .forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    renderizarTodo();
  };
  c.appendChild(btn);

  // Todas tus subcategorías exactas
  const cats = [
    ...Object.keys(ALL.categorias.bienes),
    ...Object.keys(ALL.categorias.servicios)
  ];

  cats.forEach(cat => {
    const b = document.createElement("button");
    b.className = "filter-btn";
    b.textContent = cat;

    b.onclick = () => {
      currentFilter = cat;
      document
        .querySelectorAll(".filter-btn")
        .forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      renderizarTodo();
    };

    c.appendChild(b);
  });
}

// LEYENDA
function pintarLeyenda() {
  const caja = leyendaItems();
  caja.innerHTML = "";

  Object.entries(ALL.categorias.bienes).forEach(([cat, val]) => {
    caja.innerHTML += `
      <div class="leyenda-item">
        <img src="data/${val.icono}">
        <span>${cat}</span>
      </div>`;
  });

  Object.entries(ALL.categorias.servicios).forEach(([cat, val]) => {
    caja.innerHTML += `
      <div class="leyenda-item">
        <img src="data/${val.icono}">
        <span>${cat}</span>
      </div>`;
  });
}

leyendaBar().onclick = () => {
  leyendaDrawer().classList.toggle("open");
};

// BUSCADOR
searchInput().addEventListener("input", e => {
  currentSearch = e.target.value.trim();
  renderizarTodo();
});

// START
iniciar();
