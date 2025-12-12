// main.js - mapa + editor completo + upload JSON + reset desde servidor
// -----------------------------
// MAPA
// -----------------------------
const map = L.map('map').setView([-4.219167, -79.258333], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ maxZoom: 19 }).addTo(map);

// -----------------------------
// HELPERS Y ESTADO
// -----------------------------
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
let editingItem = null; // referencia al objeto en ALL (no copia)
let editingTipo = null; // 'bienes' o 'servicios'
let tempMarker = null; // marcador temporal para marcar coordenadas en edición

// UI refs
const searchInput = () => document.getElementById('search-input');
const filtersBox = () => document.getElementById('filters');
const destacadosCont = () => document.getElementById('destacados-contenedor');
const bannerArea = () => document.getElementById('banner-area');
const leyendaDrawer = () => document.getElementById('leyenda-drawer');
const leyendaItems = () => document.getElementById('leyenda-items');
const leyendaBar = () => document.getElementById('leyenda-bar');
const bottomPanel = () => document.getElementById('bottom-panel');
const bpContent = () => document.getElementById('bp-content');
const bpClose = () => document.getElementById('bp-close');

// Editor DOM
const btnToggleEdit = document.getElementById('btn-toggle-edit');
const btnUploadJson = document.getElementById('btn-upload-json');
const btnResetServer = document.getElementById('btn-reset-server');
const fileInput = document.getElementById('file-input');

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

// -----------------------------
// INICIO
// -----------------------------
async function iniciar(){
  // Cargar JSON originales y luego preferir localStorage si existe
  try {
    const [bienes, servicios, categorias] = await Promise.all([
      cargar('data/bienes.json'),
      cargar('data/servicios.json'),
      cargar('data/categorias.json')
    ]);
    ALL.bienes = bienes;
    ALL.servicios = servicios;
    ALL.categorias = categorias;
  } catch(e){
    console.error('No se pudieron cargar JSON desde data/:', e);
    ALL = { bienes: [], servicios: [], categorias: {} };
  }

  // Si hay edición previa en localStorage, preferirla
  const local = localStorage.getItem('malacatos_data_v1');
  if(local){
    try{
      const parsed = JSON.parse(local);
      ALL.bienes = parsed.bienes || ALL.bienes;
      ALL.servicios = parsed.servicios || ALL.servicios;
      ALL.categorias = parsed.categorias || ALL.categorias;
    }catch(e){
      console.warn('localStorage inválido, usando archivos del repositorio.');
    }
  }

  generarFiltros();
  bindControls();
  renderizarTodo();
  pintarLeyenda();
}

// -----------------------------
// RENDERS
// -----------------------------
function clearMarkers(){
  markers.forEach(m=>map.removeLayer(m));
  markers = [];
}

function renderizarTodo(){
  clearMarkers();

  const combined = [...ALL.bienes, ...ALL.servicios];
  const visibles = combined.filter(i=>{
    const text = (i.nombre + ' ' + (i.categoria||'') + ' ' + (i.descripcion||'')).toLowerCase();
    if (currentSearch && !text.includes(currentSearch.toLowerCase())) return false;
    if (currentFilter && i.categoria !== currentFilter) return false;
    return true;
  });

  // Render destacados
  const dest = combined.filter(x=>x.destacado === true);
  renderDestacados(dest);

  // markers
  visibles.forEach(item=>{
    const lat = parseFloat(item.latitud);
    const lng = parseFloat(item.longitud);
    if(Number.isNaN(lat) || Number.isNaN(lng)) return;

    let iconFile = item.icono || (ALL.categorias[item.tipo]?.[item.categoria]?.icono) || 'icon-default.jpeg';
    const size = item.destacado ? 52 : 36;

    const marker = L.marker([lat,lng], { icon: iconoDe(iconFile, size) }).addTo(map);
    marker.on('click', ()=> {
      map.setView([lat,lng], item.destacado ? 16 : 15);
      mostrarBottomPanel(item);
      // if editor on, open editor for this item
      if(editorOn){
        abrirEditorPara(item);
      }
    });

    markers.push(marker);
  });

  const firstDest = dest[0];
  if(firstDest){
    map.setView([parseFloat(firstDest.latitud), parseFloat(firstDest.longitud)], 16);
  }
}

