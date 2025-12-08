// app.js — Generar tarjetas de bienes y servicios

async function cargarJSON(ruta) {
    const res = await fetch(`data/${ruta}`);
    return res.json();
}

function cardHTML(item) {
    return `
        <div class="card">
            <h3>${item.nombre}</h3>
            <p>${item.descripcion}</p>
            <p><strong>Categoría:</strong> ${item.categoria}</p>
            <p><strong>Ubicación:</strong> ${item.ubicacion || item.direccion}</p>
        </div>
    `;
}

async function cargarListas() {
    const bienes = await cargarJSON("bienes.json");
    const servicios = await cargarJSON("servicios.json");

    document.getElementById("lista-lugares").innerHTML =
        bienes.map(cardHTML).join("");

    document.getElementById("lista-servicios").innerHTML =
        servicios.map(cardHTML).join("");
}

document.addEventListener("DOMContentLoaded", cargarListas);
