// =======================================================
// MALACATOS - MAIN.JS BASE ESTABLE DEFINITIVA
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
let editorOn = false;
let markerTemp = null;

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
// RENDER MAPA
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

    // 🔴 CLAVE: recuperar click del marcador
    marker.on("click", (e) => {
      e.originalEvent.stopPropagation();
      mostrarDetalle(item);
    });

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
    const img = it.imagenes?.[0]
      ? `data/${it.imagenes[0]}`
      : "";

    cont.innerHTML += `
      <div class="tarjeta">
        ${img ? `<img src="${img}">` : ""}
        <h3>${it.nombre} ⭐</h3>
        <p>${it.descripcion || ""}</p>
        <button onclick="mostrarGaleria('${it.nombre}')">Ver</button>
      </div>
    `;
  });
}

// -------------------------------------------------------
// DETALLE / PANEL INFERIOR
// -------------------------------------------------------
function mostrarDetalle(item) {
  const panel = document.getElementById("bottom-panel");
  const cont = document.getElementById("bp-content");

  let galeriaHTML = "";
  if (Array.isArray(item.imagenes)) {
    galeriaHTML = item.imagenes
      .map(img => `<img src="data/${img}" class="bp-img">`)
      .join("");
  }

  cont.innerHTML = `
    <h3>${item.nombre}</h3>
    <p>${item.descripcion || ""}</p>
    <p>${item.direccion || ""}</p>
    <div class="bp-galeria">${galeriaHTML}</div>
  `;

  panel.classList.add("open");
}

// -------------------------------------------------------
// GALERÍA (LIGHTBOX)
// -------------------------------------------------------
let currentGallery = [];
let galleryIndex = 0;

function mostrarGaleria(nombre) {
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
// CONTROLES
// -------------------------------------------------------
function bindControls() {
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

  // RESET DESACTIVADO
  const resetBtn = document.getElementById("btn-reset-server");
  if (resetBtn) {
    resetBtn.onclick = () => false;
    resetBtn.style.pointerEvents = "none";
    resetBtn.style.opacity = "0.4";
  }

  // MODO EDICIÓN
  const editBtn = document.getElementById("btn-edit");
  if (editBtn) {
    editBtn.onclick = () => {
      editorOn = !editorOn;
      alert(editorOn ? "Modo edición activado" : "Modo edición desactivado");
    };
  }
}

// -------------------------------------------------------
// CLICK MAPA PARA VER COORDENADAS (EDICIÓN)
// -------------------------------------------------------
map.on("click", e => {
  if (!editorOn) return;

  const { lat, lng } = e.latlng;

  if (markerTemp) map.removeLayer(markerTemp);

  markerTemp = L.marker([lat, lng], { draggable: true }).addTo(map);

  alert(`Latitud: ${lat}\nLongitud: ${lng}`);
});
