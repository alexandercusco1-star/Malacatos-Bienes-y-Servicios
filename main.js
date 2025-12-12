// main.js FINAL - Adaptado 100% a tus archivos y reglas
// -------------------------------------------------------
// MAPA
// -------------------------------------------------------
const map = L.map('map').setView([-4.219167, -79.258333], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ maxZoom: 19 }).addTo(map);

// -------------------------------------------------------
// HELPERS Y ESTADO
// -------------------------------------------------------
async function cargar(ruta){ const r = await fetch(ruta); return await r.json(); }
function iconoDe(ruta, size=36){
  return L.icon({ iconUrl:`data/${ruta}`, iconSize:[size,size], iconAnchor:[Math.round(size/2),size], popupAnchor:[0,-size+6] });
}

let ALL = { bienes: [], servicios: [], categorias: {} };
let markers = [];
let currentFilter = null;
let currentSearch = '';
let currentGallery = [];
let galleryIndex = 0;

// Editor state
let editorOn = false;
let editingItem = null;
let tempMarker = null;

// UI refs
const searchInput = () => document.getElementById('search-input');
const filtersBox = () => document.getElementById('filters');
const destacadosCont = () => document.getElementById('destacados-contenedor');
const leyendaDrawer = () => document.getElementById('leyenda-drawer');
const leyendaItems = () => document.getElementById('leyenda-items');
const leyendaBar = () => document.getElementById('leyenda-bar');
const bottomPanel = () => document.getElementById('bottom-panel');
const bpContent = () => document.getElementById('bp-content');
const bpClose = () => document.getElementById('bp-close');

// Editor controls
const btnToggleEdit = document.getElementById('btn-toggle-edit');
const fileInput = document.getElementById('file-input');
const btnUploadJson = document.getElementById('btn-upload-json');
const btnResetServer = document.getElementById('btn-reset-server');

const editorPanel = document.getElementById('editor-panel');
const editorClose = document.getElementById('editor-close');
const editorTipo = document.getElementById('editor-tipo');
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
const editorNew = document.getElementById('editor-new');
const editorDelete = document.getElementById('editor-delete');
const btnDownloadJSON = document.getElementById('btn-download-json');

// Lightbox
const lightbox = () => document.getElementById('lightbox');
const lbImg = () => document.getElementById('lb-img');
const lbPrev = () => document.getElementById('lb-prev');
const lbNext = () => document.getElementById('lb-next');
const lbClose = () => document.getElementById('lb-close');


// -------------------------------------------------------
// INICIO
// -------------------------------------------------------
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
      if(parsed.bienes) ALL.bienes = parsed.bienes;
      if(parsed.servicios) ALL.servicios = parsed.servicios;
      if(parsed.categorias) ALL.categorias = parsed.categorias;
    }catch{}
  }

  generarFiltros();
  bindControls();
  renderizarTodo();
  pintarLeyenda();
}

// -------------------------------------------------------
// RENDER
// -------------------------------------------------------
function clearMarkers(){
  markers.forEach(m=>map.removeLayer(m));
  markers = [];
}

function renderizarTodo(){
  clearMarkers();

  const combined = [...ALL.bienes, ...ALL.servicios];

  const visibles = combined.filter(i=>{
    const text = (i.nombre + ' ' + i.categoria + ' ' + (i.descripcion||'')).toLowerCase();
    if(currentSearch && !text.includes(currentSearch.toLowerCase())) return false;
    if(currentFilter && i.categoria !== currentFilter) return false;
    return true;
  });

  const dest = combined.filter(x => x.destacado === true);
  renderDestacados(dest);

  visibles.forEach(item=>{
    const lat = parseFloat(item.latitud);
    const lng = parseFloat(item.longitud);
    if(isNaN(lat)||isNaN(lng)) return;

    const iconFile = item.icono || 'icon-default.jpeg';

    // 👉 ÍCONOS AL 50% DEL TAMAÑO
    const size = item.destacado ? 26 : 18;

    const marker = L.marker([lat,lng], {
      icon: iconoDe(iconFile, size)
    }).addTo(map);

    marker.on('click', ()=>{
      map.setView([lat,lng], 16);
      mostrarBottomPanel(item);
      if(editorOn) abrirEditorPara(item);
    });

    markers.push(marker);
  });
}

