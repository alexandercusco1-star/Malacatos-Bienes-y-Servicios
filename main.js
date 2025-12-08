// =========================
// MAPA
// =========================
let map = L.map("map").setView([-4.2191, -79.2583], 15);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);

// =========================
// CARGAR ARCHIVOS JSON
// =========================
async function cargarJSON(ruta) {
    const respuesta = await fetch(ruta);
    return await respuesta.json();
}

// =========================
// CARGAR ICONOS DEL JSON
// =========================
function crearIcono(ruta) {
    return L.icon({
        iconUrl: `data/${ruta}`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });
}

// =========================
// MOSTRAR POPUP
// =========================
function crearPopup(item) {
    let imagenesHTML = "";
    if (item.imagenes && item.imagenes.length > 0) {
        item.imagenes.forEach(img => {
            imagenesHTML += `<img src="data/${img}" style="width:100%;margin-top:8px;border-radius:8px;">`;
        });
    }

    return `
        <b>${item.nombre}</b><br>
        <small>${item.descripcion || item.direccion}</small><br>
        <small><b>Tel:</b> ${item.telefono || ""}</small>
        ${imagenesHTML}
    `;
}

// =========================
// MOSTRAR MARCADORES
// =========================
async function cargarDatos() {
    const bienes = await cargarJSON("data/bienes.json");
    const servicios = await cargarJSON("data/servicios.json");

    // ===== BIENES =====
    bienes.forEach(item => {
        const icono = crearIcono(item.icono);

        L.marker([item.latitud, item.longitud], { icon: icono })
            .addTo(map)
            .bindPopup(crearPopup(item));
    });

    // ===== SERVICIOS =====
    servicios.forEach(item => {
        const icono = crearIcono(item.icono);

        L.marker([item.latitud, item.longitud], { icon: icono })
            .addTo(map)
            .bindPopup(crearPopup(item));
    });

    cargarLeyenda();
}

// =========================
// LEYENDA
// =========================
async function cargarLeyenda() {
    const categorias = await cargarJSON("data/categorias.json");
    const contenedor = document.getElementById("lista-leyenda");

    contenedor.innerHTML = "";

    Object.keys(categorias.bienes).forEach(cat => {
        const icono = categorias.bienes[cat].icono;
        contenedor.innerHTML += `
            <li class="leyenda-item">
                <img src="data/${icono}" class="leyenda-icon">
                <span>${cat}</span>
            </li>
        `;
    });

    Object.keys(categorias.servicios).forEach(cat => {
        const icono = categorias.servicios[cat].icono;
        contenedor.innerHTML += `
            <li class="leyenda-item">
                <img src="data/${icono}" class="leyenda-icon">
                <span>${cat}</span>
            </li>
        `;
    });
}

// =========================
// BOTÓN PARA MOSTRAR/OCULTAR
// =========================
document.getElementById("btn-leyenda").onclick = () => {
    document.getElementById("leyenda-panel").classList.toggle("visible");
};

// =========================
// INICIAR TODO
// =========================
cargarDatos();
