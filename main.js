// ========== MAPA LEAFLET GRATIS ==========

let map = L.map('map').setView([-4.2005, -79.2150], 14);

// Capa de mapa GRATIS
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

// ================================================
//     ÍCONOS DE TODAS LAS SUBCATEGORÍAS (EMOJIS)
// ================================================
const ICONOS = {
    "Peluquería": "💇‍♀️",
    "Barbería": "💈",
    "Ferretería": "🔧",
    "Taller Mecánico": "🛠️",
    "Taller de Motos": "🏍️",
    "Restaurante": "🍽️",
    "Comida Rápida": "🌮",
    "Panadería": "🍞",
    "Farmacia": "💊",
    "Hospital / Salud": "🏥",
    "Hostal": "🏨",
    "Hotel": "🛏️",
    "Tienda": "🛍️",
    "Bazar": "👜",
    "Papelería": "📚",
    "Licorería": "🍾",
    "Llantera": "🛞",
    "Gasolinera": "⛽",
    "Gimnasio": "🏋️",
    "Artesanías": "🧵",
    "Parque": "🌳",
    "Terrenos": "🟩",
    "Iglesia": "⛪",
    "Escuela": "🏫",
    "Colegio": "📘",
    "Cancha Deportiva": "🏀",
    "Lavandería": "🧺",
    "Veterinaria": "🐾",
    "Frutería": "🍎",
    "Carnicería": "🥩",
    "Cyber / Internet": "💻",
    "Heladería": "🍦",
    "Abarrotes": "🛒",
    "Verdulería": "🥬",
    "Spa": "💆‍♀️",
    "Florería": "💐"
};

// ========== POPUP (DETALLE CON FOTOS) ==========

function crearPopup(item) {
    let fotos = "";

    if (item.fotos && item.fotos.length > 0) {
        fotos = item.fotos
            .map(f => `<img src="data/${f}" class="popup-img">`)
            .join("");
    }

    return `
        <div class="popup-title">${item.nombre}</div>
        <div>${item.descripcion}</div>
        <div><strong>Ubicación:</strong> ${item.ubicacion}</div>
        ${fotos}
    `;
}

// ========== AGREGAR MARCADORES ==========
function agregarMarcadores(lista) {
    lista.forEach(item => {
        let emoji = ICONOS[item.subcategoria] || "📍";

        let marcador = L.marker([item.lat, item.lng], {
            icon: L.divIcon({
                className: "emoji-marker",
                html: `<div style="font-size:30px">${emoji}</div>`
            })
        }).addTo(map);

        marcador.bindPopup(crearPopup(item));
    });
}

// ======================================================
//  DATOS DE EJEMPLO (LOS QUE TÚ ME DISTE) – PUEDES AÑADIR MÁS
// ======================================================

const LUGARES = [
    {
        nombre: "Parque Central de Malacatos",
        descripcion: "Parque público en el centro de Malacatos.",
        ubicacion: "Centro de Malacatos",
        subcategoria: "Parque",
        lat: -4.21917,
        lng: -79.25833,
        fotos: ["foto1.jpg"]
    }
];

const SERVICIOS = [
    {
        nombre: "Barbería Lauris",
        descripcion: "Cortes, maquillaje y diseño de uñas.",
        ubicacion: "Pio Montufar y Lauro Coronel",
        subcategoria: "Peluquería",
        lat: -4.22050,
        lng: -79.25710,
        fotos: ["negocio_peluqueria_1.jpg"]
    }
];

// ========== AGREGAR TODO AL MAPA ==========
agregarMarcadores(LUGARES);
agregarMarcadores(SERVICIOS);

// Al moverte, el popup se cierra:
map.on("movestart", () => map.closePopup());
