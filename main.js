// main.js — BASE DEFINITIVA MALACATOS
// ==================================

// MAPA
const map = L.map('map').setView([-4.219167, -79.258333], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

// HELPERS
async function cargar(ruta){
  const r = await fetch(ruta);
  return await r.json();
}

function iconoSeguro(item, size = 28){
  let iconFile = 'icon-default.jpeg';

  if(item.icono && item.icono.trim() !== ''){
    iconFile = item.icono;
  } else if(ALL.categorias?.[item.categoria]?.icono){
    iconFile = ALL.categorias[item.categoria].icono;
  }

  return L.icon({
    iconUrl: `data/${iconFile}`,
    iconSize: [size, size],
    iconAnchor: [size/2, size],
    popupAnchor: [0, -size + 4]
  });
}

function imgSeguro(nombre){
  if(!nombre) return '';
  return `data/${nombre}`;
}

// ESTADO
let ALL = { bienes: [], servicios: [], categorias: {} };
let markers = [];
let currentFilter = null;
let currentSearch = '';
let editorOn = false;
let editingItem = null;
let tempMarker = null;

// UI
const destacadosCont = () => document.getElementById('destacados-contenedor');
const filtersBox = () => document.getElementById('filters');
const searchInput = () => document.getElementById('search-input');
const bottomPanel = () => document.getElementById('bottom-panel');
const bpContent = () => document.getElementById('bp-content');
const bpClose = () => document.getElementById('bp-close');
const leyendaItems = () => document.getElementById('leyenda-items');
const leyendaBar = () => document.getElementById('leyenda-bar');
const leyendaDrawer = () => document.getElementById('leyenda-drawer');

// BOTONES
const btnToggleEdit = document.getElementById('btn-toggle-edit');
const btnResetServer = document.getElementById('btn-reset-server');

// EDITOR
const editorPanel = document.getElementById('editor-panel');
const editorNombre = document.getElementById('editor-nombre');
const editorCategoria = document.getElementById('editor-categoria');
const editorDescripcion = document.getElementById('editor-descripcion');
const editorDireccion = document.getElementById('editor-direccion');
const editorTelefono = document.getElementById('editor-telefono');
const editorIcono = document.getElementById('editor-icono');
const editorBanner = document.getElementById('editor-banner');
const editorImagenes = document.getElementById('editor-imagenes');
const editorLat = document.getElementById('editor-latitud');
const editorLng = document.getElementById('editor-longitud');
const editorSetCoord = document.getElementById('editor-set-coord');
const editorSave = document.getElementById('editor-save');
const editorDelete = document.getElementById('editor-delete');

// INICIO
async function iniciar(){
  const [bienes, servicios, categorias] = await Promise.all([
    cargar('data/bienes.json'),
    cargar('data/servicios.json'),
    cargar('data/categorias.json')
  ]);

  ALL.bienes = bienes;
  ALL.servicios = servicios;
  ALL.categorias = categorias;

  const local = localStorage.getItem('malacatos_data_v1');
  if(local){
    try{
      const parsed = JSON.parse(local);
      ALL = parsed;
    }catch{}
  }

  generarFiltros();
  bindControls();
  renderizarTodo();
  pintarLeyenda();
}

// RENDER
function clearMarkers(){
  markers.forEach(m => map.removeLayer(m));
  markers = [];
}

function renderizarTodo(){
  clearMarkers();

  const todos = [...ALL.bienes, ...ALL.servicios];

  const visibles = todos.filter(i=>{
    if(!i.latitud || !i.longitud) return false;
    if(currentFilter && i.categoria !== currentFilter) return false;
    if(currentSearch){
      const t = (i.nombre + i.descripcion + i.categoria).toLowerCase();
      if(!t.includes(currentSearch.toLowerCase())) return false;
    }
    return true;
  });

  // DESTACADOS
  const destacados = todos.filter(x => x.destacado === true);
  renderDestacados(destacados);

  visibles.forEach(item=>{
    const marker = L.marker(
      [item.latitud, item.longitud],
      { icon: iconoSeguro(item) }
    ).addTo(map);

    marker.on('click', ()=>{
      mostrarBottomPanel(item);
      if(editorOn) abrirEditorPara(item);
    });

    markers.push(marker);
  });
}

function renderDestacados(arr){
  destacadosCont().innerHTML = arr.map(it=>{
    const img = it.imagenes?.[0]
      ? `<img src="${imgSeguro(it.imagenes[0])}">`
      : '';
    return `
      <div class="tarjeta">
        ${img}
        <h3>${it.nombre}</h3>
        <p>${it.descripcion || ''}</p>
      </div>
    `;
  }).join('');
}

// BOTTOM PANEL
function mostrarBottomPanel(item){
  bpContent().innerHTML = `
    <h3>${item.nombre}</h3>
    <p>${item.descripcion || item.direccion || ''}</p>
    ${item.imagenes?.map(i=>`<img src="${imgSeguro(i)}">`).join('') || ''}
  `;
  bottomPanel().classList.add('open');
}

// FILTROS
function generarFiltros(){
  filtersBox().innerHTML = '';

  const btnAll = document.createElement('button');
  btnAll.textContent = 'Todos';
  btnAll.onclick = ()=>{ currentFilter=null; renderizarTodo(); };
  filtersBox().appendChild(btnAll);

  Object.keys(ALL.categorias).forEach(cat=>{
    const b = document.createElement('button');
    b.textContent = cat;
    b.onclick = ()=>{ currentFilter=cat; renderizarTodo(); };
    filtersBox().appendChild(b);
  });
}

// EDITOR
function bindControls(){
  searchInput()?.addEventListener('input', e=>{
    currentSearch = e.target.value;
    renderizarTodo();
  });

  bpClose()?.addEventListener('click', ()=>{
    bottomPanel().classList.remove('open');
  });

  leyendaBar()?.addEventListener('click', ()=>{
    leyendaDrawer().classList.toggle('open');
  });

  // EDITAR SI FUNCIONA
  btnToggleEdit.onclick = ()=>{
    editorOn = !editorOn;
    editorPanel.setAttribute('aria-hidden', editorOn ? 'false' : 'true');
  };

  // ❌ BOTÓN RESTABLECER DESDE SERVIDOR — DESACTIVADO
  btnResetServer.onclick = ()=>{
    alert('Este botón está desactivado por seguridad.');
  };

  editorSetCoord.onclick = ()=>{
    alert('Toca el mapa para fijar coordenadas');
    const handler = e=>{
      editorLat.value = e.latlng.lat;
      editorLng.value = e.latlng.lng;
      map.off('click', handler);
    };
    map.on('click', handler);
  };

  editorSave.onclick = ()=>{
    if(!editingItem) return alert('Selecciona un marcador');
    editingItem.nombre = editorNombre.value;
    editingItem.categoria = editorCategoria.value;
    editingItem.descripcion = editorDescripcion.value;
    editingItem.direccion = editorDireccion.value;
    editingItem.telefono = editorTelefono.value;
    editingItem.icono = editorIcono.value;
    editingItem.banner = editorBanner.value;
    editingItem.imagenes = editorImagenes.value.split(',').map(x=>x.trim());
    editingItem.latitud = Number(editorLat.value);
    editingItem.longitud = Number(editorLng.value);

    persistLocal();
    renderizarTodo();
    alert('Guardado');
  };

  // ❌ BORRAR DESACTIVADO
  editorDelete.onclick = ()=>{
    alert('Eliminar está desactivado por seguridad.');
  };
}

function abrirEditorPara(item){
  editingItem = item;
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

// LEYENDA
function pintarLeyenda(){
  leyendaItems().innerHTML = Object.entries(ALL.categorias).map(([k,v])=>`
    <div class="leyenda-item">
      <img src="data/${v.icono}">
      ${k}
    </div>
  `).join('');
}

// PERSISTENCIA
function persistLocal(){
  localStorage.setItem('malacatos_data_v1', JSON.stringify(ALL));
}

// START
iniciar();