function renderDestacados(arr){
  destacadosCont().innerHTML = arr.map(it=>{
    const img = it.imagenes?.[0] ? `<img src="data/${it.imagenes[0]}" alt="">` : '';
    return `
      <div class="tarjeta">
        ${img}
        <h3>${it.nombre} ⭐</h3>
        <p>${it.descripcion||''}</p>
        <button class="ver-btn" data-n="${it.nombre}">Ver</button>
      </div>
    `;
  }).join('');

  destacadosCont().querySelectorAll('.ver-btn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const nombre = e.currentTarget.dataset.n;
      const target = [...ALL.bienes, ...ALL.servicios].find(x => x.nombre === nombre);
      if(target) mostrarGaleria(target);
    });
  });
}


// -------------------------------------------------------
// BOTTOM PANEL
// -------------------------------------------------------
function mostrarBottomPanel(item){
  const img = item.imagenes?.[0] ? `data/${item.imagenes[0]}` : '';
  const bannerHtml = item.banner ? `<img src="data/${item.banner}" class="bp-img">` : '';

  bpContent().innerHTML = `
    <div class="bp-top">
      ${img ? `<img src="${img}" class="bp-img">` : ''}
      <div>
        <h3>${item.nombre}</h3>
        <p>${item.descripcion||item.direccion||''}</p>
        <p>📍 ${item.ubicacion||item.direccion||''}</p>
      </div>
    </div>
    ${bannerHtml}
  `;

  bottomPanel().classList.add('open');
}

// -------------------------------------------------------
// FILTROS
// -------------------------------------------------------
function generarFiltros(){
  const container = filtersBox();
  container.innerHTML = '';

  const cats = new Set([
    "parque","iglesia","areas verdes","mirador","motos","tienda","supermercado",
    "cafeteria","panaderia","farmacia","transporte","transporte1","transporte2",
    "hostal","hosteria","lugar-eventos","peluqueria","barberia","mecanica",
    "llantera","heladeria","optica","vidreria","veterinaria",
    "canchas-futbol","canchas-ecuavoley"
  ]);

  const btnAll = document.createElement('button');
  btnAll.className = 'filter-btn active';
  btnAll.innerText = "Todos";
  btnAll.onclick = ()=>{ currentFilter=null; activar(btnAll); renderizarTodo(); };
  container.appendChild(btnAll);

  cats.forEach(cat=>{
    const b = document.createElement('button');
    b.className = 'filter-btn';
    b.innerText = cat;
    b.onclick = ()=>{ currentFilter = cat; activar(b); renderizarTodo(); };
    container.appendChild(b);
  });
}

function activar(btn){
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}


// -------------------------------------------------------
// EDITOR
// -------------------------------------------------------
function bindControls(){

  searchInput().addEventListener('input', e=>{
    currentSearch = e.target.value.trim();
    renderizarTodo();
  });

  leyendaBar().onclick = ()=> leyendaDrawer().classList.toggle("open");
  bpClose().onclick = ()=> bottomPanel().classList.remove('open');

  btnToggleEdit.onclick = ()=>{
    editorOn = !editorOn;
    btnToggleEdit.innerText = editorOn ? 'Salir de edición' : 'Entrar en modo edición';
    editorPanel.setAttribute('aria-hidden', editorOn ? 'false' : 'true');
    if(!editorOn){ editingItem=null; if(tempMarker){map.removeLayer(tempMarker); tempMarker=null;} }
  };

  editorClose.onclick = ()=>{
    editorOn = false;
    btnToggleEdit.innerText = 'Entrar en modo edición';
    editorPanel.setAttribute('aria-hidden','true');
    editingItem=null;
  };

  editorSetCoord.onclick = ()=>{
    alert("Toca el mapa para fijar la coordenada.");
    const handler = (e)=>{
      editorLat.value = e.latlng.lat;
      editorLng.value = e.latlng.lng;
      if(tempMarker) map.removeLayer(tempMarker);
      tempMarker = L.marker([e.latlng.lat, e.latlng.lng],{draggable:true}).addTo(map);
      tempMarker.on('dragend', ev=>{
        const p = ev.target.getLatLng();
        editorLat.value = p.lat;
        editorLng.value = p.lng;
      });
      map.off('click', handler);
    };
    map.on('click', handler);
  };

  // GUARDAR
  editorSave.onclick = ()=>{
    if(!editingItem){
      alert("Primero selecciona un negocio tocando su marcador.");
      return;
    }

    const obj = editingItem;
    obj.nombre = editorNombre.value;
    obj.categoria = editorCategoria.value;
    obj.descripcion = editorDescripcion.value;
    obj.direccion = editorDireccion.value;
    obj.telefono = editorTelefono.value;
    obj.icono = editorIcono.value;
    obj.banner = editorBanner.value;
    obj.imagenes = editorImagenes.value.split(',').map(x=>x.trim());
    obj.latitud = Number(editorLat.value);
    obj.longitud = Number(editorLng.value);

    persistLocal();
    renderizarTodo();
    alert("Guardado correctamente.");
  };

  editorNew.onclick = ()=> alert("Deshabilitado por seguridad.");
  editorDelete.onclick = ()=> alert("Deshabilitado por seguridad.");

  btnDownloadJSON.onclick = ()=>{
    const blob = new Blob([JSON.stringify({bienes:ALL.bienes,servicios:ALL.servicios},null,2)],{type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "datos-actualizados.json";
    a.click();
  };

  btnUploadJson.onclick = ()=> fileInput.click();
  fileInput.onchange = (ev)=>{
    const file = ev.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const data = JSON.parse(reader.result);
        if(data.bienes) ALL.bienes = data.bienes;
        if(data.servicios) ALL.servicios = data.servicios;
        persistLocal();
        renderizarTodo();
        alert("JSON cargado.");
      }catch{ alert("Error en JSON."); }
    };
    reader.readAsText(file);
  };

  // -------------------------------------------------------
  // 🔒 DESACTIVAR SOLO EL BOTÓN "RESTABLECER DESDE SERVIDOR"
  // -------------------------------------------------------
  if (btnResetServer) {
    btnResetServer.onclick = (e)=>{
      e.preventDefault();
      e.stopPropagation();
      return false; // no hace nada
    };
    btnResetServer.style.pointerEvents = "none";
    btnResetServer.style.opacity = "0.45";
    btnResetServer.title = "Desactivado por seguridad";
  }
}


