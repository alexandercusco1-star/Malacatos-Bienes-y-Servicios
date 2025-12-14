// ======================================================= // MALACATOS — MAIN.JS BASE ESTABLE (CIMIENTO) // =======================================================

// ------------------------------------------------------- // MAPA // ------------------------------------------------------- const map = L.map('map').setView([-4.219167, -79.258333], 15); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

// ------------------------------------------------------- // HELPERS // ------------------------------------------------------- async function cargar(ruta) { const r = await fetch(ruta); return await r.json(); }

function iconoDe(ruta, size = 28) { return L.icon({ iconUrl: data/${ruta}, iconSize: [size, size], iconAnchor: [size / 2, size], popupAnchor: [0, -size + 6] }); }

// ------------------------------------------------------- // ESTADO // ------------------------------------------------------- let ALL = { bienes: [], servicios: [], categorias: {} }; let markers = []; let currentFilter = null; let currentSearch = '';

// Galería let currentGallery = []; let galleryIndex = 0;

// ------------------------------------------------------- // INICIO // ------------------------------------------------------- async function iniciar() { const [bienes, servicios, categorias] = await Promise.all([ cargar('data/bienes.json'), cargar('data/servicios.json'), cargar('data/categorias.json') ]);

ALL.bienes = bienes; ALL.servicios = servicios; ALL.categorias = categorias;

generarFiltros(); renderizarTodo(); pintarLeyenda(); bindControls(); }

iniciar();

// ------------------------------------------------------- // MAPA / MARKERS // ------------------------------------------------------- function clearMarkers() { markers.forEach(m => map.removeLayer(m)); markers = []; }

function renderizarTodo() { clearMarkers();

const todos = [...ALL.bienes, ...ALL.servicios];

const visibles = todos.filter(i => { const t = ${i.nombre} ${i.categoria} ${i.descripcion || ''}.toLowerCase(); if (currentSearch && !t.includes(currentSearch.toLowerCase())) return false; if (currentFilter && i.categoria !== currentFilter) return false; return true; });

visibles.forEach(item => { if (isNaN(item.latitud) || isNaN(item.longitud)) return;

const iconFile = item.icono || ALL.categorias[item.categoria]?.icono || 'icon-default.jpeg';

const marker = L.marker([item.latitud, item.longitud], {
  icon: iconoDe(iconFile)
}).addTo(map);

marker.on('click', () => mostrarDetalle(item));
markers.push(marker);

});

renderDestacados(todos.filter(x => x.destacado === true)); }

// ------------------------------------------------------- // DESTACADOS // ------------------------------------------------------- function renderDestacados(arr) { const cont = document.getElementById('destacados-contenedor'); if (!cont) return;

cont.innerHTML = '';

arr.forEach(it => { const img = it.imagenes?.[0] ? data/${it.imagenes[0]} : ''; cont.innerHTML += <div class="tarjeta"> ${img ?<img src="${img}">: ''} <h3>${it.nombre} ⭐</h3> <p>${it.descripcion || ''}</p> <button onclick="mostrarGaleria('${it.nombre.replace(/'/g, "\\'")}')">Ver</button> </div>; }); }

// ------------------------------------------------------- // PANEL INFERIOR (DETALLE) // ------------------------------------------------------- function mostrarDetalle(item) { const panel = document.getElementById('bottom-panel'); const cont = document.getElementById('bp-content'); if (!panel || !cont) return;

let galeriaHTML = ''; if (Array.isArray(item.imagenes)) { galeriaHTML = item.imagenes .map(img => <img src="data/${img}" class="bp-img">) .join(''); }

cont.innerHTML = <h3>${item.nombre}</h3> <p>${item.descripcion || ''}</p> <p>${item.direccion || item.ubicacion || ''}</p> <div class="bp-galeria">${galeriaHTML}</div>;

panel.classList.add('open'); }

// ------------------------------------------------------- // GALERÍA (LIGHTBOX) // ------------------------------------------------------- function mostrarGaleria(nombre) { const item = [...ALL.bienes, ...ALL.servicios].find(x => x.nombre === nombre); if (!item || !item.imagenes || !item.imagenes.length) return;

currentGallery = item.imagenes; galleryIndex = 0;

const lb = document.getElementById('lightbox'); const img = document.getElementById('lb-img'); if (!lb || !img) return;

img.src = 'data/' + currentGallery[0]; lb.classList.add('open'); }

function cambiarImg(dir) { if (!currentGallery.length) return; galleryIndex += dir; if (galleryIndex < 0) galleryIndex = currentGallery.length - 1; if (galleryIndex >= currentGallery.length) galleryIndex = 0; document.getElementById('lb-img').src = 'data/' + currentGallery[galleryIndex]; }

// ------------------------------------------------------- // LEYENDA // ------------------------------------------------------- function pintarLeyenda() { const cont = document.getElementById('leyenda-items'); if (!cont) return;

cont.innerHTML = '';

Object.entries(ALL.categorias).forEach(([cat, data]) => { cont.innerHTML += <div class="leyenda-item"> <img src="data/${data.icono}"> ${cat} </div>; }); }

// ------------------------------------------------------- // FILTROS // ------------------------------------------------------- function generarFiltros() { const box = document.getElementById('filters'); if (!box) return;

box.innerHTML = '';

const btnAll = document.createElement('button'); btnAll.textContent = 'Todos'; btnAll.onclick = () => { currentFilter = null; renderizarTodo(); }; box.appendChild(btnAll);

Object.keys(ALL.categorias).forEach(cat => { const b = document.createElement('button'); b.textContent = cat; b.onclick = () => { currentFilter = cat; renderizarTodo(); }; box.appendChild(b); }); }

// ------------------------------------------------------- // CONTROLES // ------------------------------------------------------- function bindControls() { const search = document.getElementById('search-input'); if (search) { search.addEventListener('input', e => { currentSearch = e.target.value; renderizarTodo(); }); }

// Leyenda const bar = document.getElementById('leyenda-bar'); const drawer = document.getElementById('leyenda-drawer'); if (bar && drawer) { bar.onclick = () => drawer.classList.toggle('open'); }

// Cerrar panel inferior const bpClose = document.getElementById('bp-close'); if (bpClose) { bpClose.onclick = () => document.getElementById('bottom-panel').classList.remove('open'); }

// Cerrar lightbox const lbClose = document.getElementById('lb-close'); if (lbClose) { lbClose.onclick = () => document.getElementById('lightbox').classList.remove('open'); }

const lbPrev = document.getElementById('lb-prev'); const lbNext = document.getElementById('lb-next'); if (lbPrev) lbPrev.onclick = () => cambiarImg(-1); if (lbNext) lbNext.onclick = () => cambiarImg(1);

// RESET DESACTIVADO (NO HACE NADA) const resetBtn = document.getElementById('btn-reset-server'); if (resetBtn) { resetBtn.onclick = () => false; resetBtn.style.pointerEvents = 'none'; resetBtn.style.opacity = '0.4'; } }
