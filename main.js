// main.js - mapa, carga data, buscador, filtros, bottom-panel y galería completa
// + Modo Editor con botón flotante (SIN ‘restablecer desde servidor’)

const map = L.map('map').setView([-4.219167, -79.258333], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ maxZoom: 19 }).addTo(map);

// helpers
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

// UI
const searchInput = () => document.getElementById('search-input');
const filtersBox = () => document.getElementById('filters');
const destacadosCont = () => document.getElementById('destacados-contenedor');
const leyendaDrawer = () => document.getElementById('leyenda-drawer');
const leyendaItems = () => document.getElementById('leyenda-items');
const leyendaBar = () => document.getElementById('leyenda-bar');
const bottomPanel = () => document.getElementById('bottom-panel');
const bpContent = () => document.getElementById('bp-content');

// Lightbox
const lightbox = () => document.getElementById('lightbox');
const lbImg = () => document.getElementById('lb-img');
const lbPrev = () => document.getElementById('lb-prev');
const lbNext = () => document.getElementById('lb-next');
const lbClose = () => document.getElementById('lb-close');

// panel editor
let editorAbierto = false;
const editorBtn = document.createElement("button");
editorBtn.textContent = "Editar";
editorBtn.style.position = "fixed";
editorBtn.style.bottom = "20px";
editorBtn.style.right = "20px";
editorBtn.style.zIndex = "9999";
editorBtn.style.background = "#2ecc71";
editorBtn.style.color = "white";
editorBtn.style.padding = "12px 18px";
editorBtn.style.border = "none";
editorBtn.style.borderRadius = "10px";
editorBtn.style.fontSize = "16px";
editorBtn.style.boxShadow = "0 3px 8px rgba(0,0,0,0.3)";
document.body.appendChild(editorBtn);

// crear panel editor
const editorPanel = document.createElement("div");
editorPanel.style.position = "fixed";
editorPanel.style.bottom = "-100%";
editorPanel.style.left = "0";
editorPanel.style.width = "100%";
editorPanel.style.maxHeight = "60%";
editorPanel.style.background = "white";
editorPanel.style.borderTop = "3px solid #2ecc71";
editorPanel.style.zIndex = "10000";
editorPanel.style.transition = "bottom .3s";
editorPanel.style.padding = "14px";
editorPanel.style.overflowY = "auto";
editorPanel.innerHTML = `
  <h2 style="color:#2b7a78; margin-bottom:10px;">Modo Editor</h2>
  <p style="font-size:14px;color:#444;">Aquí podrás ver o modificar datos de los negocios, especialmente coordenadas.</p>
  <div id="editor-content"></div>
  <button id="editor-close" style="
    margin-top:15px;
    width:100%;
    padding:10px;
    background:#2b7a78;
    color:white;
    border:none;
    border-radius:8px;
    font-size:16px;
  ">Cerrar</button>
`;
document.body.appendChild(editorPanel);

// abrir/cerrar editor
editorBtn.onclick = () => {
  editorPanel.style.bottom = "0";
  cargarListadoEditor();
};
document.getElementById("editor-close").onclick = () => {
  editorPanel.style.bottom = "-100%";
};

// cargar lista en editor
function cargarListadoEditor(){
  const box = document.getElementById("editor-content");
  let all = [...ALL.bienes, ...ALL.servicios];

  box.innerHTML = all.map(item => `
    <div style="padding:10px 0; border-bottom:1px solid #ddd;">
      <b>${item.nombre}</b><br>
      Lat: <span>${item.latitud}</span><br>
      Lng: <span>${item.longitud}</span>
    </div>
  `).join("");
}

async function iniciar(){
  [ALL.bienes, ALL.servicios, ALL.categorias] = await Promise.all([
    cargar('data/bienes.json'),
    cargar('data/servicios.json'),
    cargar('data/categorias.json')
  ]);

  generarFiltros();
  bindControls();
  renderizarTodo();
  pintarLeyenda();
}

// clear markers
function clearMarkers(){
  markers.forEach(m=>map.removeLayer(m));
  markers = [];
}

// render
function renderizarTodo(){
  clearMarkers();

  const combined = [...ALL.bienes, ...ALL.servicios];

  const visibles = combined.filter(i=>{
    const text = (i.nombre + ' ' + (i.categoria||'') + ' ' + (i.descripcion||'')).toLowerCase();
    if (currentSearch && !text.includes(currentSearch.toLowerCase())) return false;
    if (currentFilter && i.categoria !== currentFilter) return false;
    return true;
  });

  // destacados
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
    });

    markers.push(marker);
  });

  const firstDest = dest[0];
  if(firstDest){
    map.setView([parseFloat(firstDest.latitud), parseFloat(firstDest.longitud)], 16);
  }
}

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

function ocultarBottomPanel(){
  bottomPanel().classList.remove('open');
}

// filtros
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

function bindControls(){
  searchInput().addEventListener('input', (e)=>{
    currentSearch = e.target.value.trim();
    renderizarTodo();
  });

  leyendaBar().addEventListener('click', ()=> leyendaDrawer().classList.toggle("open"));

  document.getElementById('bp-close').addEventListener('click', ocultarBottomPanel);

  document.addEventListener('click', (e)=>{
    const bp = bottomPanel();
    if(!bp) return;
    if(bp.contains(e.target)) return;
    const ls = ['filters','search-input','top-bar','leyenda-bar','leyenda-drawer'];
    if(ls.some(id => document.getElementById(id)?.contains(e.target))) return;
    ocultarBottomPanel();
  });
}

// leyenda
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

// Galería
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

lbClose().addEventListener('click', ()=> lightbox().classList.remove('open'));
lbPrev().addEventListener('click', ()=> cambiarImg(-1));
lbNext().addEventListener('click', ()=> cambiarImg(1));

iniciar();