// -------------------------------------------------------
// EDITOR helper
// -------------------------------------------------------
function abrirEditorPara(item){
  editingItem = item;
  editorPanel.setAttribute('aria-hidden','false');

  editorNombre.value = item.nombre||'';
  editorCategoria.value = item.categoria||'';
  editorDescripcion.value = item.descripcion||'';
  editorDireccion.value = item.direccion||item.ubicacion||'';
  editorTelefono.value = item.telefono||'';
  editorIcono.value = item.icono||'';
  editorBanner.value = item.banner||'';
  editorImagenes.value = (item.imagenes||[]).join(',');
  editorLat.value = item.latitud||'';
  editorLng.value = item.longitud||'';
}


// -------------------------------------------------------
// PERSIST LOCAL
// -------------------------------------------------------
function persistLocal(){
  localStorage.setItem("malacatos_data_v1", JSON.stringify(ALL));
}


// -------------------------------------------------------
// LEYENDA
// -------------------------------------------------------
function pintarLeyenda(){
  const caja = leyendaItems();
  caja.innerHTML = "";

  const allCats = [
    "parque","iglesia","areas verdes","mirador","motos","tienda","supermercado",
    "cafeteria","panaderia","farmacia","transporte","transporte1","transporte2",
    "hostal","hosteria","lugar-eventos","peluqueria","barberia","mecanica",
    "llantera","heladeria","optica","vidreria","veterinaria",
    "canchas-futbol","canchas-ecuavoley"
  ];

  allCats.forEach(cat=>{
    const icon = ALL.categorias?.[cat]?.icono || "";
    caja.innerHTML += `
      <div class="leyenda-item">
        <img src="data/${icon}" alt="">
        ${cat}
      </div>`;
  });
}


// -------------------------------------------------------
// GALERIA (lightbox)
// -------------------------------------------------------
function mostrarGaleria(item){
  currentGallery = item.imagenes || [];
  if(currentGallery.length===0) return;

  galleryIndex = 0;
  lbImg().src = 'data/' + currentGallery[0];
  lightbox().classList.add("open");
}

lbClose().onclick = ()=> lightbox().classList.remove("open");
lbPrev().onclick = ()=> cambiarImg(-1);
lbNext().onclick = ()=> cambiarImg(1);

function cambiarImg(dir){
  galleryIndex += dir;
  if(galleryIndex < 0) galleryIndex = currentGallery.length-1;
  if(galleryIndex >= currentGallery.length) galleryIndex = 0;
  lbImg().src = 'data/' + currentGallery[galleryIndex];
}


// -------------------------------------------------------
// START
// -------------------------------------------------------
iniciar();
