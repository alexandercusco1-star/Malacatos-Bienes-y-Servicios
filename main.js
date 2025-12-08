// main.js — Mapa + iconos + lectura de JSON

let mapa;
let capaBienes;
let capaServicios;

// Crear mapa
function iniciarMapa() {
    mapa = L.map("map").setView([-4.2191, -79.2583], 15);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap"
    }).addTo(mapa);

    capaBienes = L.layerGroup().addTo(mapa);
    capaServicios = L.layerGroup().addTo(mapa);
}

// Cargar JSON desde carpeta data
async function cargarJSON(ruta) {
    const res = await fetch(`data/${ruta}`);
    return res.json();
}

// Generar popups
function crearPopup(item) {
    let html = `
        <h3>${item.nombre}</h3>
        <p>${item.descripcion || ""}</p>
        <p><strong>Ubicación:</strong> ${item.ubicacion || item.direccion}</p>
        <p><strong>Categoría:</strong> ${item.categoria}</p>
    `;

    if (item.telefono) {
        html += `<p><strong>Teléfono:</strong> ${item.telefono}</p>`;
    }

    if (item.imagenes && item.imagenes.length > 0) {
        html += `<img src="data/${item.imagenes[0]}" class="popup-img">`;
    }

    return html;
}

// Cargar marcadores
function agregarMarcador(item, icono, capa) {
    const customIcon = L.icon({
        iconUrl: `data/${icono}`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });

    const marker = L.marker([item.latitud, item.longitud], { icon: customIcon })
        .bindPopup(crearPopup(item));

    marker.addTo(capa);
}

// Cargar leyenda
function cargarLeyenda(categorias) {
    const cont = document.getElementById("leyenda");
    cont.innerHTML = "<h4>Simbología</h4>";

    for (const tipo of Object.keys(categorias)) {
        const grupo = categorias[tipo];

        for (const sub of Object.keys(grupo)) {
            const icono = grupo[sub].icono;

            cont.innerHTML += `
                <div class="leyenda-item">
                    <img src="data/${icono}" class="leyenda-icon">
                    <span>${sub}</span>
                </div>
            `;
        }
    }
}

// Cargar todo
async function iniciarTodo() {
    iniciarMapa();

    const bienes = await cargarJSON("bienes.json");
    const servicios = await cargarJSON("servicios.json");
    const categorias = await cargarJSON("categorias.json");

    cargarLeyenda(categorias);

    // Bienes en el mapa
    bienes.forEach(item => {
        const icono = categorias.bienes[item.categoria]?.icono || "icono-default.png";
        agregarMarcador(item, icono, capaBienes);
    });

    // Servicios en el mapa
    servicios.forEach(item => {
        const icono = categorias.servicios[item.categoria]?.icono || "icono-default.png";
        agregarMarcador(item, icono, capaServicios);
    });
}

// Iniciar
document.addEventListener("DOMContentLoaded", iniciarTodo);