// destacados
function renderDestacados(arr){
  destacadosCont().innerHTML = arr.map(it=>{
    const img = it.imagenes?.[0] ? `<img src="data/${it.imagenes[0]}" alt="${it.nombre}">` : '';
    return `
      <div class="tarjeta" data-nombre="${it.nombre}">
        ${img}
        <h3>${it.nombre} ⭐</h3>
        <p>${it.descripcion || it.direccion || ''}</p>
        <button class="ver-btn" data-n="${it.nombre}">Ver</button>
      </div>
    `;
  }).join('');

  destacadosCont().querySelectorAll('.ver-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const nombre = e.currentTarget.dataset.n;
      const target = [...ALL.bienes, ...ALL.servicios].find(x => x.nombre === nombre);
      if(!target) return;
      map.setView([parseFloat(target.latitud), parseFloat(target.longitud)], 16);
      mostrarGaleria(target);
    });
  });
}

// bottom panel
function mostrarBottomPanel(item){
  const img = item.imagenes?.[0] ? `data/${item.imagenes[0]}` : '';
  const telBtn = item.telefono ? `<a class="btn" href="https://wa.me/${item.telefono.replace('+','')}" target="_blank">WhatsApp</a>` : '';
  const bannerHtml = item.banner ? `<img src="data/${item.banner}" class="bp-banner">` : '';

  bpContent().innerHTML = `
    <div class="bp-top">
      ${img ? `<img src="${img}" class="bp-img">` : ''}
      <div class="bp-info">
        <h3>${item.nombre}</h3>
        <p>${item.descripcion || item.direccion || ''}</p>
        <p>📍 ${item.ubicacion || item.direccion || ''}</p>
        <div class="bp-actions">
          ${telBtn}
          <button class="btn" id="bp-dir-btn">Cómo llegar</button>
        </div>
      </div>
    </div>
    ${bannerHtml || ''}
  `;

  setTimeout(()=>{
    const dirBtn = document.getElementById('bp-dir-btn');
    if(dirBtn){
      dirBtn.addEventListener('click', ()=> {
        map.setView([parseFloat(item.latitud), parseFloat(item.longitud)], 17);
      });
    }
  }, 50);

  bottomPanel().classList.add('open');
}

// hide bottom panel
function ocultarBottomPanel(){
  bottomPanel().classList.remove('open');
}

// -----------------------------
// FILTROS
// -----------------------------
function generarFiltros(){
  const container = filtersBox();
  container.innerHTML = '';

  const cats = new Set();
  Object.keys(ALL.categorias.servicios || {}).forEach(k=>cats.add(k));
  Object.keys(ALL.categorias.bienes || {}).forEach(k=>cats.add(k));

  const btnAll = document.createElement('button');
  btnAll.className = 'filter-btn active';
  btnAll.textContent = 'Todos';
  btnAll.addEventListener('click', ()=>{ currentFilter = null; activar(btnAll); renderizarTodo(); });
  container.appendChild(btnAll);

  cats.forEach(cat=>{
    const b = document.createElement('button');
    b.className = 'filter-btn';
    b.textContent = cat;
    b.addEventListener('click', ()=> {
      currentFilter = cat;
      activar(b);
      renderizarTodo();
    });
    container.appendChild(b);
  });
}

function activar(btn){
  document.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');
}

