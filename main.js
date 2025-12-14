// MAPA
const map = L.map("map").setView([-4.219167, -79.258333], 15);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19
}).addTo(map);

// HELPERS
async function cargar(ruta) {
  const r = await fetch(ruta);
  return await r.json();
}

function iconoDe(ruta, size = 28) {
  return L.icon({
    iconUrl: "data/" + ruta,
    iconSize: [size, size],
    iconAnchor: [size / 2, size]
  });
}

// ESTADO
let ALL = { bienes: [], servicios: [], categorias: {} };
let markers = [];
let currentFilter = null;
let currentSearch = "";

// INICIO
async function iniciar() {
  const [b, s, c] = await Promise.all([
    cargar("data/bienes.json"),
    cargar("data/servicios.json"),
    cargar("data/categorias.json")
  ]);

  ALL.bienes = b;
  ALL.servicios = s;
  ALL.categorias = c;

  generarFiltros();
  pintarLeyenda();
  bindControls();
  renderizarTodo();
}

iniciar();

// RENDER MAPA
function clearMarkers() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
}

function renderizarTodo() {
  clearMarkers();

  const todos = [...ALL.bienes, ...ALL.servicios];

  todos
    .filter(i => {
      const t = `${i.nombre} ${i.categoria} ${i.descripcion || ""}`.toLowerCase();
      if (currentSearch && !t.includes(currentSearch)) return false;
      if (currentFilter && i.categoria !== currentFilter) return false;
      return true;
    })
    .forEach(item => {
      if (isNaN(item.latitud) || isNaN(item.longitud)) return;

      const icono =
        item.icono ||
        ALL.categorias[item.categoria]?.icono ||
        "icon-default.jpeg";

      const marker = L.marker(
        [item.latitud, item.longitud],
        { icon: iconoDe(icono) }
      ).addTo(map);

      marker.on("click", () => mostrarDetalle(item));
      markers.push(marker);
    });

  renderDestacados(todos.filter(x => x.destacado));
}

// DESTACADOS
function renderDestacados(arr) {
  const cont = document.getElementById("destacados-contenedor");
  cont.innerHTML = "";

  arr.forEach(it => {
    const img = it.imagenes?.[0]
      ? `<img src="data/${it.imagenes[0]}">`
      : "";

    cont.innerHTML += `
      <div class="tarjeta">
        ${img}
        <h3>${it.nombre}</h3>
        <button onclick="mostrarGaleria('${it.nombre}')">ver</button>
      </div>
    `;
  });
}

// DETALLE
function mostrarDetalle(item) {
  const panel = document.getElementById("bottom-panel");
  const cont = document.getElementById("bp-content");

  cont.innerHTML = `
    <h3>${item.nombre}</h3>
    <p>${item.descripcion || ""}</p>
    ${(item.imagenes || [])
      .map(i => `<img class="bp-img" src="data/${i}">`)
      .join("")}
  `;

  panel.classList.add("open");
}

// GALERÍA
let currentGallery = [];
let galleryIndex = 0;

function mostrarGaleria(nombre) {
  const item = [...ALL.bienes, ...ALL.servicios].find(x => x.nombre === nombre);
  if (!item || !item.imagenes?.length) return;

  currentGallery = item.imagenes;
  galleryIndex = 0;

  document.getElementById("lb-img").src = "data/" + currentGallery[0];
  document.getElementById("lightbox").classList.add("open");
}

document.getElementById("lb-prev").onclick = () => cambiarImg(-1);
document.getElementById("lb-next").onclick = () => cambiarImg(1);
document.getElementById("lb-close").onclick = () =>
  document.getElementById("lightbox").classList.remove("open");

function cambiarImg(dir) {
  galleryIndex += dir;
  if (galleryIndex < 0) galleryIndex = currentGallery.length - 1;
  if (galleryIndex >= currentGallery.length) galleryIndex = 0;
  document.getElementById("lb-img").src =
    "data/" + currentGallery[galleryIndex];
}

// LEYENDA
function pintarLeyenda() {
  const cont = document.getElementById("leyenda-items");
  cont.innerHTML = "";

  Object.entries(ALL.categorias).forEach(([k, v]) => {
    cont.innerHTML += `
      <div class="leyenda-item">
        <img src="data/${v.icono}">
        ${k}
      </div>
    `;
  });
}

// FILTROS
function generarFiltros() {
  const box = document.getElementById("filters");
  box.innerHTML = "";

  const all = document.createElement("button");
  all.textContent = "todos";
  all.onclick = () => {
    currentFilter = null;
    renderizarTodo();
  };
  box.appendChild(all);

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

// CONTROLES
function bindControls() {
  document.getElementById("search-input").oninput = e => {
    currentSearch = e.target.value.toLowerCase();
    renderizarTodo();
  };

  document.getElementById("bp-close").onclick = () =>
    document.getElementById("bottom-panel").classList.remove("open");

  document.getElementById("leyenda-bar").onclick = () =>
    document.getElementById("leyenda-drawer").classList.toggle("open");

  // DESACTIVAR RESET
  const reset = document.getElementById("btn-reset-server");
  reset.style.pointerEvents = "none";
  reset.style.opacity = "0.4";
}
