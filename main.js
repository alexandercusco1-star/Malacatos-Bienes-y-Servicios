// MAPA
const map = L.map("map").setView([-4.219167, -79.258333], 15);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

// HELPERS
async function cargar(ruta) {
  const r = await fetch(ruta);
  return r.json();
}

function iconoDe(ruta) {
  return L.icon({
    iconUrl: "data/" + ruta,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

// ESTADO
let ALL = { bienes: [], servicios: [], categorias: {} };
let markers = [];
let currentFilter = null;
let currentSearch = "";

// INICIO
async function iniciar() {
  ALL.bienes = await cargar("data/bienes.json");
  ALL.servicios = await cargar("data/servicios.json");
  ALL.categorias = await cargar("data/categorias.json");

  generarFiltros();
  renderizarTodo();
  pintarLeyenda();
  bindControls();
}
iniciar();

// RENDER MAPA
function renderizarTodo() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  const todos = [...ALL.bienes, ...ALL.servicios];

  todos.forEach(item => {
    if (isNaN(item.latitud)) return;

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
  const c = document.getElementById("destacados-contenedor");
  c.innerHTML = "";

  arr.forEach(it => {
    const img = it.imagenes?.[0] ? "data/" + it.imagenes[0] : "";
    c.innerHTML += `
      <div class="tarjeta">
        ${img ? `<img src="${img}">` : ""}
        <h3>${it.nombre}</h3>
        <p>${it.descripcion || ""}</p>
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
    <p>${item.direccion || ""}</p>
    <div class="bp-galeria">
      ${(item.imagenes || []).map(i => `<img src="data/${i}">`).join("")}
    </div>
  `;

  panel.classList.add("open");
}

document.getElementById("bp-close").onclick = () =>
  document.getElementById("bottom-panel").classList.remove("open");

// GALERIA
let currentGallery = [];
let galleryIndex = 0;

function mostrarGaleria(nombre) {
  const item = [...ALL.bienes, ...ALL.servicios].find(x => x.nombre === nombre);
  if (!item || !item.imagenes) return;

  currentGallery = item.imagenes;
  galleryIndex = 0;
  document.getElementById("lb-img").src = "data/" + currentGallery[0];
  document.getElementById("lightbox").classList.add("open");
}

function cambiarImg(dir) {
  galleryIndex = (galleryIndex + dir + currentGallery.length) % currentGallery.length;
  document.getElementById("lb-img").src = "data/" + currentGallery[galleryIndex];
}

document.getElementById("lb-close").onclick = () =>
  document.getElementById("lightbox").classList.remove("open");

// LEYENDA
function pintarLeyenda() {
  const c = document.getElementById("leyenda-items");
  c.innerHTML = "";

  Object.entries(ALL.categorias).forEach(([k, v]) => {
    c.innerHTML += `
      <div class="leyenda-item">
        <img src="data/${v.icono}">
        ${k}
      </div>
    `;
  });
}

// FILTROS
function generarFiltros() {
  const f = document.getElementById("filters");
  f.innerHTML = "";

  Object.keys(ALL.categorias).forEach(cat => {
    const b = document.createElement("button");
    b.textContent = cat;
    b.onclick = () => {
      currentFilter = cat;
      renderizarTodo();
    };
    f.appendChild(b);
  });
}

// CONTROLES
function bindControls() {
  document.getElementById("leyenda-bar").onclick = () =>
    document.getElementById("leyenda-drawer").classList.toggle("open");

  // RESET DESACTIVADO (LO ÚNICO QUE CAMBIAMOS)
  const reset = document.getElementById("btn-reset-server");
  reset.onclick = () => false;
}
