// main.js - versión A corregida (mejora buscador inteligente sin tocar nada más)

// MAPA + HELPERS (idéntico a tu versión)
const map = L.map('map').setView([-4.219167, -79.258333], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ maxZoom: 19 }).addTo(map);

// helpers
async function cargar(ruta){ const r = await fetch(ruta); return await r.json(); }
function iconoDe(ruta, size=36){
  return L.icon({ iconUrl:`data/${ruta}`, iconSize:[size,size], iconAnchor:[Math.round(size/2),size], popupAnchor:[0,-size+6] });
}

// ESTADO GLOBAL (idéntico)
let ALL = { bienes: [], servicios: [], categorias: {} };
let markers = [];
let currentFilter = null;
let currentSearch = '';

// UI refs (idénticos a tu versión)
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


// -----------------------
// BÚSQUEDA: normalizar + sinónimos + expansión
// -----------------------
function normalizar(text){
  if(!text) return '';
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^\w\s]/g, " ")        // quita signos raros
    .replace(/\s+/g, " ")            // normaliza espacios
    .trim();
}

// Sinónimos/pruebas comunes: puedes ampliar
const SYNONYMS = {
  "barberia": ["peluqueria","peluquería","barber","corte","cabello"],
  "peluqueria": ["barberia","barber","corte"],
  "mecanica": ["taller","auto","vehiculo","carro"],
  "iglesia": ["templo","capilla","parroquia"],
  "restaurante": ["comida","almuerzo","cena","comer"],
  "parque": ["area verde","jardin","zona verde"]
};

function expandSearchTokens(query){
  const n = normalizar(query);
  if(!n) return [];
  const tokens = new Set(n.split(" "));
  // si la frase incluye una palabra clave que tenemos en synonyms, agregar sus sinónimos
  for(const key in SYNONYMS){
    if(n.includes(key)){
      SYNONYMS[key].forEach(s => tokens.add(normalizar(s)));
    }
    // también si el usuario tipeó un sinónimo, mapear al key original
    SYNONYMS[key].forEach(s => {
      if(n.includes(s)) tokens.add(normalizar(key));
    });
  }
  return Array.from(tokens).filter(Boolean);
}

// -----------------------
// INICIO: carga JSON y primer render (idéntico salvo la llamada a renderizarTodo mejorada)
// -----------------------
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

// clear markers (idéntico)
function clearMarkers(){
  markers.forEach(m=>map.removeLayer(m));
  markers = [];
}

// -----------------------
// RENDER GENERAL (mejorado buscador)
// -----------------------
function renderizarTodo(){
  clearMarkers();

  const combined = [...ALL.bienes, ...ALL.servicios];

  // tokens para búsqueda inteligente (si hay texto)
  const tokens = currentSearch ? expandSearchTokens(currentSearch) : [];

  // filtro principal: si hay tokens, comprobar coincidencias parciales en nombre/categoria/descripcion/direccion/telefono
  const visibles = combined.filter(item=>{
    // si hay filtro de subcategoría exacta
    if(currentFilter && item.categoria !== currentFilter) return false;

    if(tokens.length === 0) return true; // no se busca -> visible

    // construimos un string normalizado con los campos que queremos comparar
    const hay = normalizar(
      (item.nombre||'') + ' ' +
      (item.categoria||'') + ' ' +
      (item.descripcion||'') + ' ' +
      (item.direccion||'') + ' ' +
      (item.telefono||'')
    );

    // para cada token buscamos si está incluido
    for(const t of tokens){
      if(hay.includes(t)) return true;
    }
    return false;
  });

  // render de listas: dejamos como estaban (mostramos todas las tarjetas en las secciones) para no romper la UX
  renderLista(ALL.bienes, 'lista-lugares');
  renderLista(ALL.servicios, 'lista-servicios');

  // añadimos marcadores solo para los visibles (para que mapa represente la búsqueda)
  visibles.forEach(item=>{
    const lat = parseFloat(item.latitud);
    const lng = parseFloat(item.longitud);
    if(Number.isNaN(lat) || Number.isNaN(lng)) return;

    let iconFile = item.icono || (ALL.categorias[item.tipo] && ALL.categorias[item.tipo][item.categoria] && ALL.categorias[item.tipo][item.categoria].icono) || 'icon-default.jpeg';
    const isDest = !!item.destacado;
    const size = isDest ? 52 : 36;
    const marker = L.marker([lat,lng], { icon: iconoDe(iconFile, size) }).addTo(map);

    marker.on('click', ()=> {
      map.setView([lat,lng], isDest ? 16 : 15, { animate:true });
      mostrarBottomPanel(item);
    });

    markers.push(marker);
  });

  // si la búsqueda produce **exactamente 1** elemento visible, abrir su panel automáticamente
  if(currentSearch && visibles.length === 1){
    const sole = visibles[0];
    // centrar y abrir panel
    map.setView([parseFloat(sole.latitud), parseFloat(sole.longitud)], sole.destacado ? 16 : 15, { animate:true });
    mostrarBottomPanel(sole);
  }

  // si hay al menos un destacado visible, centramos ligeramente en el primero destacado
  const firstDest = visibles.find(v=>v.destacado);
  if(firstDest){
    map.setView([parseFloat(firstDest.latitud), parseFloat(firstDest.longitud)], 16);
  }
}

