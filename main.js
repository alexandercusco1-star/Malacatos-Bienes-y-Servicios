// =======================================================
// MALACATOS - MAIN.JS BASE DEFINITIVA
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

function iconoDe(ruta, size = 32) {
  return L.icon({
    iconUrl: `data/${ruta}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 6]
  });
}

// -------------------------------------------------------
// ESTADO GLOBAL
// -------------------------------------------------------
let ALL = {
  bienes: [],
  servicios: [],
  categorias: {}
};

let markers = [];
let currentFilter = null;
let currentSearch = "";
let editorOn = false;

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
// VALIDACIÓN (NO ROMPE)
// -------------------------------------------------------
function validarItem(item) {
  if (!ALL.categorias[item.categoria]) {
    console.warn("Categoría no registrada:", item.categoria, item.nombre);
  }

  if (item.icono) {
    fetch(`data/${item.icono}`).catch(() =>
      console.warn("Ícono no encontrado:", item.icono)
    );
  }

  if (Array.isArray(item.imagenes)) {
    item.imagenes.forEach(img => {
      fetch(`data/${img}`).catch(() =>
        console.warn("Imagen no encontrada:", img)
      );
    });
  }
}

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
    const txt = `${i.nombre} ${i.categoria} ${i.descripcion || ""}`.toLowerCase();
    if (currentSearch && !txt.includes(currentSearch.toLowerCase())) return false;
    if (currentFilter && i.categoria !== currentFilter) return false;
    return true;
  });

  visibles.forEach(item => {
    validarItem(item);

    if (isNaN(item.latitud) || isNaN(item.longitud)) return;

    const iconFile =
      item.icono ||
      ALL.categorias[item.categoria]?.icono ||
      "icon-default.jpeg";

    const marker = L.marker([item.latitud, item.longitud], {
      icon: iconoDe(iconFile, 28)
    }).addTo(map);

    marker.on("click", () => {
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
        ${img ? `<img src="${img}">` : `<div class="img-placeholder">Sin imagen</div>`}
        <h3>${it.nombre}</h3>
        <p>${it.descripcion || ""}</p>
        <button onclick="mostrarGaleria('${it.nombre}')">Ver</button>
      </div>
    `;
  });
}

// -------------------------------------------------------
// DETALLE
// -------------------------------------------------------
function mostrarDetalle(item) {
  const panel = document.getElementById("bottom-panel");
  const cont = document.getElementById("bp-content");

  const img = item.imagenes?.[0]
    ? `data/${item.imagenes[0]}`
    : "";

  cont.innerHTML = `
    ${img ? `<img src="${img}" class="bp-img">` : ""}
    <h3>${item.nombre}</h3>
    <p>${item.descripcion || ""}</p>
    <p>${item.direccion || ""}</p>
  `;

  panel.classList.add("open");
}

// -------------------------------------------------------
// GALERÍA
// -------------------------------------------------------
let currentGallery = [];
let galleryIndex = 0;

function mostrarGaleria(nombre) {
  const item = [...ALL.bienes, ...ALL.servicios].find(x => x.nombre === nombre);
  if (!item || !item.imagenes || !item.imagenes.length) {
    alert("Este negocio no tiene imágenes.");
    return;
  }

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

  // ❌ DESACTIVADO DEFINITIVAMENTE
  const resetBtn = document.getElementById("btn-reset-server");
  if (resetBtn) {
    resetBtn.onclick = () => false;
    resetBtn.style.opacity = "0.4";
    resetBtn.style.pointerEvents = "none";
  }
    }
