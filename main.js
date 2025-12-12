// main.js — versión corregida para leyenda + botón desactivado + iconos mitad tamaño
// -------------------------------------------------------
const map = L.map('map').setView([-4.219167, -79.258333], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ maxZoom: 19 }).addTo(map);

// helpers
async function cargar(ruta){ const r = await fetch(ruta); return await r.json(); }
function iconoDe(ruta, size=18){ // tamaños reducidos: 18 normal, 26 destacado
  return L.icon({
    iconUrl: `data/${ruta}`,
    iconSize: [size,size],
    iconAnchor: [Math.round(size/2), size],
    popupAnchor: [0, -size + 6]
  });
}

let ALL = { bienes: [], servicios: [], categorias: {} };
let markers = [];
let currentFilter = null;
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

const btnResetServer = document.getElementById('btn-reset-server'); // botón que desactivaremos

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
    ALL.bienes = bienes;
    ALL.servicios = servicios;
    ALL.categorias = categorias;
  } catch(e){
    console.error('Error cargando JSON desde data/:', e);
    ALL = { bienes: [], servicios: [], categorias: {} };
  }

  bindControls();
  generarFiltros();
  renderizarTodo();
  pintarLeyenda();
  desactivarBtnResetServer(); // desactivar al inicio por seguridad
}

// clear markers
function clearMarkers(){
  markers.forEach(m=>map.removeLayer(m));
  markers = [];
}

// render everything considering filters & search
function renderizarTodo(){
  clearMarkers();

  const combined = [...ALL.bienes, ...ALL.servicios];
  const visibles = combined.filter(i=>{
    const text = ((i.nombre||'') + ' ' + (i.categoria||'') + ' ' + (i.descripcion||'')).toLowerCase();
    if(currentSearch && !text.includes(currentSearch.toLowerCase())) return false;
    if(currentFilter && (i.categoria||'').toLowerCase() !== currentFilter.toLowerCase()) return false;
    return true;
  });

  // render destacados area
  renderDestacados(combined.filter(x=>x.destacado === true));

  visibles.forEach(item=>{
    const lat = parseFloat(item.latitud);
    const lng = parseFloat(item.longitud);
    if(Number.isNaN(lat) || Number.isNaN(lng)) return;

    // elegir icono: item.icono OR buscar en categorias (admite dos estructuras)
    let iconFile = item.icono || findCategoryIcon(item) || 'icon-default.jpeg';
    const size = item.destacado ? 26 : 18; // destacados más grandes (pero aun mitad del original)
    const marker = L.marker([lat,lng], { icon: iconoDe(iconFile, size) }).addTo(map);

    marker.on('click', ()=> {
      map.setView([lat,lng], item.destacado ? 16 : 15);
      mostrarBottomPanel(item);
    });

    markers.push(marker);
  });
}

function findCategoryIcon(item){
  // intenta buscar icono en ALL.categorias soportando ambos formatos:
  // 1) ALL.categorias = { "parque": { "icono": "icon-parque.jpeg" }, ... }
  // 2) ALL.categorias = { bienes: { "Parque": { icono: "icon..." } }, servicios: {...} }
  try {
    // 1 — formato plano (keys ya en minúscula o como el JSON tenga)
    if(ALL.categorias && typeof ALL.categorias === 'object' && !ALL.categorias.bienes && !ALL.categorias.servicios){
      const key = (item.categoria || '').toLowerCase();
      for(const k of Object.keys(ALL.categorias)){
        if(k.toLowerCase() === key){
          return ALL.categorias[k].icono || '';
        }
      }
    }
    // 2 — formato anidado
    if(ALL.categorias && (ALL.categorias.bienes || ALL.categorias.servicios)){
      const tipo = item.tipo || (ALL.bienes.includes(item) ? 'bienes' : 'servicios');
      const cat = item.categoria || '';
      const block = ALL.categorias[tipo] || ALL.categorias.bienes || ALL.categorias.servicios || {};
      // buscar por coincidencia directa (case-insensitive)
      for(const k of Object.keys(block)){
        if(k.toLowerCase() === (cat||'').toLowerCase()){
          return block[k].icono || '';
        }
      }
    }
  } catch(e){
    console.warn('findCategoryIcon error', e);
  }
  return '';
}

// render destacados
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

// bottom panel: builds HTML and opens it
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

// hide bottom panel
function ocultarBottomPanel(){
  bottomPanel().classList.remove('open');
  bottomPanel().setAttribute('aria-hidden','true');
}

