// main.js - mapa, carga data, buscador, filtros, bottom-panel y galería completa

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

// UI refs
const searchInput = () => document.getElementById('search-input');
const filtersBox = () => document.getElementById('filters');
const listaLugares = () => document.getElementById('lista-lugares');
const listaServicios = () => document.getElementById('lista-servicios');
const bannerArea = () => document.getElementById('banner-area');
const leyendaDrawer = () => document.getElementById('leyenda-drawer');
const leyendaItems = () => document.getElementById('leyenda-items');
const leyendaBar = () => document.getElementById('leyenda-bar');
const bottomPanel = () => document.getElementById('bottom-panel');
const bpContent = () => document.getElementById('bp-content');
const bpClose = () => document.getElementById('bp-close');

// Lightbox
const lightbox = () => document.getElementById('lightbox');
const lbImg = () => document.getElementById('lb-img');
const lbPrev = () => document.getElementById('lb-prev');
const lbNext = () => document.getElementById('lb-next');
const lbClose = () => document.getElementById('lb-close');

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

// render everything considering filters & search
function renderizarTodo(){
  clearMarkers();

  const combined = [...ALL.bienes, ...ALL.servicios];
  const visibles = combined.filter(i=>{
    // search
    const text = (i.nombre + ' ' + (i.categoria||'') + ' ' + (i.descripcion||'')).toLowerCase();
    if(currentSearch && !text.includes(currentSearch.toLowerCase())) return false;
    // filter by category
    if(currentFilter && i.categoria !== currentFilter) return false;
    return true;
  });

  // render lists
  renderLista(ALL.bienes, 'lista-lugares');
  renderLista(ALL.servicios, 'lista-servicios');

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

  // auto center to highlighted
  const firstDest = visibles.find(v=>v.destacado);
  if(firstDest){
    map.setView([parseFloat(firstDest.latitud), parseFloat(firstDest.longitud)], 16);
  }
}

// render cards
function renderLista(arr, id){
  const cont = document.getElementById(id);
  if(!cont) return;

  cont.innerHTML = arr.map(it=>{
    const img = it.imagenes?.[0] ? `<img src="data/${it.imagenes[0]}" alt="${it.nombre}">` : '';
    return `
      <div class="tarjeta" data-nombre="${it.nombre}">
        ${img}
        <h3>${it.nombre}${it.destacado ? ' ⭐' : ''}</h3>
        <p style="color:#666;font-size:14px">${it.descripcion || it.direccion || ''}</p>
        <button class="ver-btn" data-n="${it.nombre}">Ver</button>
      </div>
    `;
  }).join('');

  cont.querySelectorAll('.ver-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const nombre = e.currentTarget.dataset.n;
      const target = [...ALL.bienes, ...ALL.servicios].find(x=>x.nombre===nombre);
      if(!target) return;

      map.setView([parseFloat(target.latitud), parseFloat(target.longitud)], 16);
      mostrarBottomPanel(target);
    });
  });
}

