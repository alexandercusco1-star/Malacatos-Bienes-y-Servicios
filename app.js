// ========================
// APP.JS – Listas visuales
// ========================

// Función para crear tarjetas
function createCard(item) {
    return `
        <div class="card">
            <h3>${item.nombre}</h3>
            <p>${item.descripcion}</p>
            <p><strong>Ubicación:</strong> ${item.direccion || item.ubicacion}</p>
        </div>
    `;
}

// Cargar lista de lugares (bienes)
fetch("data/bienes.json")
    .then(r => r.json())
    .then(data => {
        document.getElementById("lista-lugares").innerHTML =
            data.map(createCard).join("");
    });

// Cargar lista de servicios
fetch("data/servicios.json")
    .then(r => r.json())
    .then(data => {
        document.getElementById("lista-servicios").innerHTML =
            data.map(createCard).join("");
    });
