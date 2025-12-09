// main.js - mapa, carga data, buscador, filtros, banner (opción B)
const map = L.map('map').setView([-4.219167, -79.258333], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ maxZoom: 19 }).addTo(map);

async function cargar(ruta){ const res = await fetch(ruta); return await res.json(); }
function iconoDe(ruta){ return L.icon({ iconUrl: `data/${ruta}`, iconSize:[36,36], iconAnchor:[18,36], popupAnchor:[0,-34] }); }

let ALL = { bienes: [], servicios: [], categorias: {} };
let markers = [];
let currentFilter = null;
let currentSearch = '';

async function iniciar(){
  ALL.bienes = await cargar('data/bienes.json');
  ALL.servicios = await cargar('data/servicios.json');
  ALL.categorias = await cargar('data/categorias.json');

  // render UI inicial
  generarFiltros();
  renderizarTodo();
  bindControls();
  pintarLeyenda();
}

function clearMarkers(){
  markers.forEach(m => map.removeLayer(m));
  markers = [];
}

function renderizarTodo(){
  const combined = [...ALL.bienes, ...ALL.servicios];
  // aplicar filtro + búsqueda
  const visibles = combined.filter(i => {
    // texto
    const text = (i.nombre + ' ' + (i.categoria||'') + ' ' + (i.descripcion||'')).toLowerCase();
    if(currentSearch && !text.includes(currentSearch.toLowerCase())) return false;
    // filtro por subcategoria exacta
    if(currentFilter && i.categoria !== currentFilter) return false;
    return true;
  });

  // limpiar marcadores y listas
  clearMarkers();
  renderLista(ALL.bienes, 'lista-lugares'); // listas completas (puedes cambiar para que muestren solo visibles si prefieres)
  renderLista(ALL.servicios, 'lista-servicios');

  // pintar marcadores visibles
  visibles.forEach(item => {
    // icono preferente: item.icono sino busco en categorias
    let iconFile = item.icono || (ALL.categorias[item.tipo] && ALL.categorias[item.tipo][item.categoria] && ALL.categorias[item.tipo][item.categoria].icono) || 'icon-default.jpeg';
    // si destacado -> icono más grande
    const isDest = !!item.destacado;
    const ic = L.icon({ iconUrl:`data/${iconFile}`, iconSize: isDest ? [52,52] : [36,36], iconAnchor: isDest ? [26,52] : [18,36], popupAnchor:[0, -40] });
    const m = L.marker([parseFloat(item.latitud), parseFloat(item.longitud)], { icon: ic }).addTo(map);
    m.bindPopup(crearPopup(item));
    m.on('click', () => {
      mostrarBannerSiTiene(item);
    });
    markers.push(m);
  });

  // si hay al menos un destacado visible, centramos ligeramente en el primero destacado
  const firstDest = visibles.find(v => v.destacado);
  if(firstDest){
    map.setView([parseFloat(firstDest.latitud), parseFloat(firstDest.longitud)], 16);
  }
}

function renderLista(arr, id){
  const cont = document.getElementById(id);
  if(!cont) return;
  // si quieres mostrar solo los visibles en la lista reemplaza el filtro; por ahora mostramos todos (como antes)
  cont.innerHTML = arr.map(it => `
    <div class="tarjeta" data-nombre="${it.nombre}">
      ${it.imagenes?.[0] ? `<img src="data/${it.imagenes[0]}" alt="${it.nombre}">` : ''}
      <h3 style="margin:8px 0 6px;color:var(--azul-mediterraneo);">${it.nombre}${it.destacado ? ' ⭐' : ''}</h3>
      <div style="color:var(--muted);font-size:14px">${it.descripcion || it.direccion || ''}</div>
      <div style="margin-top:8px;">
        <button class="ver-btn" data-n="${it.nombre}">Ver</button>
      </div>
    </div>
  `).join('');

  // linkear botones "Ver" para centrar en mapa y abrir popup + mostrar banner
  cont.querySelectorAll('.ver-btn').forEach(btn => {
    btn.addEventListener('click', (e)=>{
      const nombre = e.currentTarget.dataset.n;
      const target = [...ALL.bienes, ...ALL.servicios].find(x => x.nombre === nombre);
      if(target){
        map.setView([parseFloat(target.latitud), parseFloat(target.longitud)], 16, { animate:true });
        // abrir popup del marker correspondiente
        const mk = markers.find(mk => {
          const latlng = mk.getLatLng();
          return Math.abs(latlng.lat - parseFloat(target.latitud)) < 0.00001 && Math.abs(latlng.lng - parseFloat(target.longitud)) < 0.00001;
        });
        if(mk) mk.openPopup();
        mostrarBannerSiTiene(target);
      }
    });
  });
}

