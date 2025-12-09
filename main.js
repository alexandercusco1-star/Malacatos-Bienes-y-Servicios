// -----------------------------------------------------------
// main.js – Control del mapa, buscador y leyenda
// -----------------------------------------------------------

// MAPA BASE
const map = L.map("map").setView([-4.219167, -79.258333], 15);

// CAPA DE MAPA
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
}).addTo(map);

// GRUPOS DE MARCADORES
const markersGroup = L.layerGroup().addTo(map);

// LEER JSON DESDE /data/
async function cargarDatos() {
    const bienes = await fetch("data/bienes.json").then(r => r.json());
    const servicios = await fetch("data/servicios.json").then(r => r.json());
    const categorias = await fetch("data/categorias.json").then(r => r.json());

    return { bienes, servicios, categorias };
}

// CREAR MARCADORES CON POPUP
function crearMarcador(item, iconoUrl) {
    const icono = L.icon({
        iconUrl: "data/" + iconoUrl,
        iconSize: [42, 42],
        popupAnchor: [0, -10],
        className: "map-icon",
    });

    const popupHTML = `
        <div class="popup-info">
            <h3>${item.nombre}</h3>
            <p>${item.descripcion}</p>
            ${item.ubicacion ? `<p><strong>Ubicación:</strong> ${item.ubicacion}</p>` : ""}
            ${item.telefono ? `<p><strong>Tel:</strong> ${item.telefono}</p>` : ""}
            <div class="popup-imagenes">
                ${item.imagenes.map(img => `<img src="data/${img}" />`).join("")}
            </div>
        </div>
    `;

    const marker = L.marker([item.latitud, item.longitud], { icon: icono });
    marker.bindPopup(popupHTML);

    return marker;
}

// CARGAR TODOS LOS MARCADORES
async function iniciarMapa() {
    const { bienes, servicios, categorias } = await cargarDatos();

    markersGroup.clearLayers();

    // BIENES
    bienes.forEach(item => {
        const cat = categorias.bienes[item.categoria];
        if (!cat) return;

        const marker = crearMarcador(item, cat.icono);
        markersGroup.addLayer(marker);
    });

    // SERVICIOS
    servicios.forEach(item => {
        const cat = categorias.servicios[item.categoria];
        if (!cat) return;

        const marker = crearMarcador(item, cat.icono);
        markersGroup.addLayer(marker);
    });

    // LEYENDA
    construirLeyenda(categorias);
}

// BUSCADOR
function configurarBuscador() {
    const input = document.getElementById("buscador");

    input.addEventListener("input", () => {
        const texto = input.value.toLowerCase();

        markersGroup.eachLayer(marker => {
            const popup = marker.getPopup().getContent();
            const nombre = popup.toLowerCase();

            if (nombre.includes(texto)) {
                marker.addTo(map);
                map.setView(marker.getLatLng(), 17);
            }
        });
    });
}

// LEYENDA DESPLEGABLE
function construirLeyenda(categorias) {
    const box = document.getElementById("leyenda-box");
    box.innerHTML = "";

    const titulo = document.createElement("div");
    titulo.className = "leyenda-titulo";
    titulo.textContent = "Leyendas";
    box.appendChild(titulo);

    const contenido = document.createElement("div");
    contenido.className = "leyenda-contenido";

    function addCat(obj) {
        Object.keys(obj).forEach(key => {
            const icono = obj[key].icono;
            const fila = document.createElement("div");
            fila.className = "leyenda-item";
            fila.innerHTML = `
                <img src="data/${icono}">
                <span>${key}</span>
            `;
            contenido.appendChild(fila);
        });
    }

    addCat(categorias.bienes);
    addCat(categorias.servicios);

    box.appendChild(contenido);

    // Evento para desplegar
    titulo.addEventListener("click", () => {
        contenido.classList.toggle("activo");
    });
}

// INICIAR TODO
iniciarMapa();
configurarBuscador();
