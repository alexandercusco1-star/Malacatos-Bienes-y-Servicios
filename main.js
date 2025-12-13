// =======================================================
// MALACATOS - MAIN.JS BASE CORREGIDA (SIN DAÑAR NADA)
// =======================================================

// -------------------------------------------------------
// MAPA
// -------------------------------------------------------
const map = L.map('map').setView([-4.219167, -79.258333], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

// -------------------------------------------------------
// HELPERS
// -------------------------------------------------------
async function cargar(ruta) {
  const r = await fetch(ruta);
  return await r.json();
}

function iconoDe(ruta, size = 28) {
  return L.icon({
    iconUrl: `data/${ruta}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 6]
  });
}

// -------------------------------------------------------
// ESTADO
// -------------------------------------------------------
let ALL = { bienes: [], servicios: [], categorias: {} };
let markers = [];
let currentFilter = null;
let currentSearch = "";

// EDITOR
let editorOn = false;
let tempMarker = null;

// GALERÍA
let currentGallery = [];
let galleryIndex = 0;

// -------------------------------------------------------
// INICIO
// -------------------------------------------------------
async function iniciar() {
  const [bienes, servicios, categorias] = await Promise.all([
    cargar("data/bienes.json"),
    cargar("data/servicios.json"),
    cargar("data/categorias.json")
  ]);

  ALL.bienes = bienes;
  ALL.servicios = servicios;
  ALL.categorias = categorias;

  generarFiltros();
  renderizarTodo();
  pintarLeyenda();
  bindControls();
}

iniciar();

// -------------------------------------------------------
// MAPA
// -------------------------------------------------------
function clearMarkers() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
}

function renderizarTodo() {
  clearMarkers();

  const todos = [...ALL.bienes, ...ALL.servicios];

  const visibles = todos.filter(i => {
    const t = `${i.nombre} ${i.categoria} ${i.descripcion || ""}`.toLowerCase();
    if (currentSearch && !t.includes(currentSearch.toLowerCase())) return false;
    if (currentFilter && i.categoria !== currentFilter) return false;
    return true;
  });

  visibles.forEach(item => {
    if (isNaN(item.latitud) || isNaN(item.longitud)) return;

    const iconFile =
      item.icono ||
      ALL.categorias[item.categoria]?.icono ||
      "icon-default.jpeg";

    const marker = L.marker([item.latitud, item.longitud], {
      icon: iconoDe(iconFile)
    }).addTo(map);

    marker.on("click", () => mostrarDetalle(item));

    markers.push(marker);
  });

  renderDestacados(todos.filter(x => x.destacado));
}

// -------------------------------------------------------
// DESTACADOS
// -------------------------------------------------------
function renderDestacados(arr) {
  const cont = document.getElementById("destacados-contenedor");
  cont.innerHTML = "";

  arr.forEach(it => {
    const img = it.imagenes?.[0] ? `data/${it.imagenes[0]}` : "";
    cont.innerHTML += `
      <div class="tarjeta">
        ${img ? `<img src="${img}">` : ""}
        <h3>${it.nombre} ⭐</h3>
        <button onclick="abrirGaleria('${it.nombre}')">Ver</button>
      </div>
    `;
  });
}

// -------------------------------------------------------
// PANEL DETALLE
// -------------------------------------------------------
function mostrarDetalle(item) {
  const panel = document.getElementById("bottom-panel");
  const cont = document.getElementById("bp-content");

  cont.innerHTML = `
    <h3>${item.nombre}</h3>
    <p>${item.descripcion || ""}</p>
    <p>${item.direccion || ""}</p>
  `;

  panel.classList.add("open");
}

// -------------------------------------------------------
// GALERÍA (FIX TOTAL)
// -------------------------------------------------------
function abrirGaleria(nombre) {
  const item = [...ALL.bienes, ...ALL.servicios].find(x => x.nombre === nombre);
  if (!item || !item.imagenes || !item.imagenes.length) return;

  currentGallery = item.imagenes;
  galleryIndex = 0;

  document.getElementById("lb-img").src = `data/${currentGallery[0]}`;
  document.getElementById("lightbox").classList.add("open");
}

function cambiarImg(dir) {
  galleryIndex += dir;
  if (galleryIndex < 0) galleryIndex = currentGallery.length - 1;
  if (galleryIndex >= currentGallery.length) galleryIndex = 0;
  document.getElementById("lb-img").src = `data/${currentGallery[galleryIndex]}`;
}

function cerrarGaleria() {
  document.getElementById("lightbox").classList.remove("open");
}

// -------------------------------------------------------
// LEYENDA
// -------------------------------------------------------
function pintarLeyenda() {
  const cont = document.getElementById("leyenda-items");
  cont.innerHTML = "";

  Object.entries(ALL.categorias).forEach(([cat, data]) => {
    cont.innerHTML += `
      <div class="leyenda-item">
        <img src="data/${data.icono}">
        ${cat}
      </div>
    `;
  });
}

// -------------------------------------------------------
// FILTROS
// -------------------------------------------------------
function generarFiltros() {
  const box = document.getElementById("filters");
  box.innerHTML = "";

  const btnAll = document.createElement("button");
  btnAll.textContent = "Todos";
  btnAll.onclick = () => {
    currentFilter = null;
    renderizarTodo();
  };
  box.appendChild(btnAll);

  Object.keys(ALL.categorias).forEach(cat => {
    const b = document.createElement("button");
    b.textContent = cat;
    b.onclick = () => {
      currentFilter = cat;
      renderizarTodo();
    };
    box.appendChild(b);
  });
}

// -------------------------------------------------------
// CONTROLES (ARREGLADOS)
// -------------------------------------------------------
function bindControls() {

  // BUSCADOR
  document.getElementById("search-input").addEventListener("input", e => {
    currentSearch = e.target.value;
    renderizarTodo();
  });

  // LEYENDA
  const bar = document.getElementById("leyenda-bar");
  const drawer = document.getElementById("leyenda-drawer");
  if (bar && drawer) {
    bar.onclick = () => drawer.classList.toggle("open");
  }

  // BOTÓN EDITAR (FUNCIONA)
  const btnEdit = document.getElementById("btn-toggle-edit");
  if (btnEdit) {
    btnEdit.onclick = () => {
      editorOn = !editorOn;
      alert(editorOn ? "Modo edición activo: toca el mapa" : "Modo edición desactivado");
    };
  }

  // MAPA CLICK PARA COORDENADAS
  map.on("click", e => {
    if (!editorOn) return;

    if (tempMarker) map.removeLayer(tempMarker);

    tempMarker = L.marker(e.latlng, { draggable: true }).addTo(map);
    alert(`Lat: ${e.latlng.lat}\nLng: ${e.latlng.lng}`);
  });

  // LIGHTBOX CONTROLES
  document.getElementById("lb-prev")?.addEventListener("click", () => cambiarImg(-1));
  document.getElementById("lb-next")?.addEventListener("click", () => cambiarImg(1));
  document.getElementById("lb-close")?.addEventListener("click", cerrarGaleria);

  // RESET DESACTIVADO
  const resetBtn = document.getElementById("btn-reset-server");
  if (resetBtn) {
    resetBtn.disabled = true;
    resetBtn.style.opacity = "0.4";
    resetBtn.style.pointerEvents = "none";
  }
}
