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

    // Estilo dorado para negocios premium
    const bordePremium = item.premium
        ? "3px solid gold"
        : "1px solid #ccc";

    const tituloPremium = item.premium
        ? "color:#d4a017; font-weight:bold;"
        : "color:#2e7d32;";

    const fondoPremium = item.premium
        ? "background: #fff8dc;"
        : "background: #ffffff;";

    const sombraPremium = item.premium
        ? "box-shadow: 0 0 10px gold;"
        : "box-shadow: 0 0 6px rgba(0,0,0,0.2);";

    return `
        <div style="
            width: 220px;
            padding: 10px;
            border-radius: 10px;
            border: ${bordePremium};
            ${fondoPremium}
            ${sombraPremium}
            font-family: sans-serif;
        ">
            <img src="${primeraImagen}" 
                style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px;">

            <h3 style="margin: 8px 0 4px; font-size: 18px; ${tituloPremium}">
                ${item.nombre}
            </h3>

            <p style="margin: 0; font-size: 14px; color:#444;">
                ${item.descripcion}
            </p>

            <p style="margin-top: 8px; font-size: 13px; color:#666;">
                📍 ${item.ubicacion || item.direccion || "Malacatos"}
            </p>

            ${item.telefono ? `
                <p style="margin-top: 6px; font-size: 14px;">
                    📞 <a href="https://wa.me/${item.telefono.replace('+','')}" target="_blank">
                        WhatsApp
                    </a>
                </p>
            ` : ""}
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
