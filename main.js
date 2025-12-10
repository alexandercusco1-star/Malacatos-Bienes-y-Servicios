// ===============================
//   CARGA DE DATOS
// ===============================

let bienes = [];
let servicios = [];

// Cargar bienes
fetch("./data/bienes.json")
  .then((res) => res.json())
  .then((data) => {
    bienes = data;
    inicializar();
  });

// Cargar servicios
fetch("./data/servicios.json")
  .then((res) => res.json())
  .then((data) => {
    servicios = data;
    inicializar();
  });

// ===============================
//   VARIABLES GLOBALES MAPA
// ===============================

let mapa;
let marcadores = [];

// ===============================
//   INICIALIZAR TODO
// ===============================

function inicializar() {
  if (bienes.length === 0 || servicios.length === 0) return;

  inicializarMapa();
  generarSubcategorias();
  mostrarDestacados();
  prepararBuscador();
}

// ===============================
//   INICIALIZAR MAPA
// ===============================

function inicializarMapa() {
  if (mapa) return;

  mapa = L.map("map").setView([-4.2189, -79.2580], 16);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(mapa);

  cargarMarcadores();
}

// ===============================
//   CARGAR MARCADORES
// ===============================

function cargarMarcadores(lista = [...bienes, ...servicios]) {
  marcadores.forEach((m) => mapa.removeLayer(m));
  marcadores = [];

  lista.forEach((item) => {
    const icono = L.icon({
      iconUrl: `./data/iconos/${item.icono}`,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
    });

    const marcador = L.marker([item.latitud, item.longitud], { icon: icono })
      .addTo(mapa)
      .bindPopup(`<b>${item.nombre}</b><br>${item.descripcion}`);

    marcadores.push(marcador);
  });
}

// ===============================
//   SUBCATEGORÍAS (ARRIBA)
// ===============================

function generarSubcategorias() {
  const contenedor = document.getElementById("filters");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  const categoriasBienes = bienes.map((b) => b.categoria);
  const categoriasServicios = servicios.map((s) => s.categoria);

  const todas = [...categoriasBienes, ...categoriasServicios];

  const unicas = [...new Set(todas)];

  unicas.forEach((cat) => {
    const btn = document.createElement("button");
    btn.classList.add("filter-btn");
    btn.textContent = cat;

    btn.addEventListener("click", () => {
      filtrarPorCategoria(cat);
    });

    contenedor.appendChild(btn);
  });
}

// ===============================
//   FILTRAR POR CATEGORÍA
// ===============================

function filtrarPorCategoria(cat) {
  const texto = cat.toLowerCase();

  const filtrados = [...bienes, ...servicios].filter((item) =>
    item.categoria.toLowerCase().includes(texto)
  );

  cargarMarcadores(filtrados);
}

// ===============================
//   DESTACADOS (PÁGINA PRINCIPAL)
// ===============================

function mostrarDestacados() {
  const contenedorBienes = document.getElementById("dest-bienes");
  const contenedorServicios = document.getElementById("dest-servicios");

  if (!contenedorBienes || !contenedorServicios) return;

  contenedorBienes.innerHTML = "";
  contenedorServicios.innerHTML = "";

  const bDest = bienes.filter((b) => b.destacado === true);
  const sDest = servicios.filter((s) => s.destacado === true);

  // Solo los destacados
  bDest.forEach((b) => {
    contenedorBienes.innerHTML += generarCard(b);
  });

  sDest.forEach((s) => {
    contenedorServicios.innerHTML += generarCard(s);
  });
}

// ===============================
//   GENERAR TARJETA
// ===============================

function generarCard(item) {
  return `
    <div class="card">
        <img src="./data/imagenes/${item.imagenes[0]}" alt="${item.nombre}">
        <h3>${item.nombre}</h3>
        <p>${item.descripcion}</p>
    </div>
  `;
}

// ===============================
//   BUSCADOR
// ===============================

function prepararBuscador() {
  const input = document.getElementById("search-input");
  const btn = document.getElementById("search-btn");

  if (!input || !btn) return;

  btn.addEventListener("click", buscarLugares);
  input.addEventListener("keyup", (e) => {
    if (e.key === "Enter") buscarLugares();
  });
}

function buscarLugares() {
  const texto = document.getElementById("search-input").value.toLowerCase();

  const filtrados = [...bienes, ...servicios].filter(
    (item) =>
      item.nombre.toLowerCase().includes(texto) ||
      item.categoria.toLowerCase().includes(texto) ||
      (item.descripcion && item.descripcion.toLowerCase().includes(texto))
  );

  cargarMarcadores(filtrados);
}

// ===============================
//   BOTÓN "VER TODOS"
// ===============================

function verTodos(tipo) {
  const url = `todos.html?tipo=${tipo}`;
  window.open(url, "_blank");
}