// -----------------------------
// CONTROLES - BIND
// -----------------------------
function bindControls(){
  searchInput().addEventListener('input', (e)=>{
    currentSearch = e.target.value.trim();
    renderizarTodo();
  });

  leyendaBar().addEventListener('click', ()=>{
    leyendaDrawer().classList.toggle("open");
  });

  bpClose().addEventListener('click', ocultarBottomPanel);

  document.addEventListener('click', (e)=>{
    const bp = bottomPanel();
    if(!bp) return;
    if(bp.contains(e.target)) return;
    const ls = ['filters','search-input','top-bar','leyenda-bar','leyenda-drawer'];
    if(ls.some(id => document.getElementById(id) && document.getElementById(id).contains(e.target))) return;
    ocultarBottomPanel();
  });

  // Editor toggle
  btnToggleEdit.addEventListener('click', ()=> {
    editorOn = !editorOn;
    btnToggleEdit.innerText = editorOn ? 'Salir de edición' : 'Entrar en modo edición';
    editorPanel.setAttribute('aria-hidden', editorOn ? 'false' : 'true');
    if(!editorOn) {
      // cerrar edición
      editingItem = null;
      if(tempMarker){ map.removeLayer(tempMarker); tempMarker = null; }
      renderizarTodo();
    }
  });

  editorClose.addEventListener('click', ()=> {
    editorOn = false;
    btnToggleEdit.innerText = 'Entrar en modo edición';
    editorPanel.setAttribute('aria-hidden','true');
    editingItem = null;
    if(tempMarker){ map.removeLayer(tempMarker); tempMarker = null; }
    renderizarTodo();
  });

  // marcar coordenadas: el usuario hace click en el mapa para establecer lat/lng
  editorSetCoord.addEventListener('click', ()=> {
    alert('Ahora, haz click en el mapa donde quieras fijar la ubicación (un solo click).');
    const handler = function(e){
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      editorLat.value = lat;
      editorLng.value = lng;
      if(tempMarker) map.removeLayer(tempMarker);
      tempMarker = L.marker([lat,lng], {draggable:true}).addTo(map);
      // permitir arrastrar y actualizar inputs
      tempMarker.on('dragend', (ev)=>{
        const p = ev.target.getLatLng();
        editorLat.value = p.lat;
        editorLng.value = p.lng;
      });
      map.off('click', handler); // una sola vez
    };
    map.on('click', handler);
  });

  // guardar cambios (edición o nuevo)
  editorSave.addEventListener('click', ()=> {
    const tipo = editorTipo.value;
    const obj = {
      nombre: editorNombre.value || 'Sin nombre',
      tipo: tipo,
      categoria: editorCategoria.value || '',
      descripcion: editorDescripcion.value || '',
      direccion: editorDireccion.value || '',
      telefono: editorTelefono.value || '',
      icono: editorIcono.value || '',
      banner: editorBanner.value || '',
      imagenes: (editorImagenes.value || '').split(',').map(s=>s.trim()).filter(Boolean),
      latitud: Number(editorLat.value) || 0,
      longitud: Number(editorLng.value) || 0,
      destacado: editingItem ? (editingItem.destacado === true) : false
    };

    if(editingItem){
      // actualizar en el array correcto (mutar)
      const arr = ALL[tipo];
      const idx = arr.findIndex(x=>x.nombre === editingItem.nombre && x.latitud == editingItem.latitud && x.longitud == editingItem.longitud);
      if(idx >= 0){
        arr[idx] = {...arr[idx], ...obj};
        alert('Guardado: cambios aplicados al negocio.');
      } else {
        const f = arr.find(x=>x.nombre === editingItem.nombre);
        if(f) Object.assign(f, obj);
      }
    } else {
      // nuevo
      ALL[tipo].push(obj);
      alert('Guardado: nuevo negocio creado.');
    }

    // persistir en localStorage
    persistLocal();
    generarFiltros();
    renderizarTodo();
    pintarLeyenda();
  });

  // nuevo (limpia editor para crear)
  editorNew.addEventListener('click', ()=> {
    editingItem = null;
    editorTipo.value = 'servicios';
    editorNombre.value = '';
    editorCategoria.value = '';
    editorDescripcion.value = '';
    editorDireccion.value = '';
    editorTelefono.value = '';
    editorIcono.value = '';
    editorBanner.value = '';
    editorImagenes.value = '';
    editorLat.value = '';
    editorLng.value = '';
    alert('Editor listo para crear nuevo negocio. Usa "Marcar en mapa" para establecer coordenadas.');
  });

  // eliminar
  editorDelete.addEventListener('click', ()=> {
    if(!editingItem) { alert('Seleccione primero un negocio (haz click en su marcador o en su tarjeta)'); return; }
    if(!confirm('¿Eliminar este negocio? Esta acción no es reversible (hasta que descargues el JSON).')) return;
    const tipo = editingItem.tipo;
    const arr = ALL[tipo];
    const idx = arr.findIndex(x=>x.nombre === editingItem.nombre && x.latitud == editingItem.latitud && x.longitud == editingItem.longitud);
    if(idx >= 0) arr.splice(idx,1);
    persistLocal();
    editingItem = null;
    renderizarTodo();
    alert('Negocio eliminado (cambios guardados localmente).');
  });

  // descargar JSON actualizado
  btnDownloadJSON.addEventListener('click', ()=> {
    // descargar bienes.json y servicios.json por separado
    const aB = document.createElement('a');
    const aS = document.createElement('a');

    const blobB = new Blob([JSON.stringify(ALL.bienes, null, 2)], {type:'application/json'});
    const urlB = URL.createObjectURL(blobB);
    aB.href = urlB; aB.download = 'bienes.json';
    document.body.appendChild(aB); aB.click(); aB.remove();
    URL.revokeObjectURL(urlB);

    const blobS = new Blob([JSON.stringify(ALL.servicios, null, 2)], {type:'application/json'});
    const urlS = URL.createObjectURL(blobS);
    aS.href = urlS; aS.download = 'servicios.json';
    document.body.appendChild(aS); aS.click(); aS.remove();
    URL.revokeObjectURL(urlS);

    alert('Descargados bienes.json y servicios.json. Súbelos a tu repositorio para que los cambios sean permanentes.');
  });

  // subida de JSON desde celular
  btnUploadJson.addEventListener('click', ()=> {
    fileInput.value = null;
    fileInput.click();
  });

  fileInput.addEventListener('change', (ev)=> {
    const files = Array.from(ev.target.files || []);
    if(files.length === 0) return;
    // procesar archivos seleccionados uno por uno
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e)=>{
        try {
          const data = JSON.parse(e.target.result);
          // Si el JSON es un array, intentar detectar si es bienes o servicios
          if(Array.isArray(data)) {
            // heuristic: check first element 'tipo' or name of file
            const lower = file.name.toLowerCase();
            if(lower.includes('bien')) {
              ALL.bienes = data;
              alert('bienes.json cargado desde el celular.');
            } else if(lower.includes('servicio')) {
              ALL.servicios = data;
              alert('servicios.json cargado desde el celular.');
            } else {
              // fallback: check data[0].tipo
              const t0 = data[0]?.tipo;
              if(t0 === 'bienes' || t0 === 'bien') {
                ALL.bienes = data;
                alert('bienes (detectado) cargado.');
              } else if(t0 === 'servicios' || t0 === 'servicio') {
                ALL.servicios = data;
                alert('servicios (detectado) cargado.');
              } else {
                // unknown: ask user which to replace
                const choice = prompt('No se detectó tipo. Escribe "bienes" o "servicios" para indicar dónde cargar este archivo:','bienes');
                if(choice === 'bienes') {
                  ALL.bienes = data;
                  alert('bienes.json cargado.');
                } else {
                  ALL.servicios = data;
                  alert('servicios.json cargado.');
                }
              }
            }
          } else if(typeof data === 'object' && (data.bienes || data.servicios || data.categorias)) {
            // Si es un objeto con llaves
            if(data.bienes) ALL.bienes = data.bienes;
            if(data.servicios) ALL.servicios = data.servicios;
            if(data.categorias) ALL.categorias = data.categorias;
            alert('JSON compuesto cargado (bienes/servicios/categorias).');
          } else {
            alert('Archivo JSON no válido o estructura desconocida.');
          }

          // persistir y re-render
          persistLocal();
          generarFiltros();
          pintarLeyenda();
          renderizarTodo();

        } catch(err) {
          alert('Error al leer JSON: ' + err.message);
        }
      };
      reader.readAsText(file);
    });
  });

  // reset desde servidor (lee los archivos en data/ y reemplaza localStorage)
  btnResetServer.addEventListener('click', async ()=> {
    if(!confirm('¿Restablecer desde los archivos originales en data/? Esto eliminará los cambios locales guardados.')) return;
    try {
      const [bienes, servicios, categorias] = await Promise.all([
        cargar('data/bienes.json'),
        cargar('data/servicios.json'),
        cargar('data/categorias.json')
      ]);
      ALL.bienes = bienes;
      ALL.servicios = servicios;
      ALL.categorias = categorias;
      localStorage.removeItem('malacatos_data_v1');
      generarFiltros();
      pintarLeyenda();
      renderizarTodo();
      alert('Restaurado desde data/ y localStorage eliminado.');
    } catch(e){
      alert('Error al reiniciar desde servidor: ' + e.message);
    }
  });

}

