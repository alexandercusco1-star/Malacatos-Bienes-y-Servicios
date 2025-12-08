// ========================= MAPA ============================
let map = L.map("map").setView([-4.219167, -79.258333], 16);

// Mapa libre sin API
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);

// ========================= ICONOS ============================
function getIcon(ruta) {
    return L.icon({
        iconUrl: "data/" + ruta,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });
}

// ========================= POPUP PREMIUM ============================
function crearPopup(item) {

    const primeraImagen = item.imagenes?.length
        ? `data/${item.imagenes[0]}`
        : "data/no-image.jpg";

    const esPremium = item.premium === true;

    return `
        <div style="
            width: 220px;
            padding: 10px;
            border-radius: 10px;
            border: ${esPremium ? "3px solid gold" : "1px solid #ccc"};
            background: ${esPremium ? "#fff8dc" : "#ffffff"};
            box-shadow: ${esPremium ? "0 0 10px gold" : "0 0 6px rgba(0,0,0,0.2)"};
            font-family: sans-serif;
        ">
            <img src="${primeraImagen}"
                style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px;">

            <h3 style="margin: 8px 0 6px; font-size: 18px;">
                ${item.nombre}
            </h3>

            <p style="margin: 0; font-size: 14px;">
                ${item.descripcion}
            </p>

            <p style="margin-top: 8px; font-size: 13px; color:#444;">
                📍 ${item.ubicacion || item.direccion}
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

// ========================= CARGAR DATOS ============================
Promise.all([
    fetch("data/bienes.json").then(r => r.json()),
    fetch("data/servicios.json").then(r => r.json()),
    fetch("data/categorias.json").then(r => r.json())
]).then(([bienes, servicios, categorias]) => {

    // ==== Colocar leyenda ====
    const lista = document.getElementById("lista-leyenda");
    lista.innerHTML = "";

    for (const tipo in categorias) {
        for (const sub in categorias[tipo]) {
            const icono = categorias[tipo][sub].icono;
            lista.innerHTML += `
                <li>
                    <img src="data/${icono}">
                    ${sub}
                </li>
            `;
        }
    }

    // ==== Colocar marcadores ====
    [...bienes, ...servicios].forEach(item => {
        const marker = L.marker(
            [parseFloat(item.latitud), parseFloat(item.longitud)],
            { icon: getIcon(item.icono) }
        );

        marker.bindPopup(crearPopup(item));
        marker.addTo(map);
    });
});

// ========================= PANEL LEYENDA ============================
const panel = document.getElementById("leyenda-panel");
const boton = document.getElementById("btn-leyenda");

boton.addEventListener("click", () => {
    if (panel.style.right === "0px") {
        panel.style.right = "-260px";
    } else {
        panel.style.right = "0px";
    }
});
