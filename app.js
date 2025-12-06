// app.js – Carga de datos de lugares y servicios

// Función para crear tarjetas
function createCard(item) {
    return `
        <div class="card">
            <h3>${item.nombre}</h3>
            <p>${item.descripcion}</p>
            <p><strong>Ubicación:</strong> ${item.ubicacion}</p>
        </div>
    `;
}

// Cargar lugares turísticos
function cargarLugares() {
    const contenedor = document.getElementById("lista-lugares");

    if (typeof LUGARES === "undefined") {
        contenedor.innerHTML = "<p>No se pudo cargar la lista de lugares.</p>";
        return;
    }

    contenedor.innerHTML = LUGARES.map(createCard).join("");
}

// Cargar servicios
function cargarServicios() {
    const contenedor = document.getElementById("lista-servicios");

    if (typeof SERVICIOS === "undefined") {
        contenedor.innerHTML = "<p>No se pudo cargar la lista de servicios.</p>";
        return;
    }

    contenedor.innerHTML = SERVICIOS.map(createCard).join("");
}

// Inicializar al cargar la página
function iniciarApp() {
    cargarLugares();
    cargarServicios();
}
