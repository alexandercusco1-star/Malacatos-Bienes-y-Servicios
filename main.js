const map = L.map("map").setView([-4.219167, -79.258333], 15);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19
}).addTo(map);

async function cargar(ruta) {
  const r = await fetch(ruta);
  return await r.json();
}

function iconoDe(ruta) {
  return L.icon({
    iconUrl: `data/${ruta}`,
    iconSize: [28, 28],
    iconAnchor: [14, 28]
  });
}

let ALL = { bienes: [], servicios: [], categorias: {} };
let markers = [];
let editMode = false;

async function iniciar() {
  ALL.bienes = await cargar("data/bienes.json");
  ALL.servicios = await cargar("data/servicios.json");
  ALL.categorias = await cargar("data/categorias.json");

  generarFiltros();
  pintarLeyenda();
  renderizarTodo();
}

iniciar();

function renderizarTodo() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  [...ALL.bienes, ...ALL.servicios].forEach(item => {
    if (!item.latitud || !item.longitud) return;

    const icono =
      item.icono ||
      ALL.categorias[item.categoria]?.icono ||
      "icon-default.jpeg";

    const marker = L.marker([item.latitud, item.longitud], {
      icon: iconoDe(icono),
      draggable: editMode
    }).addTo(map);

    marker.on("click", () => mostrarDetalle(item));

    marker.on("dragend", e => {
      const p = e.target.getLatLng();
      alert(`Lat: ${p.lat}\nLng: ${p.lng}`);
    });

    markers.push(marker);
  });
}

function mostrarDetalle(item) {
  const panel = document.getElementById("bottom-panel");
  const cont = document.getElementById("bp-content");

  let galeria = "";
  if (item.imagenes) {
    galeria = item.imagenes.map(i => `<img src="data/${i}">`).join("");
  }

  cont.innerHTML = `
    <h3>${item.nombre}</h3>
    <p>${item.descripcion || ""}</p>
    <p>${item.direccion || ""}</p>
    <div class="bp-galeria">${galeria}</div>
  `;

  panel.classList.add("open");
}

document.getElementById("bp-close").onclick = () => {
  document.getElementById("bottom-panel").classList.remove("open");
};

function pintarLeyenda() {
  const cont = document.getElementById("leyenda-items");
  cont.innerHTML = "";

  Object.entries(ALL.categorias).forEach(([k, v]) => {
    cont.innerHTML += `
      <div class="leyenda-item">
        <img src="data/${v.icono}">
        ${k}
      </div>
    `;
  });
}

document.getElementById("leyenda-bar").onclick = () => {
  document.getElementById("leyenda-drawer").classList.toggle("open");
};

document.getElementById("btn-edit").onclick = () => {
  editMode = !editMode;
  alert(editMode ? "Modo edición ACTIVADO" : "Modo edición DESACTIVADO");
  renderizarTodo();
};

function generarFiltros() {
  const f = document.getElementById("filters");
  f.innerHTML = "";

  Object.keys(ALL.categorias).forEach(c => {
    const b = document.createElement("button");
    b.textContent = c;
    b.onclick = () => {
      markers.forEach(m => map.removeLayer(m));
      markers = [];
      [...ALL.bienes, ...ALL.servicios]
        .filter(i => i.categoria === c)
        .forEach(i => {
          const m = L.marker([i.latitud, i.longitud], {
            icon: iconoDe(i.icono || ALL.categorias[c].icono)
          }).addTo(map);
          m.on("click", () => mostrarDetalle(i));
          markers.push(m);
        });
    };
    f.appendChild(b);
  });
    }
