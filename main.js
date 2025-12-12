// main.js — Reparado: subcategorías clicables + leyenda clicable + btnReset desactivado
// -------------------------------------------------------
const map = L.map('map').setView([-4.219167, -79.258333], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ maxZoom: 19 }).addTo(map);

// helpers
async function cargar(ruta){ const r = await fetch(ruta); return await r.json(); }
function iconoDe(ruta, size=18){
  return L.icon({
    iconUrl: `data/${ruta}`,
    iconSize: [size,size],
    iconAnchor: [Math.round(size/2), size],
    popupAnchor: [0, -size + 6]
  });
}

let ALL = { bienes: [], servicios: [], categorias: {} };
let markers = [];
let currentFilter = null;    // nombre de subcategoría activa (case-insensitive)
let currentSearch = '';
let currentGallery = [];
let galleryIndex = 0;

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

const btnResetServer = document.getElementById('btn-reset-server') || null;

// Lightbox refs
const lightbox = () => document.getElementById('lightbox');
const lbImg = () => document.getElementById('lb-img');
const lbPrev = () => document.getElementById('lb-prev');
const lbNext = () => document.getElementById('lb-next');
const lbClose = () => document.getElementById('lb-close');

async function iniciar(){
  try {
    const [bienes, servicios, categorias] = await Promise.all([
      cargar('data/bienes.json'),
      cargar('data/servicios.json'),
      cargar('data/categorias.json')
    ]);
    ALL.bienes = bienes || [];
    ALL.servicios = servicios || [];
    ALL.categorias = categorias || {};
  } catch(e){
    console.error('Error cargando JSON desde data/:', e);
    ALL = { bienes: [], servicios: [], categorias: {} };
  }

  bindControls();
  generarFiltros();        // genera barra principal (por compatibilidad)
  generarSubcategoriasBar(); // crea barra superior de subcategorias clicables
  renderizarTodo();
  pintarLeyenda();
  desactivarBtnResetServer();
}

// ---------- markers ----------
function clearMarkers(){
  markers.forEach(m=>map.removeLayer(m));
  markers = [];
}

function renderizarTodo(){
  clearMarkers();

  const combined = [...ALL.bienes, ...ALL.servicios];
  const visibles = combined.filter(i=>{
    const text = ((i.nombre||'') + ' ' + (i.categoria||'') + ' ' + (i.descripcion||'')).toLowerCase();
    if(currentSearch && !text.includes(currentSearch.toLowerCase())) return false;
    if(currentFilter && (''+ (i.categoria||'')).toLowerCase() !== (''+currentFilter).toLowerCase()) return false;
    return true;
  });

  // render destacados
  renderDestacados(combined.filter(x=>x.destacado === true));

  // markers para los visibles
  visibles.forEach(item=>{
    const lat = parseFloat(item.latitud);
    const lng = parseFloat(item.longitud);
    if(Number.isNaN(lat) || Number.isNaN(lng)) return;

    const iconFile = item.icono || findCategoryIcon(item) || 'icon-default.jpeg';
    const size = item.destacado ? 26 : 18;
    const marker = L.marker([lat,lng], { icon: iconoDe(iconFile, size) }).addTo(map);

    marker.on('click', ()=> {
      map.setView([lat,lng], item.destacado ? 16 : 15);
      mostrarBottomPanel(item);
    });

    markers.push(marker);
  });
}

