// ================================
// MAIN.JS – BASE DEFINITIVA MALACATOS
// SIN localStorage
// SIN reset desde servidor
// ================================

// ---------------- MAPA ----------------
const map = L.map('map').setView([-4.219167, -79.258333], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

// ---------------- HELPERS ----------------
async function cargar(ruta) {
  const r = await fetch(ruta);
  return await r.json();
}

function crearIcono(ruta, size = 28) {
  return L.icon({
    iconUrl: `data/${ruta}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 6]
  });
}

// ---------------- ESTADO ----------------
let BIENES = [];
let SERVICIOS = [];
let CATEGORIAS = {};
let MARKERS = [];

let editorActivo = false;
let itemEditando = null;
let marcadorTemp = null;

// ---------------- INICIO ----------------
async function iniciar() {
  BIENES = await cargar('data/bienes.json');
  SERVICIOS = await cargar('data/servicios.json');
  CATEGORIAS = await cargar('data/categorias.json');

  generarFiltros();
  renderizar();
  pintarLeyenda();
  configurarEditor();
}

// ---------------- RENDER MAPA ----------------
function limpiarMapa() {
  MARKERS.forEach(m => map.removeLayer(m));
  MARKERS = [];
}

function renderizar() {
  limpiarMapa();

  [...BIENES, ...SERVICIOS].forEach(item => {
    if (!item.latitud || !item.longitud) return;

    const icono = crearIcono(item.icono || 'icon-default.jpeg');
    const marker = L.marker([item.latitud, item.longitud], { icon: icono })
      .addTo(map)
      .on('click', () => {
        mostrarInfo(item);
        if (editorActivo) abrirEditor(item);
      });

    MARKERS.push(marker);
  });
}

// ---------------- INFO PANEL ----------------
function mostrarInfo(item) {
  const panel = document.getElementById('bottom-panel');
  const cont = document.getElementById('bp-content');

  const img = item.imagenes?.[0]
    ? `<img src="data/${item.imagenes[0]}" class="bp-img">`
    : '';

  cont.innerHTML = `
    ${img}
    <h3>${item.nombre}</h3>
    <p>${item.descripcion || ''}</p>
    <p>${item.direccion || item.ubicacion || ''}</p>
  `;

  panel.classList.add('open');
}

document.getElementById('bp-close').onclick = () =>
  document.getElementById('bottom-panel').classList.remove('open');

// ---------------- FILTROS ----------------
function generarFiltros() {
  const box = document.getElementById('filters');
  box.innerHTML = '';

  const btnTodos = document.createElement('button');
  btnTodos.textContent = 'Todos';
  btnTodos.className = 'filter-btn active';
  btnTodos.onclick = () => renderizar();
  box.appendChild(btnTodos);

  Object.keys(CATEGORIAS).forEach(cat => {
    const b = document.createElement('button');
    b.textContent = cat;
    b.className = 'filter-btn';
    b.onclick = () => filtrarCategoria(cat);
    box.appendChild(b);
  });
}

function filtrarCategoria(cat) {
  limpiarMapa();
  [...BIENES, ...SERVICIOS]
    .filter(i => i.categoria === cat)
    .forEach(i => {
      const m = L.marker([i.latitud, i.longitud], {
        icon: crearIcono(i.icono)
      }).addTo(map);
      MARKERS.push(m);
    });
}

// ---------------- LEYENDA ----------------
function pintarLeyenda() {
  const caja = document.getElementById('leyenda-items');
  caja.innerHTML = '';

  Object.entries(CATEGORIAS).forEach(([nombre, data]) => {
    caja.innerHTML += `
      <div class="leyenda-item">
        <img src="data/${data.icono}">
        <span>${nombre}</span>
      </div>
    `;
  });
}

document.getElementById('leyenda-bar').onclick = () =>
  document.getElementById('leyenda-drawer').classList.toggle('open');

// ---------------- EDITOR ----------------
function configurarEditor() {
  const btnEdit = document.getElementById('btn-toggle-edit');
  const panel = document.getElementById('editor-panel');

  btnEdit.onclick = () => {
    editorActivo = !editorActivo;
    panel.setAttribute('aria-hidden', !editorActivo);
    btnEdit.textContent = editorActivo
      ? 'Salir de edición'
      : 'Entrar en modo edición';
  };

  document.getElementById('editor-set-coord').onclick = () => {
    alert('Toca el mapa para fijar coordenadas');
    map.once('click', e => {
      document.getElementById('editor-latitud').value = e.latlng.lat;
      document.getElementById('editor-longitud').value = e.latlng.lng;

      if (marcadorTemp) map.removeLayer(marcadorTemp);
      marcadorTemp = L.marker(e.latlng, { draggable: true }).addTo(map);
    });
  };

  document.getElementById('editor-save').onclick = () => {
    if (!itemEditando) return alert('Selecciona un negocio');

    itemEditando.nombre = editorNombre.value;
    itemEditando.categoria = editorCategoria.value;
    itemEditando.descripcion = editorDescripcion.value;
    itemEditando.direccion = editorDireccion.value;
    itemEditando.telefono = editorTelefono.value;
    itemEditando.icono = editorIcono.value;
    itemEditando.banner = editorBanner.value;
    itemEditando.imagenes = editorImagenes.value.split(',');
    itemEditando.latitud = Number(editorLat.value);
    itemEditando.longitud = Number(editorLng.value);

    renderizar();
    alert('Cambios aplicados (recuerda guardar el JSON)');
  };

  // BOTÓN RESTABLECER – DESACTIVADO
  const reset = document.getElementById('btn-reset-server');
  if (reset) {
    reset.onclick = () => {
      alert('Función desactivada por seguridad');
    };
  }
}

function abrirEditor(item) {
  itemEditando = item;
  editorNombre.value = item.nombre || '';
  editorCategoria.value = item.categoria || '';
  editorDescripcion.value = item.descripcion || '';
  editorDireccion.value = item.direccion || '';
  editorTelefono.value = item.telefono || '';
  editorIcono.value = item.icono || '';
  editorBanner.value = item.banner || '';
  editorImagenes.value = (item.imagenes || []).join(',');
  editorLat.value = item.latitud || '';
  editorLng.value = item.longitud || '';
}

// ---------------- START ----------------
iniciar();
