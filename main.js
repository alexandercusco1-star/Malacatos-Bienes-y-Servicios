// =========================
//   CONFIG
// =========================

let map = L.map('map').setView([-4.219167, -79.258333], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

let markers = [];
let currentFilter = null;
let currentSearch = "";

const ALL = {
  bienes: [],
  servicios: [],
  categorias: {}
};

// =========================
//   UTILIDADES
// =========================

function iconoDe(filename, size = 36) {
  return L.icon({
    iconUrl: "data/" + filename,
    iconSize: [size, size],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
}

function normalizar(text){
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Sinónimos de búsqueda
const synonyms = {
  "barberia": ["peluqueria","peluquería","barber","corte","cabello"],
  "peluqueria": ["barberia","barber","corte"],
  "mecanica": ["taller","auto","vehiculo","carro"],
  "iglesia": ["templo","capilla","parroquia"],
  "restaurante": ["comida","almuerzo","cenar","venta comida"],
  "parque": ["area verde","jardin","zona verde"]
};

function expandirBusqueda(txt){
  const n = normalizar(txt);
  let palabras = [n];
  for(const k in synonyms){
    if(n.includes(k)) palabras = palabras.concat(synonyms[k]);
  }
  return palabras;
}

function clearMarkers(){
  markers.forEach(m => map.removeLayer(m));
  markers = [];
}

// =========================
//   CARGA DE ARCHIVOS JSON
// =========================

async function cargarJSON(path){
  const res = await fetch(path);
  return await res.json();
}

async function iniciar(){
  ALL.bienes = await cargarJSON("data/bienes.json");
  ALL.servicios = await cargarJSON("data/servicios.json");
  ALL.categorias = await cargarJSON("data/categorias.json");

  renderCategorias();
  renderizarTodo();
}

iniciar();

// =========================
//   RENDER CATEGORÍAS ARRIBA
// =========================

function renderCategorias(){
  const contCat = document.getElementById("categorias-container");
  contCat.innerHTML = "";

  const cats = ALL.categorias;

  for(const tipo in cats){
    for(const subcat in cats[tipo]){
      const info = cats[tipo][subcat];

      const div = document.createElement("div");
      div.className = "categoria-tag";
      div.dataset.categoria = subcat;
      div.innerHTML = `
        <img src="data/${info.icono}" class="cat-icon">
        <span>${subcat}</span>
      `;
      div.onclick = ()=>{
        if(currentFilter === subcat){
          currentFilter = null;
          div.classList.remove("active");
        } else {
          document.querySelectorAll(".categoria-tag").forEach(t=>t.classList.remove("active"));
          currentFilter = subcat;
          div.classList.add("active");
        }
        renderizarTodo();
      };
      contCat.appendChild(div);
    }
  }
}

// =========================
//   BUSCADOR
// =========================

document.getElementById("searchInput").addEventListener("input", e=>{
  currentSearch = e.target.value.trim();
  renderizarTodo();
});

// =========================
//   RENDER PRINCIPAL
// =========================

function renderizarTodo(){
  clearMarkers();

  const combined = [...ALL.bienes, ...ALL.servicios];
  const palabras = currentSearch ? expandirBusqueda(currentSearch) : [];

  const visibles = combined.filter(item=>{
    const texto = normalizar(
      (item.nombre || '') + ' ' +
      (item.categoria || '') + ' ' +
      (item.descripcion || '')
    );

    // FILTRO POR BUSCADOR
    if(currentSearch){
      let ok = false;
      for(const p of palabras){
        if(texto.includes(p)){
          ok = true;
          break;
        }
      }
      if(!ok) return false;
    }

    // FILTRO POR CATEGORÍA
    if(currentFilter && item.categoria !== currentFilter) return false;

    return true;
  });

  // Render de listas inferiores
  renderLista(ALL.bienes, "lista-lugares");
  renderLista(ALL.servicios, "lista-servicios");

  // Colocar marcadores
  visibles.forEach(item=>{
    const lat = parseFloat(item.latitud);
    const lng = parseFloat(item.longitud);
    if(Number.isNaN(lat) || Number.isNaN(lng)) return;

    let iconFile = item.icono ||
      (ALL.categorias[item.tipo] &&
        ALL.categorias[item.tipo][item.categoria] &&
        ALL.categorias[item.tipo][item.categoria].icono)
      || "icon-default.jpeg";

    const size = item.destacado ? 52 : 36;

    const marker = L.marker([lat,lng], { icon: iconoDe(iconFile, size) }).addTo(map);

    marker.on("click", ()=>{
      map.setView([lat,lng], 16, {animate:true});
      mostrarBottomPanel(item);
    });

    markers.push(marker);
  });
}

// =========================
//   TARJETAS ABAJO (bienes y servicios)
// =========================

function renderLista(lista, id){
  const cont = document.getElementById(id);
  cont.innerHTML = "";

  lista.forEach(item=>{
    const div = document.createElement("div");
    div.className = "item-card";

    div.innerHTML = `
      <img src="data/${item.imagenes[0]}" class="item-img">
      <div class="item-info">
        <h4>${item.nombre}</h4>
        <p>${item.categoria}</p>
        <button class="ver-btn">Ver</button>
      </div>
    `;

    div.querySelector(".ver-btn").onclick = ()=>{
      map.setView([item.latitud, item.longitud], 16, {animate:true});
      mostrarBottomPanel(item);
    };

    cont.appendChild(div);
  });
}

// =========================
//   POPUP INFERIOR (BOTTOM PANEL)
// =========================

function mostrarBottomPanel(item){
  const panel = document.getElementById("bottom-panel");
  const contenido = document.getElementById("bottom-content");

  contenido.innerHTML = `
    <h2>${item.nombre}</h2>
    <p><b>Categoría:</b> ${item.categoria}</p>
    <p>${item.descripcion || ''}</p>
    ${item.telefono ? `<p><b>Teléfono:</b> ${item.telefono}</p>` : ""}
    ${item.direccion ? `<p><b>Dirección:</b> ${item.direccion}</p>` : ""}
    <div class="popup-imgs">
      ${item.imagenes.map(img=>`<img src="data/${img}" class="popup-img">`).join("")}
    </div>
  `;

  panel.classList.add("show");
}

document.getElementById("bottom-close").onclick = ()=>{
  document.getElementById("bottom-panel").classList.remove("show");
};
