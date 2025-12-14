const map = L.map("map").setView([-4.219167, -79.258333], 15);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

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

let ALL = { bienes: [], servicios: [], categorias: {} };
let markers = [];
let editMode = false;
let markerSeleccionado = null;

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

map.on("click", e => {
  if (!editMode || !markerSeleccionado) return;

  const { lat, lng } = e.latlng;
  markerSeleccionado.setLatLng([lat, lng]);
  markerSeleccionado.__data.latitud = lat;
  markerSeleccionado.__data.longitud = lng;

  alert(`NUEVAS COORDENADAS\nLat: ${lat}\nLng: ${lng}`);
  markerSeleccionado = null;
});

// 🔥 GUARDAR CAMBIOS
function guardarCambios() {
  const data = {
    bienes: ALL.bienes,
    servicios: ALL.servicios
  };

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "DATOS_ACTUALIZADOS.json";
  a.click();
}

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
      </div>
    `;
  });
}

function mostrarDetalle(item) {
  document.getElementById("bp-content").innerHTML = `
    <h3>${item.nombre}</h3>
    <p>${item.descripcion || ""}</p>
    <div class="bp-galeria">
      ${(item.imagenes || []).map(i => `<img src="data/${i}">`).join("")}
    </div>
  `;
  document.getElementById("bottom-panel").classList.add("open");
}

function generarFiltros() {
  const f = document.getElementById("filters");
  f.innerHTML = "";
  const b = document.createElement("button");
  b.textContent = "TODOS";
  b.onclick = renderizarTodo;
  f.appendChild(b);
}

function pintarLeyenda() {
  const c = document.getElementById("leyenda-items");
  c.innerHTML = "";
  Object.entries(ALL.categorias).forEach(([k, v]) => {
    c.innerHTML += `<div class="leyenda-item"><img src="data/${v.icono}">${k}</div>`;
  });
}

function bindControls() {
  document.getElementById("btn-edit").onclick = () => {
    editMode = !editMode;
    markerSeleccionado = null;
    document.getElementById("btn-edit").textContent =
      editMode ? "Salir de edición" : "Entrar en modo edición";
  };

  document.getElementById("btn-save").onclick = guardarCambios;
  document.getElementById("bp-close").onclick = () =>
    document.getElementById("bottom-panel").classList.remove("open");

  document.getElementById("leyenda-bar").onclick = () =>
    document.getElementById("leyenda-drawer").classList.toggle("open");
    }
