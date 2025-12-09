let mapa = L.map("map").setView([-4.21917, -79.25833], 15);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(mapa);

async function cargarDatos() {
    let bienes = await fetch("data/bienes.json").then(r => r.json());
    let servicios = await fetch("data/servicios.json").then(r => r.json());
    let categorias = await fetch("data/categorias.json").then(r => r.json());

    mostrarEnMapa(bienes, "bienes", categorias);
    mostrarEnMapa(servicios, "servicios", categorias);

    mostrarLista(bienes, "lista-lugares");
    mostrarLista(servicios, "lista-servicios");
}

function mostrarEnMapa(lista, tipo, categorias) {
    lista.forEach(item => {

        let iconoCategoria = categorias[tipo][item.categoria]?.icono || "icono-default.png";

        let icono = L.icon({
            iconUrl: "data/" + iconoCategoria,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -28]
        });

        let marker = L.marker([item.latitud, item.longitud], { icono }).addTo(mapa);

        marker.bindPopup(`
            <b>${item.nombre}</b><br>
            <small>${item.descripcion}</small>
        `);
    });
}

function mostrarLista(lista, destino) {
    let contenedor = document.getElementById(destino);
    contenedor.innerHTML = "";

    lista.forEach(item => {
        let tarjeta = document.createElement("div");
        tarjeta.className = "tarjeta";

        tarjeta.innerHTML = `
            <img src="data/${item.imagenes[0]}" alt="${item.nombre}">
            <h3>${item.nombre}</h3>
            <p>${item.descripcion}</p>
        `;

        contenedor.appendChild(tarjeta);
    });
}

cargarDatos();
