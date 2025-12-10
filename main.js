// map
const map = L.map('map').setView([-4.219167, -79.258333], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// data
let bienes = [];
let servicios = [];
let categorias = {};
let searchValue = '';

// load
async function load(){
  bienes = await (await fetch("data/bienes.json")).json();
  servicios = await (await fetch("data/servicios.json")).json();
  categorias = await (await fetch("data/categorias.json")).json();

  drawLegend();
  drawDestacados();
  loadMarkers();
  setupEvents();
}

function icono(ruta){
  return L.icon({
    iconUrl: "data/" + ruta,
    iconSize:[38,38]
  });
}

function loadMarkers(){
  [...bienes, ...servicios].forEach(item=>{
    if(item.destacado === true){
      L.marker([item.latitud, item.longitud],{
        icon:icono(item.icono)
      }).addTo(map).bindPopup(item.nombre);
    }
  });
}

function drawLegend(){
  const box = document.getElementById("leyenda-items");
  box.innerHTML = "";
  Object.keys(categorias.bienes).forEach(k=>{
    box.innerHTML += `<div class="leyenda-item"><img src="data/${categorias.bienes[k].icono}">${k}</div>`;
  });
  Object.keys(categorias.servicios).forEach(k=>{
    box.innerHTML += `<div class="leyenda-item"><img src="data/${categorias.servicios[k].icono}">${k}</div>`;
  });
}

function drawDestacados(){
  const cont = document.getElementById("destacados");
  cont.innerHTML = "";

  const d1 = bienes.find(x=>x.destacado===true);
  const d2 = servicios.find(x=>x.destacado===true);

  if(d1){
    cont.innerHTML += cardHtml(d1);
  }
  if(d2){
    cont.innerHTML += cardHtml(d2);
  }
}

function cardHtml(item){
  return `
  <div class="card">
    <img src="data/${item.imagenes[0]}">
    <h3>${item.nombre}</h3>
    <p>${item.descripcion || item.direccion}</p>
  </div>`;
}

function setupEvents(){
  document.getElementById("btn-ver-todos").addEventListener("click",()=>{
    window.location.href="ver-todos.html";
  });

  document.getElementById("leyenda-bar").addEventListener("click",()=>{
    document.getElementById("leyenda-drawer").classList.toggle("open");
  });

  document.getElementById("search-input").addEventListener("input",(e)=>{
    searchValue = e.target.value.toLowerCase();
    searchPlace();
  });
}

function searchPlace(){
  const all = [...bienes, ...servicios];
  const found = all.find(x=>x.nombre.toLowerCase().includes(searchValue));
  if(!found) return;
  map.setView([found.latitud, found.longitud], 17);
}

load();
