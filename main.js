// 🌍 IDIOMAS
let LANG = "es";

const TEXTOS = {
  es: {
    titulo: "Malacatos",
    subtitulo: "Lugares turísticos y servicios",
    buscar: "Buscar...",
    editar: "Entrar en modo edición",
    salir: "Salir de modo edición",
    leyendas: "Leyendas",
    verTodos: "Ver todos los bienes y servicios",
    bienesServicios: "Bienes y Servicios",
    verMas: "Ver más",
    claveError: "Clave incorrecta",
    mover: "Toca el mapa para mover este ícono"
  },
  en: {
    titulo: "Malacatos",
    subtitulo: "Tourist places and services",
    buscar: "Search...",
    editar: "Enter edit mode",
    salir: "Exit edit mode",
    leyendas: "Legend",
    verTodos: "View all goods and services",
    bienesServicios: "Goods & Services",
    verMas: "See more",
    claveError: "Wrong password",
    mover: "Tap the map to move this marker"
  }
};

// 🔍 BUSCADOR
let searchText = "";

// MAPA
const map = L.map("map").setView([-4.219167, -79.258333], 15);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

// HELPERS
async function cargar(ruta) {
  const r = await fetch(ruta);
  return r.json();
}

function datoSeguro(item) {
  return (
    item &&
    item.nombre &&
    !isNaN(item.latitud) &&
    !isNaN(item.longitud) &&
    item.categoria
  );
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
  try {
    ALL.bienes = (await cargar("data/bienes.json")).filter(datoSeguro);
    ALL.servicios = (await cargar("data/servicios.json")).filter(datoSeguro);
    ALL.categorias = await cargar("data/categorias.json");
  } catch {
    ALL = { bienes: [], servicios: [], categorias: {} };
  }

  generarFiltros();
  renderizarTodo();
  pintarLeyenda();
  bindControls();
  aplicarIdioma();
}
iniciar();

// APLICAR IDIOMA
function aplicarIdioma() {
  const t = TEXTOS[LANG];
  document.querySelector("header h1").textContent = t.titulo;
  document.querySelector("header p").textContent = t.subtitulo;
  document.getElementById("search-input").placeholder = t.buscar;
  document.getElementById("btn-edit").textContent = editMode ? t.salir : t.editar;
  document.getElementById("leyenda-bar").textContent = t.leyendas;
  document.querySelector("#destacados h2").textContent = t.bienesServicios;
  document.querySelector(".btn-ver-todos").textContent = t.verTodos;
}

// MAPA
function renderizarTodo() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  const todos = [...ALL.bienes, ...ALL.servicios];

  todos.forEach(item => {
    if (!datoSeguro(item)) return;
    if (currentFilter && item.categoria !== currentFilter) return;

    // 🔍 FILTRO BUSCADOR
    if (searchText) {
      const n = (item.nombre || "").toLowerCase();
      const d = (item.descripcion || "").toLowerCase();
      const c = (item.categoria || "").toLowerCase();

      if (!n.includes(searchText) && !d.includes(searchText) && !c.includes(searchText)) {
        return;
      }
    }

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
        alert(TEXTOS[LANG].mover);
      } else {
        mostrarDetalle(item);
      }
    });

    markers.push(marker);
  });

  renderDestacados(todos.filter(x => x.destacado));
}

// MOVER ÍCONO
map.on("click", e => {
  if (!editMode || !markerSeleccionado) return;

  const lat = e.latlng.lat.toFixed(6);
  const lng = e.latlng.lng.toFixed(6);

  markerSeleccionado.setLatLng([lat, lng]);
  markerSeleccionado.__data.latitud = lat;
  markerSeleccionado.__data.longitud = lng;

  alert(`Coordenadas:\nLat: ${lat}\nLng: ${lng}`);
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
          it.imagenes?.length > 1
            ? `<button onclick='abrirGaleria(${JSON.stringify(it.imagenes)})'>${TEXTOS[LANG].verMas}</button>`
            : ""
        }
      </div>
    `;
  });
}

// 🔗 DETALLE (AQUÍ SE AÑADEN LOS LINKS)
function mostrarDetalle(item) {
  const links = item.links || {};

  const linksHTML = Object.entries(links)
    .map(([tipo, url]) => {
      if (!url) return "";
      const label = tipo.charAt(0).toUpperCase() + tipo.slice(1);
      return `<p><a href="${url}" target="_blank" rel="noopener">🔗 ${label}</a></p>`;
    })
    .join("");

  document.getElementById("bp-content").innerHTML = `
    <h3>${item.nombre}</h3>
    <p>${item.descripcion || ""}</p>
    <p>${item.direccion || ""}</p>

    ${linksHTML ? `<div class="bp-links">${linksHTML}</div>` : ""}

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
  document.getElementById("lb-img").src = "data/" + imagenes[0];
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

  const b = document.createElement("button");
  b.textContent = "TODOS";
  b.onclick = () => {
    currentFilter = null;
    renderizarTodo();
  };
  f.appendChild(b);

  Object.keys(ALL.categorias).forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.onclick = () => {
      currentFilter = cat;
      renderizarTodo();
    };
    f.appendChild(btn);
  });
}

// LEYENDA
function pintarLeyenda() {
  const c = document.getElementById("leyenda-items");
  c.innerHTML = "";
  Object.entries(ALL.categorias).forEach(([k, v]) => {
    c.innerHTML += `<div class="leyenda-item"><img src="data/${v.icono}">${k}</div>`;
  });
}

// CONTROLES
function bindControls() {
  document.getElementById("btn-edit").onclick = () => {
    if (!editMode) {
      const clave = prompt("Clave:");
      if (clave !== CLAVE_EDICION) {
        alert(TEXTOS[LANG].claveError);
        return;
      }
    }
    editMode = !editMode;
    aplicarIdioma();
  };

  document.getElementById("search-input").addEventListener("input", e => {
    searchText = e.target.value.toLowerCase().trim();
    renderizarTodo();
  });

  document.getElementById("bp-close").onclick = () =>
    document.getElementById("bottom-panel").classList.remove("open");

  document.getElementById("leyenda-bar").onclick = () =>
    document.getElementById("leyenda-drawer").classList.toggle("open");
}
