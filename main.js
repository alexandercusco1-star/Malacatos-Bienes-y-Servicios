// MAPA
const map = L.map("map").setView([-4.219167, -79.258333], 15);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

// HELPERS
async function cargar(ruta) {
  const r = await fetch(ruta);
  return r.json();
}
function datoSeguro(item) {
  if (!item) return false;
  if (!item.nombre) return false;
  if (isNaN(item.latitud)) return false;
  if (isNaN(item.longitud)) return false;
  if (!item.categoria) return false;
  return true;
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
let editMode = false;
const CLAVE_EDICION = "2747842663";
let markerSeleccionado = null;

// GALERÍA
let currentGallery = [];
let galleryIndex = 0;

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

// MAPA
function renderizarTodo() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  const todos = [...ALL.bienes, ...ALL.servicios];

  todos.forEach(item => {
  if (!datoSeguro(item)) return;
    if (isNaN(item.latitud)) return;
    if (currentFilter && item.categoria !== currentFilter) return;

    const icono =
      item.icono ||
      ALL.categorias[item.categoria]?.icono ||
      "icon-default.jpeg";

    const marker = L.marker(
      [item.latitud, item.longitud],
      { icon: iconoDe(icono) }
    ).addTo(map);

    marker.__data = item;

    marker.on("click", () => {
      if (editMode) {
        markerSeleccionado = marker;
        alert("Toca el mapa para mover este ícono");
      } else {
        mostrarDetalle(item);
      }
    });

    markers.push(marker);
  });

  renderDestacados(todos.filter(x => x.destacado));
}

// 👉 MOVER ÍCONO EN MODO EDICIÓN
map.on("click", e => {
  if (!editMode || !markerSeleccionado) return;

  const { lat, lng } = e.latlng;

  markerSeleccionado.setLatLng([lat, lng]);
  markerSeleccionado.__data.latitud = lat;
  markerSeleccionado.__data.longitud = lng;

  alert(`Nuevas coordenadas:\nLat: ${lat}\nLng: ${lng}`);

  markerSeleccionado = null;
});

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
        ${
          it.imagenes && it.imagenes.length > 1
            ? `<button onclick='abrirGaleria(${JSON.stringify(it.imagenes)})'>Ver más</button>`
            : ""
        }
      </div>
    `;
  });
}

// DETALLE
function mostrarDetalle(item) {
  document.getElementById("bp-content").innerHTML = `
    <h3>${item.nombre}</h3>
    <p>${item.descripcion || ""}</p>
    <p>${item.direccion || ""}</p>
    <div class="bp-galeria">
      ${(item.imagenes || []).map(
        i => `<img src="data/${i}" onclick='abrirGaleria(${JSON.stringify(item.imagenes)})'>`
      ).join("")}
    </div>
  `;
  document.getElementById("bottom-panel").classList.add("open");
}

// GALERÍA
function abrirGaleria(imagenes) {
  currentGallery = imagenes;
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

// FILTROS
function generarFiltros() {
  const f = document.getElementById("filters");
  f.innerHTML = "";

  const btnTodos = document.createElement("button");
  btnTodos.textContent = "TODOS";
  btnTodos.onclick = () => {
    currentFilter = null;
    renderizarTodo();
  };
  f.appendChild(btnTodos);

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

function bindControls() {

  document.getElementById("btn-edit").onclick = () => {
    if (!editMode) {
      const clave = prompt("Clave para entrar en modo edición:");
      if (clave !== CLAVE_EDICION) {
        alert("Clave incorrecta");
        return;
      }
    }

    editMode = !editMode;
    markerSeleccionado = null;

    document.getElementById("btn-edit").textContent =
      editMode ? "Salir de modo edición" : "Entrar en modo edición";
  };

  document.getElementById("bp-close").onclick = () =>
    document.getElementById("bottom-panel").classList.remove("open");

  document.getElementById("leyenda-bar").onclick = () =>
    document.getElementById("leyenda-drawer").classList.toggle("open");
}
