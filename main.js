/* =============================
   CARGA DEL MAPA
============================= */

const map = L.map('map').setView([-4.2006, -79.2075], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
}).addTo(map);


/* =============================
   LEYENDA (ICONOS)
============================= */

function toggleLeyenda() {
    const c = document.getElementById("leyenda-contenido");
    c.style.display = c.style.display === "block" ? "none" : "block";
}

async function cargarLeyenda() {
    const resp = await fetch("data/categorias.json");
    const categorias = await resp.json();

    const cont = document.getElementById("leyenda-contenido");
    cont.innerHTML = "";

    Object.entries(categorias).forEach(([nombre, info]) => {
        const div = document.createElement("div");
        div.className = "leyenda-item";

        div.innerHTML = `
            <img src="data/${info.icono}" />
            <span>${nombre}</span>
        `;
        cont.appendChild(div);
    });
}


/* =============================
   CARGA DE CATEGORÍAS
============================= */

async function cargarCategorias() {
    const resp = await fetch("data/categorias.json");
    const data = await resp.json();

    const cont = document.getElementById("categorias-list");
    cont.innerHTML = "";

    Object.entries(data).forEach(([nombre, info]) => {
        const div = document.createElement("div");
        div.className = "categoria-item";

        div.innerHTML = `
            <img src="data/${info.icono}" />
            <p>${nombre}</p>
        `;

        cont.appendChild(div);
    });
}


/* =============================
   CARGA DE SUBCATEGORÍAS
============================= */

async function cargarSubcategorias() {
    const resp = await fetch("data/subcategorias.json");
    const data = await resp.json();

    const cont = document.getElementById("subcategorias-list");
    cont.innerHTML = "";

    Object.entries(data).forEach(([nombre, info]) => {
        const div = document.createElement("div");
        div.className = "subcategoria-item";

        div.innerHTML = `
            <img src="data/${info.icono}" />
            <p>${nombre}</p>
        `;

        cont.appendChild(div);
    });
}


/* =============================
   CARGA DE BIENES Y SERVICIOS
============================= */

async function cargarDestacados() {
    const bienesResp = await fetch("data/bienes.json");
    const serviciosResp = await fetch("data/servicios.json");

    const bienes = await bienesResp.json();
    const servicios = await serviciosResp.json();

    const bienesDest = document.getElementById("bienes-destacados");
    const servDest = document.getElementById("servicios-destacados");

    bienesDest.innerHTML = "";
    servDest.innerHTML = "";

    // BIENES
    Object.values(bienes)
        .filter(item => item.destacado === true)
        .forEach(item => {
            bienesDest.innerHTML += `
                <div class="card">
                    <img src="${item.foto}" />
                    <p>${item.nombre}</p>
                </div>
            `;
        });

    // SERVICIOS
    Object.values(servicios)
        .filter(item => item.destacado === true)
        .forEach(item => {
            servDest.innerHTML += `
                <div class="card">
                    <img src="${item.foto}" />
                    <p>${item.nombre}</p>
                </div>
            `;
        });
}


async function cargarListas() {
    const bienesResp = await fetch("data/bienes.json");
    const serviciosResp = await fetch("data/servicios.json");

    const bienes = await bienesResp.json();
    const servicios = await serviciosResp.json();

    const bienesList = document.getElementById("bienes-list");
    const servList = document.getElementById("servicios-list");

    bienesList.innerHTML = "";
    servList.innerHTML = "";

    // BIENES
    Object.values(bienes).forEach(item => {
        bienesList.innerHTML += `
            <div class="card">
                <img src="${item.foto}" />
                <p>${item.nombre}</p>
            </div>
        `;
    });

    // SERVICIOS
    Object.values(servicios).forEach(item => {
        servList.innerHTML += `
            <div class="card">
                <img src="${item.foto}" />
                <p>${item.nombre}</p>
            </div>
        `;
    });
}


/* =============================
   INICIALIZAR TODO
============================= */

cargarLeyenda();
cargarCategorias();
cargarSubcategorias();
cargarDestacados();
cargarListas();
