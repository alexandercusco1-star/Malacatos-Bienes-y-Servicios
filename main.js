// main.js - versión final compatible con tu estructura de data/ y imágenes
// Carga bienes.json, servicios.json, categorias.json desde data/

let bienes = [], servicios = [], categorias = {};
let mapa = null, marcadores = [];
const ICONS_PATH = 'data/'; // los iconos se llaman tal como "icon-casa.jpeg" dentro de data/

// ---------- util cargar JSON ----------
async function fetchJson(url){
  const res = await fetch(url, {cache: "no-store"});
  if(!res.ok) throw new Error('Error cargando ' + url);
  return await res.json();
}

// ---------- iniciar todo ----------
async function iniciar(){
  try{
    bienes = await fetchJson('data/bienes.json');
    servicios = await fetchJson('data/servicios.json');
    // categorias.json puede no existir; intentar pero no fallar
    try { categorias = await fetchJson('data/categorias.json'); } catch(e){ categorias = { bienes:{}, servicios:{} }; }

    crearMapa();
    generarSubcategorias();      // crea los botones arriba
    renderizarDestacados();      // muestra destacados en la pagina principal
    pintarLeyenda();             // llena leyenda lateral
    cargarMarcadoresDestacados();// pone marcadores de los destacados en el mapa
    configurarBuscador();        // buscador funcional
    configurarUI();              // botones y panel
  }catch(err){
    console.error(err);
  }
}

// ---------- crear mapa ----------
function crearMapa(){
  if(mapa) return;
  mapa = L.map('map', {preferCanvas:true}).setView([-4.219167, -79.258333], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ maxZoom: 19 }).addTo(mapa);
}

// ---------- icon helper ----------
function crearIcono(file, size=40){
  return L.icon({
    iconUrl: ICONS_PATH + file,
    iconSize: [size,size],
    iconAnchor: [Math.round(size/2), size],
    popupAnchor: [0, -size + 6]
  });
}

// ---------- limpiar marcadores ----------
function limpiarMarcadores(){ marcadores.forEach(m=>mapa.removeLayer(m)); marcadores = []; }

// ---------- cargar marcadores (solo elementos pasados) ----------
function cargarMarcadores(lista){
  limpiarMarcadores();
  lista.forEach(item=>{
    const lat = parseFloat(item.latitud);
    const lng = parseFloat(item.longitud);
    if(Number.isNaN(lat) || Number.isNaN(lng)) return;

    const iconFile = item.icono || (categorias[item.tipo] && categorias[item.tipo][item.categoria] && categorias[item.tipo][item.categoria].icono) || 'icon-default.jpeg';
    const size = item.destacado ? 52 : 36;
    const marker = L.marker([lat,lng], { icon: crearIcono(iconFile, size) }).addTo(mapa);
    marker.on('click', ()=>openBottomPanel(item));
    marcadores.push(marker);
  });
}

// ---------- cargar marcadores solo de destacados ----------
function cargarMarcadoresDestacados(){ 
  const destacados = [...bienes, ...servicios].filter(i=>i.destacado);
  cargarMarcadores(destacados);
}

// ---------- generar subcategorias (botones arriba) ----------
function generarSubcategorias(){
  const cont = document.getElementById('filters');
  if(!cont) return;
  cont.innerHTML = '';

  // juntar categorías de bienes y servicios
  const catB = bienes.map(b=>b.categoria||'').filter(Boolean);
  const catS = servicios.map(s=>s.categoria||'').filter(Boolean);
  const todas = [...catB, ...catS];
  const unicas = Array.from(new Set(todas));

  // botón 'Todos'
  const btnAll = document.createElement('button');
  btnAll.className = 'filter-btn active';
  btnAll.textContent = 'Todos';
  btnAll.addEventListener('click', ()=>{
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btnAll.classList.add('active');
    cargarMarcadoresDestacados();
    renderizarDestacados();
  });
  cont.appendChild(btnAll);

  unicas.forEach(cat=>{
    const b = document.createElement('button');
    b.className = 'filter-btn';
    b.textContent = cat;
    b.addEventListener('click', ()=>{
      document.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      // filtrar: mostrar marcadores de items cuya categoria == cat (incluye bienes y servicios)
      const filtrados = [...bienes, ...servicios].filter(it => (it.categoria||'').toLowerCase() === cat.toLowerCase());
      cargarMarcadores(filtrados);
      // mostrar en destacados columnas solo los filtrados que sean destacados (si quieres ver no destacados, usa ver-todos)
      document.getElementById('dest-bienes').innerHTML = '<h3>Bienes</h3>';
      document.getElementById('dest-servicios').innerHTML = '<h3>Servicios</h3>';
      filtrados.filter(x=>x.destacado).forEach(it=>{
        if(it.tipo && it.tipo.toLowerCase().includes('bienes')) appendCard('dest-bienes', it);
        else if(it.tipo && it.tipo.toLowerCase().includes('servicios')) appendCard('dest-servicios', it);
        else {
          // decide por si no tiene tipo: usar categoria para determinar columna
          if(bienes.find(b=>b.nombre===it.nombre)) appendCard('dest-bienes', it); else appendCard('dest-servicios', it);
        }
      });
    });
    cont.appendChild(b);
  });
}

