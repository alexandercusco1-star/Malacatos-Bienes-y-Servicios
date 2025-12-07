// Carga de datos desde /data/

async function cargarJSON(ruta) {
    const respuesta = await fetch(ruta);
    return await respuesta.json();
}

// Crear tarjetas
function createCard(item) {
    return `
        <div class="card">
            <h3>${item.nombre}</h3>
            <p>${item.descripcion}</p>
            <p><strong>Ubicación:</strong> ${item.ubicacion}</p>
        </div>
    `;
}

// Mostrar datos
async function cargarLugares() {
    const lugares = await cargarJSON("data/bienes.json");
    document.getElementById("lista-lugares").innerHTML =
        lugares.map(createCard).join("");
}

async function cargarServicios() {
    const servicios = await cargarJSON("data/servicios.json");
    document.getElementById("lista-servicios").innerHTML =
        servicios.map(createCard).join("");
}

// Exportar
window.DataApp = { cargarLugares, cargarServicios };
