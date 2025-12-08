// =========================
// MAIN.JS – CONTROL GENERAL
// =========================

// Variables globales
let mapa;
let marcadores = [];
let panelAbierto = null;

// Iniciar el mapa y cargar datos
function iniciarMapa() {
    cargarJSON("data/categorias.json", categorias => {
        cargarJSON("data/bienes.json", bienes => {
            cargarJSON("data/servicios.json", servicios => {
                inicializarMapa(bienes, servicios, categorias);
            });
        });
    });
}

// Cargar archivo JSON
function cargarJSON(url, callback) {
    fetch(url)
        .then(r => r.json())
        .then(callback)
        .catch(() => console.error("Error cargando: " + url));
}

// Inicializar Google Maps con íconos personalizados
function inicializarMapa(bienes, servicios, categorias) {

    // Crear el mapa
    mapa = new google.maps.Map(document.getElementById("mapa-google"), {
        center: { lat: -4.2186, lng: -79.2570 },
        zoom: 15
    });

    // Crear marcadores de bienes
    bienes.forEach(b => {
        crearMarcador(b, categorias[b.tipo].icono);
    });

    // Crear marcadores de servicios
    servicios.forEach(s => {
        crearMarcador(s, categorias[s.tipo].icono);
    });
}

// Crear marcador con ícono
function crearMarcador(item, icono) {

    const marker = new google.maps.Marker({
        position: {
            lat: parseFloat(item.latitud),
            lng: parseFloat(item.longitud)
        },
        map: mapa,
        icon: {
            url: "data/" + icono,
            scaledSize: new google.maps.Size(42, 42)
        }
    });

    // Click → Mostramos panel
    marker.addListener("click", () => {
        mostrarPanel(item);
    });

    marcadores.push(marker);
}

// Mostrar panel con fotos
function mostrarPanel(item) {

    // si otro panel está abierto → lo cerramos
    if (panelAbierto) {
        panelAbierto.remove();
        panelAbierto = null;
    }

    // Crear panel
    const panel = document.createElement("div");
    panel.className = "panel-info";

    let htmlFotos = "";
    if (item.imagenes && item.imagenes.length > 0) {
        htmlFotos = item.imagenes.map(img =>
            `<img src="data/${img}" class="foto-info">`
        ).join("");
    }

    panel.innerHTML = `
        <h3>${item.nombre}</h3>
        <p>${item.descripcion || ""}</p>
        <p><strong>Dirección:</strong> ${item.direccion || item.ubicacion || "No especificado"}</p>
        ${htmlFotos}
    `;

    document.body.appendChild(panel);
    panelAbierto = panel;

    // Se cierra automáticamente al mover el mapa
    mapa.addListener("dragstart", () => {
        if (panelAbierto) {
            panelAbierto.remove();
            panelAbierto = null;
        }
    });
}

// Iniciar cuando cargue la página
window.onload = iniciarMapa;
