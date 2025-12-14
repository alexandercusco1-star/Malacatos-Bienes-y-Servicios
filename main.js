const map = L.map('map').setView([-4.219167, -79.258333], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let ALL = { bienes: [], servicios: [], categorias: {} };
let markers = [];
let currentFilter = null;
let currentSearch = "";
let editMode = false;

async function cargar(ruta) {
  const r = await fetch(ruta);
  return await r.json();
}

function iconoDe(ruta) {
  return L.icon({
    iconUrl: `data/${ruta}`,
    iconSize: [28, 28]
  });
}

async function iniciar() {
  [ALL.bienes, ALL.servicios, ALL.categorias] = await Promise.all([
    cargar("data/bienes.json"),
    cargar("data/servicios.json"),
    cargar("data/categorias.json")
  ]);

  generarFiltros();
  renderizarTodo();
  pintarLeyenda();
  bindControls();
}

iniciar();

function clearMarkers() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
}

function renderizarTodo() {
  clearMarkers();

  [...ALL.bienes, ...ALL.servicios].forEach(item => {
    if (!item.latitud || !item.longitud) return;

    const icono =
      item.icono ||
      ALL.categorias[item.categoria]?.icono ||
      "icon-default.jpeg";

    const m = L.marker([item.latitud, item.longitud], {
      icon: iconoDe(icono)
    }).addTo(map);

    m.on("click", () => mostrarDetalle(item));
    markers.push(m);
  });

  renderDestacados([...ALL.bienes, ...ALL.servicios].filter(x => x.destacado));
}

function renderDestacados(arr) {
  const cont = document.getElementById("destacados-contenedor");
  cont.innerHTML = "";

  arr.forEach(it => {
    const img = it.imagenes?.[0] ? `data/${it.imagenes[0]}` : "";
    cont.innerHTML += `
      <div class="tarjeta">
        ${img ? `<img src="${img}">` : ""}
        <h3>${it.nombre}</h3>
        <button onclick="mostrarGaleria('${it.nombre}')">Ver</button>
      </div>
    `;
  });
}

function mostrarDetalle(item) {
  const panel = document.getElementById("bottom-panel");
  const cont = document.getElementById("bp-content");

  cont.innerHTML = `
    <h3>${item.nombre}</h3>
    <p>${item.descripcion || ""}</p>
    <div>
      ${(item.imagenes || []).map(i => `<img src="data/${i}" class="bp-img">`).join("")}
    </div>
  `;

  panel.classList.add("open");
}

document.getElementById("bp-close").onclick = () => {
  document.getElementById("bottom-panel").classList.remove("open");
};

let currentGallery = [];
let galleryIndex = 0;

function mostrarGaleria(nombre) {
  const item = [...ALL.bienes, ...ALL.servicios].find(x => x.nombre === nombre);
  if (!item || !item.imagenes) return;

  currentGallery = item.imagenes;
  galleryIndex = 0;

  document.getElementById("lb-img").src = `data/${currentGallery[0]}`;
  document.getElementById("lightbox").classList.add("open");
}

function cambiarImg(dir) {
  galleryIndex = (galleryIndex + dir + currentGallery.length) % currentGallery.length;
  document.getElementById("lb-img").src = `data/${currentGallery[galleryIndex]}`;
}

document.getElementById("lb-close").onclick = () => {
  document.getElementById("lightbox").classList.remove("open");
};

function pintarLeyenda() {
  const cont = document.getElementById("leyenda-items");
  cont.innerHTML = "";
  Object.entries(ALL.categorias).forEach(([k, v]) => {
    cont.innerHTML += `<div class="leyenda-item"><img src="data/${v.icono}">${k}</div>`;
  });
}

function generarFiltros() {
  const box = document.getElementById("filters");
  box.innerHTML = "";
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

function bindControls() {
  document.getElementById("leyenda-bar").onclick = () =>
    document.getElementById("leyenda-drawer").classList.toggle("open");

  document.getElementById("btn-edit").onclick = () => {
    editMode = !editMode;
    alert("Modo edición: " + (editMode ? "ACTIVO" : "DESACTIVADO"));
  };
    }