// Busca icono por categoría (soporta varias estructuras)
function findCategoryIcon(item){
  try {
    const cat = (item.categoria||'').toString();
    if(!cat) return '';
    // formato anidado: ALL.categorias.bienes / servicios
    if(ALL.categorias && (ALL.categorias.bienes || ALL.categorias.servicios)){
      const tipo = item.tipo || (ALL.bienes.includes(item) ? 'bienes' : 'servicios');
      const block = ALL.categorias[tipo] || {};
      for(const k of Object.keys(block)){
        if(k.toLowerCase() === cat.toLowerCase()){
          return block[k].icono || '';
        }
      }
    }
    // formato plano: ALL.categorias = { "parque": {icono:...}, ... } o { "parque": "icon-parque.jpeg" }
    if(ALL.categorias && !ALL.categorias.bienes && !ALL.categorias.servicios){
      for(const k of Object.keys(ALL.categorias||{})){
        if(k.toLowerCase() === cat.toLowerCase()){
          const val = ALL.categorias[k];
          return (val && val.icono) ? val.icono : (typeof val === 'string' ? val : '');
        }
      }
    }
  } catch(e){
    console.warn('findCategoryIcon error', e);
  }
  return '';
}

// ---------- destacados ----------
function renderDestacados(arr){
  const cont = destacadosCont();
  if(!cont) return;
  cont.innerHTML = arr.map(it=>{
    const img = it.imagenes?.[0] ? `<img src="data/${it.imagenes[0]}" alt="${it.nombre}">` : '';
    return `
      <div class="tarjeta" data-nombre="${it.nombre}">
        ${img}
        <h3>${it.nombre}${it.destacado ? ' ⭐' : ''}</h3>
        <p style="color:#666;font-size:14px">${it.descripcion || it.direccion || ''}</p>
        <div style="margin-top:8px;">
          <button class="ver-btn" data-n="${it.nombre}">Ver</button>
        </div>
      </div>
    `;
  }).join('');

  cont.querySelectorAll('.ver-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const nombre = e.currentTarget.dataset.n;
      const target = [...ALL.bienes, ...ALL.servicios].find(x => x.nombre === nombre);
      if(!target) return;
      map.setView([parseFloat(target.latitud), parseFloat(target.longitud)], 16, { animate:true });
      mostrarGaleria(target);
    });
  });
}

// ---------- bottom panel ----------
function mostrarBottomPanel(item){
  const img = item.imagenes?.[0] ? `data/${item.imagenes[0]}` : '';
  const telBtn = item.telefono ? `<a class="btn" href="https://wa.me/${item.telefono.replace('+','')}" target="_blank">WhatsApp</a>` : '';
  const bannerHtml = item.banner ? `<div style="margin-top:10px"><img src="data/${item.banner}" style="width:100%;max-height:140px;object-fit:cover;border-radius:8px;"></div>` : '';

  bpContent().innerHTML = `
    <div class="bp-top">
      ${img ? `<img src="${img}" alt="${item.nombre}" style="width:100%;height:140px;object-fit:cover;border-radius:8px">` : ''}
      <div style="padding-top:8px">
        <h3>${item.nombre}</h3>
        <div style="color:#666;margin-top:6px">${item.descripcion || item.direccion || ''}</div>
        <div style="margin-top:6px;color:#666;font-size:13px">📍 ${item.ubicacion || item.direccion || ''}</div>
        <div style="margin-top:8px">${telBtn}<button class="btn" id="bp-dir-btn">Cómo llegar</button></div>
      </div>
    </div>
    ${bannerHtml}
  `;

  setTimeout(()=>{
    const dirBtn = document.getElementById('bp-dir-btn');
    if(dirBtn){
      dirBtn.addEventListener('click', ()=> {
        map.setView([parseFloat(item.latitud), parseFloat(item.longitud)], 17);
      });
    }
  }, 120);

  bottomPanel().classList.add('open');
}
function ocultarBottomPanel(){ bottomPanel().classList.remove('open'); }


