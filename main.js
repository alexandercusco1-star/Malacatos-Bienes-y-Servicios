// ===========================================================
//  CARGAR DATOS
// ===========================================================
let data = [];
let map;
let markers = [];

// ===========================================================
//  INICIALIZAR MAPA
// ===========================================================
function initMap() {
    map = L.map('map').setView([-4.2149, -79.1703], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);
}

// ===========================================================
//  CREAR MARCADORES
// ===========================================================
function renderMarkers(list) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    list.forEach(item => {
        const icon = L.icon({
            iconUrl: item.icono,
            iconSize: [35, 35],
            iconAnchor: [17, 34],
            popupAnchor: [0, -28]
        });

        const marker = L.marker(item.coordenadas, { icon }).addTo(map);

        marker.on("click", () => {
            openBottomPanel(item);
        });

        markers.push(marker);
    });
}

// ===========================================================
//  CARGAR PANEL INFERIOR
// ===========================================================
function openBottomPanel(item) {
    const panel = document.getElementById("bottom-panel");
    const content = document.getElementById("bp-content");

    let fotosHTML = item.fotos
        .map(f => `<img src="${f}" alt="foto">`)
        .join("");

    content.innerHTML = `
        <h2>${item.nombre}</h2>
        <p>${item.descripcion}</p>
        ${fotosHTML}
    `;

    panel.classList.add("open");
}

document.getElementById("bp-close").onclick = () => {
    document.getElementById("bottom-panel").classList.remove("open");
};

// ===========================================================
//  BUSCADOR
// ===========================================================
function activarBuscador() {
    const input = document.getElementById("search-input");

    input.addEventListener("input", () => {
        const text = input.value.toLowerCase();

        const filtrados = data.filter(item =>
            item.nombre.toLowerCase().includes(text) ||
            item.categoria.toLowerCase().includes(text)
        );

        renderMarkers(filtrados);
        renderListaCompleta(filtrados);
    });
}

// ===========================================================
//  FILTROS POR CATEGORÍA
// ===========================================================
function renderFiltros() {
    const cont = document.getElementById("filters");
    const categorias = [...new Set(data.map(i => i.categoria))];

    cont.innerHTML = "";

    categorias.forEach(cat => {
        const btn = document.createElement("button");
        btn.className = "filter-btn";
        btn.innerText = cat;

        btn.onclick = () => {
            document
                .querySelectorAll(".filter-btn")
                .forEach(b => b.classList.remove("active"));

            btn.classList.add("active");

            const filtrados = data.filter(i => i.categoria === cat);

            renderMarkers(filtrados);
            renderListaCompleta(filtrados);
        };

        cont.appendChild(btn);
    });
}

// ===========================================================
//  DESTACADOS
// ===========================================================
function renderDestacados() {
    const cont = document.getElementById("destacados-contenedor");
    cont.innerHTML = "";

    const destacados = data.filter(i => i.destacado === true);

    destacados.forEach(item => {
        const card = document.createElement("div");
        card.className = "tarjeta";

        const foto = item.fotos && item.fotos.length > 0 ? item.fotos[0] : "";

        card.innerHTML = `
            <img src="${foto}">
            <h3>${item.nombre}</h3>
        `;

        card.onclick = () => openBottomPanel(item);

        cont.appendChild(card);
    });
}

// ===========================================================
//  LISTA COMPLETA (para ver todos)
// ===========================================================
function renderListaCompleta(list) {
    const contBienes = document.getElementById("lista-lugares");
    const contServicios = document.getElementById("lista-servicios");

    contBienes.innerHTML = "<h3>Bienes</h3>";
    contServicios.innerHTML = "<h3>Servicios</h3>";

    list.forEach(item => {
        const div = document.createElement("div");
        div.className = "tarjeta";

        const foto = item.fotos && item.fotos.length > 0 ? item.fotos[0] : "";

        div.innerHTML = `
            <img src="${foto}">
            <h3>${item.nombre}</h3>
        `;

        div.onclick = () => openBottomPanel(item);

        if (item.categoria === "Bien") contBienes.appendChild(div);
        else contServicios.appendChild(div);
    });
}

// ===========================================================
//  BOTÓN VER TODOS
// ===========================================================
document.getElementById("ver-todos").onclick = () => {
    document.getElementById("resultados").style.display = "block";

    // mostrar todo
    renderListaCompleta(data);
};

// ===========================================================
//  LEYENDA
// ===========================================================
function renderLeyenda() {
    const cont = document.getElementById("leyenda-items");
    cont.innerHTML = "";

    const categorias = [...new Set(data.map(i => i.categoria))];

    categorias.forEach(cat => {
        const item = document.createElement("div");
        item.className = "leyenda-item";

        const icono = data.find(i => i.categoria === cat).icono;

        item.innerHTML = `
            <img src="${icono}">
            <span>${cat}</span>
        `;
        cont.appendChild(item);
    });
}

// abrir/cerrar
document.getElementById("leyenda-bar").onclick = () => {
    document.getElementById("leyenda-drawer").classList.toggle("open");
};

// ===========================================================
//  INICIALIZAR TODO
// ===========================================================
async function init() {
    const res = await fetch("data/data.json");
    data = await res.json();

    initMap();
    renderMarkers(data);
    renderFiltros();
    renderDestacados();
    renderLeyenda();
    activarBuscador();
}
init();