function crearPopup(item){
  const img = item.imagenes?.length ? `<img src="data/${item.imagenes[0]}" style="width:100%;height:110px;object-fit:cover;border-radius:6px;margin-bottom:8px;">` : '';
  const tel = item.telefono ? `<p style="margin-top:6px"><strong>Tel:</strong> ${item.telefono}</p>` : '';
  const destacadoStyle = item.destacado ? `border:2px solid gold;padding:6px;border-radius:8px;` : '';
  return `<div style="width:220px;font-family:Inter, sans-serif;${destacadoStyle}">
    ${img}
    <div style="font-weight:700;color:var(--verde-principal);margin-bottom:4px">${item.nombre}</div>
    <div style="font-size:13px;color:#444">${item.descripcion || item.direccion || ''}</div>
    <div style="font-size:12px;color:#666;margin-top:6px">📍 ${item.ubicacion || item.direccion || ''}</div>
    ${tel}
  </div>`;
}

// BANNER (opción B): aparece abajo del mapa si el item tiene banner
function mostrarBannerSiTiene(item){
  const area = document.getElementById('banner-area');
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
    // boton ver ubicación
    const btn = document.getElementById('banner-pos-btn');
    if(btn){
      btn.addEventListener('click', ()=>{
        map.setView([parseFloat(item.latitud), parseFloat(item.longitud)], 16);
      });
    }
  } else {
    area.setAttribute('aria-hidden','true');
    area.innerHTML = '';
  }
}

// FILTROS: generar botones desde categories
function generarFiltros(){
  const container = document.getElementById('filters');
  container.innerHTML = '';
  // tomamos subcategorías desde categorias.servicios (mostramos servicios + bienes)
  const cats = new Set();
  Object.keys(ALL.categorias.servicios || {}).forEach(k => cats.add(k));
  Object.keys(ALL.categorias.bienes || {}).forEach(k => cats.add(k));
  // añadir botón "Todos"
  const btnAll = document.createElement('button'); btnAll.className='filter-btn active'; btnAll.textContent='Todos';
  btnAll.addEventListener('click', ()=>{ currentFilter = null; document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active')); btnAll.classList.add('active'); renderizarTodo(); });
  container.appendChild(btnAll);

  cats.forEach(cat => {
    const b = document.createElement('button');
    b.className = 'filter-btn';
    b.textContent = cat;
    b.addEventListener('click', ()=>{
      // activar este filtro
      document.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      currentFilter = cat;
      renderizarTodo();
    });
    container.appendChild(b);
  });
}

// SEARCH
function bindControls(){
  const input = document.getElementById('search-input');
  input.addEventListener('input', (e)=>{
    currentSearch = e.target.value.trim();
    renderizarTodo();
  });

  // leyenda bar
  const bar = document.getElementById('leyenda-bar');
  const drawer = document.getElementById('leyenda-drawer');
  bar.addEventListener('click', ()=> drawer.classList.toggle('open'));
  // click fuera para cerrar
  document.addEventListener('click', (e)=>{
    if(drawer.contains(e.target) || bar.contains(e.target)) return;
    drawer.classList.remove('open');
  });
}

// PINTAR LEYENDA
function pintarLeyenda(){
  const caja = document.getElementById('leyenda-items');
  if(!caja) return;
  caja.innerHTML = '';
  Object.keys(ALL.categorias.bienes || {}).forEach(k => {
    caja.innerHTML += `<div class="leyenda-item"><img src="data/${ALL.categorias.bienes[k].icono}" alt="${k}">${k}</div>`;
  });
  Object.keys(ALL.categorias.servicios || {}).forEach(k => {
    caja.innerHTML += `<div class="leyenda-item"><img src="data/${ALL.categorias.servicios[k].icono}" alt="${k}">${k}</div>`;
  });
}

iniciar();