// ---------- filtros (top) ----------
function generarFiltros(){
  const container = filtersBox();
  if(!container) return;
  container.innerHTML = '';

  // intentar obtener subcategorías desde ALL.categorias
  const cats = new Set();

  if(ALL.categorias && (ALL.categorias.bienes || ALL.categorias.servicios)){
    Object.keys(ALL.categorias.bienes || {}).forEach(k=>cats.add(k));
    Object.keys(ALL.categorias.servicios || {}).forEach(k=>cats.add(k));
  } else if(ALL.categorias && typeof ALL.categorias === 'object'){
    Object.keys(ALL.categorias).forEach(k=>{
      // si el valor es objeto con icono, usar llave; si valor es string, usar llave
      cats.add(k);
    });
  } else {
    // fallback: extraer categorias directas de bienes + servicios
    [...ALL.bienes, ...ALL.servicios].forEach(it=>{
      if(it.categoria) cats.add(it.categoria);
    });
  }

  // "Todos" button
  const btnAll = document.createElement('button');
  btnAll.className = 'filter-btn active';
  btnAll.textContent = 'Todos';
  btnAll.addEventListener('click', ()=>{ currentFilter = null; document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active')); btnAll.classList.add('active'); renderizarTodo(); });
  container.appendChild(btnAll);

  // crear botones
  Array.from(cats).forEach(cat=>{
    const b = document.createElement('button');
    b.className = 'filter-btn';
    b.textContent = cat;
    b.addEventListener('click', ()=> {
      document.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      currentFilter = cat;
      renderizarTodo();
    });
    container.appendChild(b);
  });
}


// ---------- SUBCATEGORIAS BAR (la de arriba que pediste) ----------
function generarSubcategoriasBar(){
  // si ya existe, no duplicar
  if(document.getElementById('subcats-bar')) return;

  const topBar = document.getElementById('top-bar');
  if(!topBar) return;

  const bar = document.createElement('div');
  bar.id = 'subcats-bar';
  bar.style.display = 'flex';
  bar.style.gap = '8px';
  bar.style.marginTop = '8px';
  bar.style.overflowX = 'auto';
  bar.style.paddingBottom = '6px';

  // obtener subcategorias (similar a generarFiltros)
  const cats = new Set();
  if(ALL.categorias && (ALL.categorias.bienes || ALL.categorias.servicios)){
    Object.keys(ALL.categorias.bienes || {}).forEach(k=>cats.add(k));
    Object.keys(ALL.categorias.servicios || {}).forEach(k=>cats.add(k));
  } else if(ALL.categorias && typeof ALL.categorias === 'object'){
    Object.keys(ALL.categorias).forEach(k => cats.add(k));
  } else {
    [...ALL.bienes, ...ALL.servicios].forEach(it => { if(it.categoria) cats.add(it.categoria); });
  }

  // botón "Todos" pequeño
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn';
  allBtn.textContent = 'Todos';
  allBtn.onclick = ()=>{ currentFilter=null; renderizarTodo(); };
  bar.appendChild(allBtn);

  Array.from(cats).forEach(cat=>{
    const b = document.createElement('button');
    b.className = 'filter-btn';
    b.textContent = cat;
    b.onclick = ()=> { currentFilter = cat; renderizarTodo(); /* marcar visual si quieres */ };
    bar.appendChild(b);
  });

  topBar.appendChild(bar);
}


// ---------- BIND CONTROLES ----------
function bindControls(){
  const inp = searchInput();
  if(inp) inp.addEventListener('input', (e)=> {
    currentSearch = e.target.value.trim();
    renderizarTodo();
  });

  if(leyendaBar()) leyendaBar().addEventListener('click', ()=>{
    leyendaDrawer().classList.toggle('open');
  });

  if(bpClose()) bpClose().addEventListener('click', ocultarBottomPanel);

  // click outside to close bottom panel
  document.addEventListener('click', (e)=>{
    const bp = bottomPanel();
    if(!bp) return;
    if(bp.contains(e.target)) return;
    const ls = ['filters','search-input','leyenda-bar','leyenda-drawer','subcats-bar'];
    if(ls.some(id => document.getElementById(id) && document.getElementById(id).contains(e.target))) return;
    ocultarBottomPanel();
  });
}

// ---------- LEYENDA (ahora CLICABLE) ----------
function pintarLeyenda(){
  const caja = leyendaItems();
  if(!caja) return;
  caja.innerHTML = '';

  // si estructura anidada
  if(ALL.categorias && (ALL.categorias.bienes || ALL.categorias.servicios)){
    Object.keys(ALL.categorias.bienes || {}).forEach(k => {
      const ico = ALL.categorias.bienes[k].icono || '';
      caja.appendChild(leyendaItemNode(k, ico));
    });
    Object.keys(ALL.categorias.servicios || {}).forEach(k => {
      const ico = ALL.categorias.servicios[k].icono || '';
      caja.appendChild(leyendaItemNode(k, ico));
    });
    return;
  }

  // si estructura plana
  if(ALL.categorias && typeof ALL.categorias === 'object'){
    Object.keys(ALL.categorias).forEach(k => {
      const val = ALL.categorias[k];
      const ico = (val && val.icono) ? val.icono : (typeof val === 'string' ? val : '');
      caja.appendChild(leyendaItemNode(k, ico));
    });
    return;
  }

  // fallback: derivar de items
  const seen = new Set();
  [...ALL.bienes, ...ALL.servicios].forEach(it=>{
    const k = it.categoria || it.nombre || 'sin categoria';
    if(seen.has(k)) return; seen.add(k);
    const ico = it.icono || '';
    caja.appendChild(leyendaItemNode(k, ico));
  });
}

function leyendaItemNode(label, iconFilename){
  const wrap = document.createElement('div');
  wrap.className = 'leyenda-item';
  const img = document.createElement('img');
  img.src = `data/${iconFilename || 'icon-default.jpeg'}`;
  img.onerror = function(){ this.src = 'data/icon-default.jpeg'; };
  img.style.width = '28px'; img.style.height = '28px'; img.style.objectFit = 'cover';
  const txt = document.createElement('span');
  txt.innerText = label;
  txt.style.marginLeft = '8px';
  wrap.appendChild(img);
  wrap.appendChild(txt);

  // clic en leyenda = aplicar filtro y cerrar drawer
  wrap.addEventListener('click', ()=>{
    currentFilter = label;
    renderizarTodo();
    // close drawer
    if(leyendaDrawer()) leyendaDrawer().classList.remove('open');
    // highlight matching filter button (top bar) if exists
    highlightFilterButton(label);
  });

  return wrap;
}

function highlightFilterButton(label){
  const btns = document.querySelectorAll('#filters .filter-btn, #subcats-bar .filter-btn');
  btns.forEach(b=>{
    if(b.innerText && b.innerText.toLowerCase() === (''+label).toLowerCase()){
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });
}

// ---------- GALERIA (lightbox) ----------
function mostrarGaleria(item){
  const fotos = item.imagenes || [];
  if(fotos.length === 0) return;
  currentGallery = fotos;
  galleryIndex = 0;
  lbImg().src = 'data/' + currentGallery[0];
  lightbox().classList.add('open');
}
function cambiarImg(dir){
  if(!currentGallery || currentGallery.length===0) return;
  galleryIndex += dir;
  if(galleryIndex < 0) galleryIndex = currentGallery.length - 1;
  if(galleryIndex >= currentGallery.length) galleryIndex = 0;
  lbImg().src = 'data/' + currentGallery[galleryIndex];
}
try {
  lbClose().addEventListener('click', ()=> lightbox().classList.remove('open'));
  lbPrev().addEventListener('click', ()=> cambiarImg(-1));
  lbNext().addEventListener('click', ()=> cambiarImg(1));
} catch(e){}

// ---------- desactivar botón reset ----------
function desactivarBtnResetServer(){
  try {
    if(!btnResetServer) return;
    const clone = btnResetServer.cloneNode(true);
    clone.id = btnResetServer.id;
    clone.innerText = btnResetServer.innerText;
    clone.style.pointerEvents = 'none';
    clone.style.opacity = '0.45';
    clone.title = 'Desactivado por seguridad';
    btnResetServer.parentNode.replaceChild(clone, btnResetServer);
    console.log('btnResetServer desactivado');
  } catch(e){
    console.warn('No existe btnResetServer para desactivar');
  }
}

// START
iniciar();