// ---------- renderizar destacados en página principal ----------
function renderizarDestacados(){
  document.getElementById('dest-bienes').innerHTML = '<h3>Bienes</h3>';
  document.getElementById('dest-servicios').innerHTML = '<h3>Servicios</h3>';

  const bDest = bienes.filter(b=>b.destacado);
  const sDest = servicios.filter(s=>s.destacado);

  bDest.forEach(b=> appendCard('dest-bienes', b));
  sDest.forEach(s=> appendCard('dest-servicios', s));
}

function appendCard(containerId, item){
  const cont = document.getElementById(containerId);
  if(!cont) return;
  const div = document.createElement('div');
  div.className = 'card';
  const img = item.imagenes && item.imagenes.length ? `<img src="data/${item.imagenes[0]}" alt="${item.nombre}">` : '';
  div.innerHTML = `${img}<h4>${item.nombre}${item.destacado? ' ⭐' : ''}</h4><p style="color:var(--muted)">${item.descripcion || item.direccion || ''}</p><button class="card-ver" data-n="${item.nombre}">Ver</button>`;
  cont.appendChild(div);

  div.querySelector('.card-ver').addEventListener('click', ()=>{
    openBottomPanel(item);
    mapa.setView([parseFloat(item.latitud), parseFloat(item.longitud)], 16);
  });
}

// ---------- leyenda lateral ----------
function pintarLeyenda(){
  const caja = document.getElementById('leyenda-items');
  if(!caja) return;
  caja.innerHTML = '';

  // bienes
  if(categorias.bienes){
    Object.keys(categorias.bienes).forEach(k=>{
      const ico = categorias.bienes[k].icono;
      caja.innerHTML += `<div class="leyenda-item"><img src="data/${ico}" alt="${k}">${k}</div>`;
    });
  }
  // servicios
  if(categorias.servicios){
    Object.keys(categorias.servicios).forEach(k=>{
      const ico = categorias.servicios[k].icono;
      caja.innerHTML += `<div class="leyenda-item"><img src="data/${ico}" alt="${k}">${k}</div>`;
    });
  }
}

// ---------- buscador ----------
function configurarBuscador(){
  const input = document.getElementById('search-input');
  input.addEventListener('input', ()=>{
    const q = input.value.trim().toLowerCase();
    if(!q){
      cargarMarcadoresDestacados();
      renderizarDestacados();
      return;
    }
    const all = [...bienes, ...servicios];
    // buscar por nombre, categoria o descripcion
    const found = all.filter(i=>{
      const text = (i.nombre + ' ' + (i.categoria||'') + ' ' + (i.descripcion||'')).toLowerCase();
      return text.includes(q);
    });

    if(found.length){
      cargarMarcadores(found);
      // centrar en el primero encontrado
      const f = found[0];
      if(f.latitud && f.longitud) mapa.setView([parseFloat(f.latitud), parseFloat(f.longitud)], 16);
    } else {
      // si no encuentra nada, dejar los destacados
      cargarMarcadoresDestacados();
    }
  });
}

// ---------- UI: botones, leyenda, ver-todos ----------
function configurarUI(){
  // leyenda toggle
  document.getElementById('leyenda-bar').addEventListener('click', ()=>{
    const d = document.getElementById('leyenda-drawer');
    d.classList.toggle('open');
    d.setAttribute('aria-hidden', d.classList.contains('open') ? 'false' : 'true');
  });

  // ver todos
  document.getElementById('btn-ver-todos').addEventListener('click', ()=>{
    window.open('ver-todos.html', '_blank');
  });

  // close bottom panel
  document.getElementById('bp-close').addEventListener('click', ()=>closeBottomPanel());
}

// ---------- bottom panel ----------
function openBottomPanel(item){
  const panel = document.getElementById('bottom-panel');
  const content = document.getElementById('bp-content');
  const img = item.imagenes && item.imagenes.length ? `<img src="data/${item.imagenes[0]}" alt="${item.nombre}">` : '';
  const tel = item.telefono ? `<p>📞 ${item.telefono}</p>` : '';
  content.innerHTML = `${img}<h3>${item.nombre}${item.destacado? ' ⭐' : ''}</h3><p>${item.descripcion || item.direccion || ''}</p>${tel}<p style="color:var(--muted)">📍 ${item.ubicacion || item.direccion || ''}</p>`;
  panel.classList.add('open');
  panel.setAttribute('aria-hidden','false');
}
function closeBottomPanel(){
  const panel = document.getElementById('bottom-panel');
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden','true');
}

// ---------- iniciar ----------
iniciar();