// -----------------------------
// EDITOR HELPERS
// -----------------------------
function abrirEditorPara(item){
  if(!editorOn) return;
  editingItem = item;
  editingTipo = item.tipo || 'servicios';
  editorPanel.setAttribute('aria-hidden','false');

  editorTipo.value = editingTipo;
  editorNombre.value = item.nombre || '';
  editorCategoria.value = item.categoria || '';
  editorDescripcion.value = item.descripcion || '';
  editorDireccion.value = item.direccion || item.ubicacion || '';
  editorTelefono.value = item.telefono || '';
  editorIcono.value = item.icono || '';
  editorBanner.value = item.banner || '';
  editorImagenes.value = (item.imagenes || []).join(',');
  editorLat.value = item.latitud || '';
  editorLng.value = item.longitud || '';
}

function persistLocal(){
  const payload = {
    bienes: ALL.bienes,
    servicios: ALL.servicios,
    categorias: ALL.categorias
  };
  localStorage.setItem('malacatos_data_v1', JSON.stringify(payload));
}

// -----------------------------
// PINTAR LEYENDA
// -----------------------------
function pintarLeyenda(){
  const caja = leyendaItems();
  caja.innerHTML = '';
  Object.keys(ALL.categorias.bienes || {}).forEach(k => {
    caja.innerHTML += `<div class="leyenda-item"><img src="data/${ALL.categorias.bienes[k].icono}" alt="${k}">${k}</div>`;
  });
  Object.keys(ALL.categorias.servicios || {}).forEach(k => {
    caja.innerHTML += `<div class="leyenda-item"><img src="data/${ALL.categorias.servicios[k].icono}" alt="${k}">${k}</div>`;
  });
}

// -----------------------------
// GALERIA (lightbox)
// -----------------------------
function mostrarGaleria(item){
  const fotos = item.imagenes || [];
  if(fotos.length === 0) return;
  currentGallery = fotos;
  galleryIndex = 0;
  lbImg().src = 'data/' + currentGallery[galleryIndex];
  lightbox().classList.add('open');
}

function cambiarImg(dir){
  if(!currentGallery || currentGallery.length===0) return;
  galleryIndex += dir;
  if(galleryIndex < 0) galleryIndex = currentGallery.length - 1;
  if(galleryIndex >= currentGallery.length) galleryIndex = 0;
  lbImg().src = 'data/' + currentGallery[galleryIndex];
}
lbClose().addEventListener('click', ()=> lightbox().classList.remove('open'));
lbPrev().addEventListener('click', ()=> cambiarImg(-1));
lbNext().addEventListener('click', ()=> cambiarImg(1));

// -----------------------------
// START
// -----------------------------
iniciar();
