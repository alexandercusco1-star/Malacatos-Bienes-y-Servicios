const map = L.map('map').setView([-4.219167, -79.258333], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let ALL = { bienes: [], servicios: [], categorias: {} };
let markers = [];
let currentGallery = [];
let galleryIndex = 0;

async function cargar(r){ const res = await fetch(r); return res.json(); }

function iconoDe(ruta){
  return L.icon({ iconUrl: 'data/' + ruta, iconSize:[28,28], iconAnchor:[14,28] });
}

async function iniciar(){
  const [b,s,c] = await Promise.all([
    cargar('data/bienes.json'),
    cargar('data/servicios.json'),
    cargar('data/categorias.json')
  ]);
  ALL.bienes = b;
  ALL.servicios = s;
  ALL.categorias = c;

  generarFiltros();
  renderizar();
  pintarLeyenda();
  controles();
}

function renderizar(){
  markers.forEach(m=>map.removeLayer(m));
  markers=[];

  [...ALL.bienes, ...ALL.servicios].forEach(item=>{
    if(isNaN(item.latitud)||isNaN(item.longitud)) return;
    const icono = item.icono || ALL.categorias[item.categoria]?.icono;
    const marker = L.marker([item.latitud,item.longitud],{icon:iconoDe(icono)}).addTo(map);
    marker.on('click',()=>mostrarDetalle(item));
    markers.push(marker);
  });
}

function mostrarDetalle(item){
  const panel=document.getElementById('bottom-panel');
  const cont=document.getElementById('bp-content');
  cont.innerHTML=`<h3>${item.nombre}</h3><p>${item.descripcion||''}</p>` +
    (item.imagenes||[]).map(i=>`<img src="data/${i}" class="bp-img">`).join('');
  panel.classList.add('open');
}

function generarFiltros(){
  const box=document.getElementById('filters');
  Object.keys(ALL.categorias).forEach(cat=>{
    const b=document.createElement('button');
    b.textContent=cat;
    b.onclick=()=>renderizar();
    box.appendChild(b);
  });
}

function pintarLeyenda(){
  const cont=document.getElementById('leyenda-items');
  Object.entries(ALL.categorias).forEach(([k,v])=>{
    cont.innerHTML+=`<div class="leyenda-item"><img src="data/${v.icono}">${k}</div>`;
  });
}

function controles(){
  document.getElementById('bp-close').onclick=()=>
    document.getElementById('bottom-panel').classList.remove('open');

  document.getElementById('leyenda-bar').onclick=()=>
    document.getElementById('leyenda-drawer').classList.toggle('open');

  document.getElementById('lb-close').onclick=()=>
    document.getElementById('lightbox').classList.remove('open');
}

iniciar();
