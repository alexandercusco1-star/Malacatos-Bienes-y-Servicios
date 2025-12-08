// ===============================
//   MAPA LEAFLET
// ===============================

let map = L.map('map').setView([-4.219167, -79.258333], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
}).addTo(map);


// ===============================
//   FUNCIÓN POPUP BONITO
// ===============================

function crearPopup(item) {
    const primeraImagen = item.imagenes && item.imagenes.length > 0
        ? `data/${item.imagenes[0]}`
        : "data/no-image.jpg";

    return `
        <div style="
            width: 180px;
            font-family: sans-serif;
        ">
            <img src="${primeraImagen}" 
                 style="width: 100%; height: 100px; object-fit: cover; border-radius: 6px;">

            <h3 style="margin: 6px 0 4px; font-size: 17px; color:#2e7d32;">
                ${item.nombre}
            </h3>

            <p style="margin: 0; font-size: 13px; color:#444;">
                ${item.descripcion}
            </p>

            <p style="margin: 6px 0 0; font-size: 12px; color:#777;">
                📍 ${item.ubicacion || item.direccion || "Malacatos"}
            </p>
        </div>
    `;
}


// ===============================
//   CARGAR ICONOS PERSONALIZADOS
// ===============================

function crearIcono(rutaIcono) {
    return L.icon({
        iconUrl: `data/${rutaIcono}`,
        iconSize: [38, 38],
        iconAnchor: [19, 37],
        popupAnchor: [0, -35]
    });
}


// ===============================
//   AGREGAR PUNTOS AL MAPA
// ===============================

function agregarMarcadores(lista) {
    lista.forEach(item => {
        const icono = crearIcono(item.icono);

        L.marker([item.latitud, item.longitud], { icon: icono })
            .addTo(map)
            .bindPopup(crearPopup(item));
    });
}


// ===============================
//   CARGA DATOS
// ===============================

async function cargarTodo() {
    const bienes = await fetch("data/bienes.json").then(r => r.json());
    const servicios = await fetch("data/servicios.json").then(r => r.json());

    agregarMarcadores(bienes);
    agregarMarcadores(servicios);
}

cargarTodo();