// bottom panel
function mostrarBottomPanel(item){
  const img = item.imagenes?.[0] ? `data/${item.imagenes[0]}` : '';
  const telBtn = item.telefono ? `<a class="btn" href="https://wa.me/${item.telefono.replace('+','')}" target="_blank">WhatsApp</a>` : '';

  bpContent().innerHTML = `
    ${img ? `<img class="bp-img" src="${img}" alt="${item.nombre}">` : ''}
    <h2>${item.nombre} ${item.destacado?'⭐':''}</h2>
    <p>${item.descripcion || item.direccion || ''}</p>
    ${item.ubicacion?`<p>📍 ${item.ubicacion}</p>`:''}
    <div style="margin-top:10px;display:flex;gap:10px;">
      ${telBtn}
      <button class="btn" id="bp-dir-btn">Cómo llegar</button>
      ${ item.imagenes?.length>1 ? `<button class="btn" id="bp-fotos">Fotos</button>` : '' }
    </div>
  `;

  // fotos
  if(item.imagenes?.length>0){
    const fotosBtn = document.getElementById('bp-fotos');
    if(fotosBtn){
      fotosBtn.addEventListener('click', ()=>{
        abrirGaleria(item.imagenes);
      });
    }
  }

  // cómo llegar
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

// banner area
function mostrarBannerSiTiene(item){
  const area = bannerArea();
  if(!area) return;
  if(item.banner){
    area.setAttribute('aria-hidden','false');
    area.innerHTML = `
      <div class="banner-card">
        <img src="data/${item.banner}">
      </div>
    `;
  } else {
    area.innerHTML = '';
    area.setAttribute('aria-hidden','true');
  }
}

// filtros
function generarFiltros(){
  const container = filtersBox();
  container.innerHTML = '';

  const cats = new Set();
  Object.keys(ALL.categorias.servicios||{}).forEach(k=>cats.add(k));
  Object.keys(ALL.categorias.bienes||{}).forEach(k=>cats.add(k));

  const btnAll = document.createElement('button');
  btnAll.className='filter-btn active';
  btnAll.textContent='Todos';
  btnAll.onclick = ()=>{
    currentFilter=null;
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btnAll.classList.add('active');
    renderizarTodo();
  };
  container.appendChild(btnAll);

  cats.forEach(cat=>{
    const b=document.createElement('button');
    b.className='filter-btn';
    b.textContent=cat;
    b.onclick=()=>{
      document.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      currentFilter=cat;
      renderizarTodo();
    };
    container.appendChild(b);
  });
}

// Leyendas
function pintarLeyenda(){
  const caja = leyendaItems();
  caja.innerHTML = '';

  Object.keys(ALL.categorias.bienes||{}).forEach(k=>{
    const ic = ALL.categorias.bienes[k].icono;
    caja.innerHTML += `<div class="leyenda-item"><img src="data/${ic}"><span>${k}</span></div>`;
  });

  Object.keys(ALL.categorias.servicios||{}).forEach(k=>{
    const ic = ALL.categorias.servicios[k].icono;
    caja.innerHTML += `<div class="leyenda-item"><img src="data/${ic}"><span>${k}</span></div>`;
  });
}

// Bind
function bindControls(){
  // search
  searchInput().addEventListener('input', e=>{
    currentSearch = e.target.value.trim();
    renderizarTodo();
  });

  // leyenda
  leyendaBar().addEventListener('click', ()=>{
    leyendaDrawer().classList.toggle('open');
  });

  // panel close
  bpClose().addEventListener('click', ocultarBottomPanel);

  // Click afuera
  document.addEventListener('click', e=>{
    if(bottomPanel().contains(e.target)) return;
    if(document.getElementById('filters').contains(e.target)) return;
    if(document.getElementById('search-box').contains(e.target)) return;
    if(document.getElementById('leyenda-bar').contains(e.target)) return;
    if(document.getElementById('leyenda-drawer').contains(e.target)) return;
    ocultarBottomPanel();
  });

  // Lightbox
  lbClose().addEventListener('click', cerrarGaleria);
  lbPrev().addEventListener('click', ()=>cambiarImg(-1));
  lbNext().addEventListener('click', ()=>cambiarImg(1));
}

// GALERÍA
function abrirGaleria(fotos){
  currentGallery = fotos;
  galleryIndex = 0;
  lbImg().src = 'data/' + currentGallery[galleryIndex];
  lightbox().classList.add('open');
}

function cerrarGaleria(){
  lightbox().classList.remove('open');
}

function cambiarImg(dir){
  galleryIndex = galleryIndex + dir;
  if(galleryIndex < 0) galleryIndex = currentGallery.length - 1;
  if(galleryIndex >= currentGallery.length) galleryIndex = 0;
  lbImg().src = 'data/' + currentGallery[galleryIndex];
}

// start
iniciar();
