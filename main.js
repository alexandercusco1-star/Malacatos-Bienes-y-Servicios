// CARGA DE MAPA E ICONOS
let map = L.map('map').setView([-4.219167, -79.258333], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

// Cargar JSON
async function cargarDatos() {
  const bienes = await fetch("data/bienes.json").then(r => r.json());
  const servicios = await fetch("data/servicios.json").then(r => r.json());
  const categorias = await fetch("data/categorias.json").then(r => r.json());

  llenarLeyenda(categorias);

  colocarMarcadores(bienes);
  colocarMarcadores(servicios);
}

function crearIcono(ruta) {
  return L.icon({
    iconUrl: "data/" + ruta,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28]
  });
}

function colocarMarcadores(lista){
  lista.forEach(item => {
    let icono = crearIcono(item.icono);

    let popup = `
      <b>${item.nombre}</b><br>
      <small>${item.descripcion || item.ubicacion}</small><br><br>
      ${item.imagenes.map(img => `<img src="data/${img}" class="popup-img">`).join("")}
    `;

    L.marker([item.latitud, item.longitud], {icon: icono})
      .addTo(map)
      .bindPopup(popup);
  });
}

function llenarLeyenda(cat){
  let box = document.getElementById("leyenda-items");
  box.innerHTML = "";
  
  Object.keys(cat.bienes).forEach(c => {
    box.innerHTML += `
      <div class="leyenda-item">
        <img src="data/${cat.bienes[c].icono}" class="leyenda-icon">
        <span>${c}</span>
      </div>`;
  });

  Object.keys(cat.servicios).forEach(c => {
    box.innerHTML += `
      <div class="leyenda-item">
        <img src="data/${cat.servicios[c].icono}" class="leyenda-icon">
        <span>${c}</span>
      </div>`;
  });
}

cargarDatos();