// -----------------------
// renderLista: igual que tenías (no cambiar para preservar UI)
// -----------------------
function renderLista(arr, id){
  const cont = document.getElementById(id);
  if(!cont) return;
  cont.innerHTML = arr.map(it=>{
    const destacadoClass = it.destacado ? 'destacado' : '';
    const img = it.imagenes?.[0] ? `<img src="data/${it.imagenes[0]}" alt="${it.nombre}">` : '';
    return `
      <div class="tarjeta ${destacadoClass}" data-nombre="${it.nombre}" data-categoria="${it.categoria}" data-tipo="${it.tipo}">
        ${img}
        <h3 style="margin:8px 0 6px;color:var(--azul-mediterraneo);">${it.nombre}${it.destacado ? ' ⭐' : ''}</h3>
        <div style="color:var(--muted);font-size:14px">${it.descripcion || it.direccion || ''}</div>
        <div style="margin-top:8px;">
          <button class="ver-btn filter-btn" data-n="${it.nombre}">Ver</button>
        </div>
      </div>
    `;
  }).join('');

  // attach Ver buttons (idéntico)
  cont.querySelectorAll('.ver-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const nombre = e.currentTarget.dataset.n;
      const target = [...ALL.bienes, ...ALL.servicios].find(x => x.nombre === nombre);
      if(!target) return;
      map.setView([parseFloat(target.latitud), parseFloat(target.longitud)], 16, { animate:true });
      mostrarBottomPanel(target);
    });
  });
}

// -----------------------
// bottom panel & banner (idénticos a tu versión)
// -----------------------
function mostrarBottomPanel(item){
  const img = item.imagenes?.[0] ? `data/${item.imagenes[0]}` : '';
  const telBtn = item.telefono ? `<a class="btn" href="https://wa.me/${item.telefono.replace('+','')}" target="_blank">WhatsApp</a>` : '';
  const bannerHtml = item.banner ? `<div style="margin-top:10px"><img src="data/${item.banner}" style="width:100%;max-height:140px;object-fit:cover;border-radius:8px;"></div>` : '';
  const destacadoStyle = item.destacado ? `<div style="float:right;color:gold;font-weight:800;margin-left:8px">DESTACADO</div>` : '';

  bpContent().innerHTML = `
    <div class="bp-top">
      ${img ? `<img src="${img}" alt="${item.nombre}">` : ''}
      <div class="bp-info">
        <div style="display:flex;align-items:center;gap:8px">
          <h3>${item.nombre}</h3>
          ${destacadoStyle}
        </div>
        <div style="color:var(--muted);margin-top:6px">${item.descripcion || item.direccion || ''}</div>
        <div style="margin-top:6px;color:#666;font-size:13px">📍 ${item.ubicacion || item.direccion || ''}</div>
        <div class="bp-actions">
          ${telBtn}
          <button class="btn" id="bp-dir-btn">Cómo llegar</button>
        </div>
      </div>
    </div>
    ${bannerHtml}
    ${item.promocion ? `<div style="margin-top:10px;color:#444;font-weight:600">${item.promocion}</div>` : ''}
  `;

  mostrarBannerSiTiene(item);

  setTimeout(()=>{
    const dirBtn = document.getElementById('bp-dir-btn');
    if(dirBtn){
      dirBtn.addEventListener('click', ()=> {
        map.setView([parseFloat(item.latitud), parseFloat(item.longitud)], 17);
      });
    }
  }, 120);

  bottomPanel().classList.add('open');
  bottomPanel().setAttribute('aria-hidden','false');
}

