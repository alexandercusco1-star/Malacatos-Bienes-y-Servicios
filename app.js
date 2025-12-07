// ========== CARGA DE LISTAS EN LA PÁGINA ==========

function createCard(item) {
    return `
        <div class="card">
            <h3>${item.nombre}</h3>
            <p>${item.descripcion}</p>
            <p><strong>Ubicación:</strong> ${item.ubicacion}</p>
        </div>
    `;
}

function cargarLugares() {
    const cont = document.getElementById("lista-lugares");
    cont.innerHTML = LUGARES.map(createCard).join("");
}

function cargarServicios() {
    const cont = document.getElementById("lista-servicios");
    cont.innerHTML = SERVICIOS.map(createCard).join("");
}

function iniciarListas() {
    cargarLugares();
    cargarServicios();
}

document.addEventListener("DOMContentLoaded", iniciarListas);
