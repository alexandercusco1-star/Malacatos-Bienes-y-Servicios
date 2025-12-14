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
let currentFilter = "TODOS";
let currentSearch = "";
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

  let todos = [...ALL.bienes, ...ALL.servicios];

  if (currentFilter !== "TODOS") {
    todos = todos.filter(x => x.categoria === currentFilter);
  }

  if (currentSearch) {
    const t = currentSearch.toLowerCase();
    todos = todos.filter(x =>
      x.nombre.toLowerCase().includes(t) ||
      (x.descripcion || "").toLowerCase().includes(t)
    );
  }

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
        alert(
          "Ícono seleccionado:\n" +
          item.nombre +
          "\n\nAhora toca en el mapa donde quieras moverlo."
        );
      } else {
        mostrarDetalle(item);
      }
    });

    markers.push(marker);
  });
}

// 👉 CLICK EN EL MAPA PARA MOVER ÍCONO
map.on("click", e => {
  if (!editMode || !markerSeleccionado) return;

  const { lat, lng } = e.latlng;

  markerSeleccionado.setLatLng([lat, lng]);
  markerSeleccionado.__data.latitud = lat;
  markerSeleccionado.__data.longitud = lng;

  alert(
    "NUEVAS COORDENADAS:\n" +
    "Latitud: " + lat + "\n" +
    "Longitud: " + lng
  );

  markerSeleccionado = null;
});

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
  galleryIndex =
    (galleryIndex + dir + currentGallery.length) % currentGallery.length;
  document.getElementById("lb-img").src =
    "data/" + currentGallery[galleryIndex];
}

document.getElementById("lb-close").onclick = () =>
  document.getElementById("lightbox").classList.remove("open");

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

function generarFiltros() {
  const f = document.getElementById("filters");
  f.innerHTML = "";

  const todosBtn = document.createElement("button");
  todosBtn.textContent = "TODOS";
  todosBtn.onclick = () => {
    currentFilter = "TODOS";
    renderizarTodo();
  };
  f.appendChild(todosBtn);

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

function bindControls() {
  document.getElementById("leyenda-bar").onclick = () =>
    document.getElementById("leyenda-drawer").classList.toggle("open");

  document.getElementById("search-input").oninput = e => {
    currentSearch = e.target.value;
    renderizarTodo();
  };

  document.getElementById("btn-edit").onclick = () => {
    editMode = !editMode;
    document.getElementById("btn-edit").textContent =
      editMode ? "salir de modo edicion" : "entrar en modo edicion";
  };

  document.getElementById("btn-reset-server").onclick = () => false;
      }