function ocultarBottomPanel(){
  bottomPanel().classList.remove('open');
  bottomPanel().setAttribute('aria-hidden','true');
}

function mostrarBannerSiTiene(item){
  const area = bannerArea();
  if(!area) return;
  if(item.banner){
    area.setAttribute('aria-hidden','false');
    area.innerHTML = `
      <div class="banner-card">
        <img src="data/${item.banner}" alt="${item.nombre} banner">
        <div class="banner-info">
          <h3>${item.nombre} ${item.destacado ? '⭐' : ''}</h3>
          <p>${item.promocion || ''}</p>
          <div class="banner-actions">
            ${item.telefono ? `<a class="filter-btn" href="https://wa.me/${item.telefono.replace('+','')}" target="_blank">WhatsApp</a>` : ''}
            <button id="banner-pos-btn" class="filter-btn">Ver ubicación</button>
          </div>
        </div>
      </div>
    `;
    const btn = document.getElementById('banner-pos-btn');
    if(btn) btn.addEventListener('click', ()=> map.setView([parseFloat(item.latitud), parseFloat(item.longitud)], 16));
  } else {
    area.setAttribute('aria-hidden','true');
    area.innerHTML = '';
  }
}

// -----------------------
// filtros (idéntico)
// -----------------------
function generarFiltros(){
  const container = filtersBox();
  container.innerHTML = '';
  const cats = new Set();
  Object.keys(ALL.categorias.servicios || {}).forEach(k=>cats.add(k));
  Object.keys(ALL.categorias.bienes || {}).forEach(k=>cats.add(k));

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

// -----------------------
// bind controls (idéntico salvo small fix para leyenda top pos)
// -----------------------
function bindControls(){
  // search
  const inp = searchInput();
  if(inp){
    inp.addEventListener('input', (e)=> {
      currentSearch = e.target.value.trim();
      renderizarTodo();
    });
  }

  // leyenda bar toggle
  const lb = leyendaBar();
  if(lb){
    lb.addEventListener('click', ()=>{
      leyendaDrawer().classList.toggle('open');
      document.body.classList.toggle('leyenda-open');
      // arreglito: si la leyenda abre, empujar un poco el logo para no chocarlo (solo visual, no altera archivo)
      const logo = document.querySelector('.logo-personal');
      if(logo){
        if(leyendaDrawer().classList.contains('open')){
          logo.style.right = '300px';
        } else {
          logo.style.right = '12px';
        }
      }
    });
  }

  // close bottom panel
  const bpCloseEl = bpClose();
  if(bpCloseEl) bpCloseEl.addEventListener('click', ocultarBottomPanel);

  // close panel when clicking outside (tap area)
  document.addEventListener('click', (e)=>{
    const bp = bottomPanel();
    if(!bp) return;
    if(bp.contains(e.target)) return;
    const ls = ['filters','search-input','leyenda-bar','leyenda-drawer'];
    if(ls.some(id => document.getElementById(id) && document.getElementById(id).contains(e.target))) return;
    ocultarBottomPanel();
  });
}

// -----------------------
// pintar leyenda (idéntico)
// -----------------------
function pintarLeyenda(){
  const caja = leyendaItems();
  if(!caja) return;
  caja.innerHTML = '';
  Object.keys(ALL.categorias.bienes || {}).forEach(k => {
    caja.innerHTML += `<div class="leyenda-item"><img src="data/${ALL.categorias.bienes[k].icono}" alt="${k}">${k}</div>`;
  });
  Object.keys(ALL.categorias.servicios || {}).forEach(k => {
    caja.innerHTML += `<div class="leyenda-item"><img src="data/${ALL.categorias.servicios[k].icono}" alt="${k}">${k}</div>`;
  });
}

// inicio
iniciar();