// generate filters from categories JSON (simple: keys)
function generarFiltros(){
  const container = filtersBox();
  if(!container) return;
  container.innerHTML = '';

  // si ALL.categorias tiene bienes/servicios, tomar sub-keys; si es plano, tomar keys
  const cats = new Set();
  if(ALL.categorias){
    if(ALL.categorias.bienes || ALL.categorias.servicios){
      Object.keys(ALL.categorias.bienes||{}).forEach(k=>cats.add(k));
      Object.keys(ALL.categorias.servicios||{}).forEach(k=>cats.add(k));
    } else {
      Object.keys(ALL.categorias||{}).forEach(k=>cats.add(k));
    }
  }

  const btnAll = document.createElement('button');
  btnAll.className = 'filter-btn active';
  btnAll.textContent = 'Todos';
  btnAll.addEventListener('click', ()=>{ currentFilter = null; document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active')); btnAll.classList.add('active'); renderizarTodo(); });
  container.appendChild(btnAll);

  cats.forEach(cat=>{
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

// bind controls: search, leyenda bar, bottom panel close
function bindControls(){
  const inp = searchInput();
  if(inp) inp.addEventListener('input', (e)=> {
    currentSearch = e.target.value.trim();
    renderizarTodo();
  });

  if(leyendaBar()) leyendaBar().addEventListener('click', ()=>{
    leyendaDrawer().classList.toggle('open');
    document.body.classList.toggle('leyenda-open');
  });

  if(bpClose()) bpClose().addEventListener('click', ocultarBottomPanel);

  document.addEventListener('click', (e)=>{
    const bp = bottomPanel();
    if(!bp) return;
    if(bp.contains(e.target)) return;
    const ls = ['filters','search-input','leyenda-bar','leyenda-drawer'];
    if(ls.some(id => document.getElementById(id) && document.getElementById(id).contains(e.target))) return;
    ocultarBottomPanel();
  });
}

// paint legend from categories (robusta)
function pintarLeyenda(){
  const caja = leyendaItems();
  if(!caja) return;
  caja.innerHTML = '';

  // 1) si categorias tiene bienes/servicios
  if(ALL.categorias && (ALL.categorias.bienes || ALL.categorias.servicios)){
    Object.keys(ALL.categorias.bienes || {}).forEach(k => {
      const ico = ALL.categorias.bienes[k].icono || '';
      caja.innerHTML += `<div class="leyenda-item"><img src="data/${ico}" onerror="this.src='data/icon-default.jpeg'">${k}</div>`;
    });
    Object.keys(ALL.categorias.servicios || {}).forEach(k => {
      const ico = ALL.categorias.servicios[k].icono || '';
      caja.innerHTML += `<div class="leyenda-item"><img src="data/${ico}" onerror="this.src='data/icon-default.jpeg'">${k}</div>`;
    });
    return;
  }

  // 2) si categorias es plano
  if(ALL.categorias && typeof ALL.categorias === 'object'){
    Object.keys(ALL.categorias).forEach(k => {
      const ico = ALL.categorias[k]?.icono || ALL.categorias[k] || '';
      caja.innerHTML += `<div class="leyenda-item"><img src="data/${ico}" onerror="this.src='data/icon-default.jpeg'">${k}</div>`;
    });
    return;
  }

  // fallback: mostrar subcategorias de bienes y servicios
  (ALL.bienes || []).slice(0,30).forEach(it=>{
    const icon = it.icono || '';
    const label = it.categoria || it.nombre || 'sin nombre';
    caja.innerHTML += `<div class="leyenda-item"><img src="data/${icon}" onerror="this.src='data/icon-default.jpeg'">${label}</div>`;
  });
}

// GALERIA: abrir galería de imágenes
function mostrarGaleria(item){
  const fotos = item.imagenes || [];
  if(fotos.length === 0) return;
  currentGallery = fotos;
  galleryIndex = 0;
  lbImg().src = 'data/' + currentGallery[galleryIndex];
  lightbox().classList.add('open');
}

function cambiarImg(dir){
  galleryIndex += dir;
  if(galleryIndex < 0) galleryIndex = currentGallery.length - 1;
  if(galleryIndex >= currentGallery.length) galleryIndex = 0;
  lbImg().src = 'data/' + currentGallery[galleryIndex];
}

// desactivar botón “Restablecer desde servidor” de forma segura
function desactivarBtnResetServer(){
  try {
    if(!btnResetServer) return;
    // quitar todos los listeners y desactivarlo visualmente
    const clone = btnResetServer.cloneNode(true);
    clone.id = btnResetServer.id;
    clone.innerText = btnResetServer.innerText;
    // estilo disabled visual
    clone.style.pointerEvents = 'none';
    clone.style.opacity = '0.5';
    clone.title = "Este botón está desactivado";
    btnResetServer.parentNode.replaceChild(clone, btnResetServer);
    console.log('btnResetServer DESACTIVADO');
  } catch(e){
    console.warn('No se pudo desactivar btnResetServer', e);
  }
}

// hooks lightbox
try {
  lbClose().addEventListener('click', ()=> lightbox().classList.remove('open'));
  lbPrev().addEventListener('click', ()=> cambiarImg(-1));
  lbNext().addEventListener('click', ()=> cambiarImg(1));
} catch(e){ /* no pasa nada si faltan elementos */ }

// start
iniciar();
