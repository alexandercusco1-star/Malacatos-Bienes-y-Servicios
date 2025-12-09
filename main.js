// ============================
// MAPA - OPENSTREETMAP
// ============================
const map = L.map("map").setView([-4.219167, -79.258333], 15);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19
}).addTo(map);

// ============================
// FUNCIONES BASE
// ============================
async function cargar(ruta) {
  const r = await fetch(ruta);
  return await r.json();
}

function iconoDe(ruta, size = 36) {
  return L.icon({
    iconUrl: `data/${ruta}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
}

// VARIABLES GLOBALES
let ALL = { bienes: [], servicios: [], categorias: {} };
let markers = [];
let currentFilter = null;
let currentSearch = "";

// REFERENCIAS UI
const listaLugares = () => document.getElementById("lista-lugares");
const listaServicios = () => document.getElementById("lista-servicios");
const searchInput = () => document.getElementById("search-input");
const filtersBox = () => document.getElementById("filters");
const bottomPanel = () => document.getElementById("bottom-panel");
const bpContent = () => document.getElementById("bp-content");
const bpClose = () => document.getElementById("bp-close");
const leyendaDrawer = () => document.getElementById("leyenda-drawer");
const leyendaBar = () => document.getElementById("leyenda-bar");
const leyendaItems = () => document.getElementById("leyenda-items");
const bannerArea = () => document.getElementById("banner-area");

// ============================
// INICIO
// ============================
async function iniciar() {
  [ALL.bienes, ALL.servicios, ALL.categorias] = await Promise.all([
    cargar("data/bienes.json"),
    cargar("data/servicios.json"),
    cargar("data/categorias.json")
  ]);

  generarFiltros();
  bindControls();
  pintarLeyenda();
  renderizarTodo();
}

// ============================
// LIMPIAR MARCADORES
// ============================
function clearMarkers() {
  markers.forEach((m) => map.removeLayer(m));
  markers = [];
}

// ============================
// RENDERIZAR TODO
// ============================
function renderizarTodo() {
  clearMarkers();

  const all = [...ALL.bienes, ...ALL.servicios];

  const visibles = all.filter((item) => {
    const text = (
      item.nombre +
      " " +
      (item.categoria || "") +
      " " +
      (item.descripcion || "") +
      " " +
      (item.direccion || "")
    ).toLowerCase();

    if (currentSearch && !text.includes(currentSearch)) return false;
    if (currentFilter && item.categoria !== currentFilter) return false;

    return true;
  });

  renderLista(ALL.bienes, "lista-lugares");
  renderLista(ALL.servicios, "lista-servicios");

  visibles.forEach((item) => {
    const lat = parseFloat(item.latitud);
    const lng = parseFloat(item.longitud);
    if (isNaN(lat) || isNaN(lng)) return;

    const iconFile =
      item.icono ||
      ALL.categorias[item.tipo]?.[item.categoria]?.icono ||
      "icon-default.jpeg";

    const size = item.destacado ? 52 : 36;

    const marker = L.marker([lat, lng], {
      icon: iconoDe(iconFile, size)
    }).addTo(map);

    marker.on("click", () => {
      map.setView([lat, lng], 16);
      mostrarBottomPanel(item);
    });

    markers.push(marker);
  });
}

// ============================
// LISTADO "VER"
// ============================
function renderLista(arr, id) {
  const cont = document.getElementById(id);
  if (!cont) return;

  cont.innerHTML = arr
    .map((it) => {
      const img = it.imagenes?.[0]
        ? `<img src="data/${it.imagenes[0]}" alt="${it.nombre}">`
        : "";

      return `
    <div class="tarjeta">
      ${img}
      <h3>${it.nombre}</h3>
      <button class="ver-btn" data-id="${it.nombre}">Ver</button>
    </div>`;
    })
    .join("");

  cont.querySelectorAll(".ver-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nombre = btn.dataset.id;
      const item = [...ALL.bienes, ...ALL.servicios].find(
        (x) => x.nombre === nombre
      );
      mostrarBottomPanel(item);
    });
  });
}

// ============================
// PANEL DE ABAJO
// ============================
function mostrarBottomPanel(item) {
  const imgs = item.imagenes
    .map(
      (img) =>
        `<img src="data/${img}" style="width:100%;border-radius:8px;margin-bottom:6px">`
    )
    .join("");

  const tel = item.telefono
    ? `<a class="btn" href="https://wa.me/${item.telefono.replace("+", "")}" target="_blank">WhatsApp</a>`
    : "";

  bpContent().innerHTML = `
    <button id="bp-close">✖</button>
    <h2 style="color:#2b7a78">${item.nombre}</h2>
    <p>${item.descripcion || item.direccion || ""}</p>
    ${tel}
    <div style="margin-top:12px">${imgs}</div>
  `;

  document.getElementById("bp-close").onclick = ocultarBottomPanel;

  bottomPanel().classList.add("open");
}

function ocultarBottomPanel() {
  bottomPanel().classList.remove("open");
}

// ============================
// BUSCADOR
// ============================
function bindControls() {
  searchInput().addEventListener("input", (e) => {
    currentSearch = e.target.value.trim().toLowerCase();
    renderizarTodo();
  });

  leyendaBar().onclick = () => leyendaDrawer().classList.toggle("open");

  document.addEventListener("click", (e) => {
    if (!bottomPanel().contains(e.target) && !e.target.classList.contains("ver-btn")) {
      ocultarBottomPanel();
    }
  });
}

// ============================
// FILTROS
// ============================
function generarFiltros() {
  const cont = filtersBox();
  cont.innerHTML = "";

  const categorias = new Set([
    ...Object.keys(ALL.categorias.bienes || {}),
    ...Object.keys(ALL.categorias.servicios || {})
  ]);

  const allBtn = document.createElement("button");
  allBtn.textContent = "Todos";
  allBtn.className = "filter-btn active";
  allBtn.onclick = () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    allBtn.classList.add("active");
    currentFilter = null;
    renderizarTodo();
  };
  cont.appendChild(allBtn);

  categorias.forEach((cat) => {
    const b = document.createElement("button");
    b.textContent = cat;
    b.className = "filter-btn";
    b.onclick = () => {
      document.querySelectorAll(".filter-btn").forEach((x) =>
        x.classList.remove("active")
      );
      b.classList.add("active");
      currentFilter = cat;
      renderizarTodo();
    };
    cont.appendChild(b);
  });
}

// ============================
// LEYENDA
// ============================
function pintarLeyenda() {
  leyendaItems().innerHTML = "";

  Object.keys(ALL.categorias.bienes || {}).forEach((k) => {
    leyendaItems().innerHTML += `
      <div class="leyenda-item">
        <img src="data/${ALL.categorias.bienes[k].icono}">
        ${k}
      </div>`;
  });

  Object.keys(ALL.categorias.servicios || {}).forEach((k) => {
    leyendaItems().innerHTML += `
      <div class="leyenda-item">
        <img src="data/${ALL.categorias.servicios[k].icono}">
        ${k}
      </div>`;
  });
}

// ============================
iniciar();
