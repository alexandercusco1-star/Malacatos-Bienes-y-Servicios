// =============================
// INICIALIZAR PÁGINA
// =============================
document.addEventListener("DOMContentLoaded", async () => {
    
    const categorias = await cargarCategorias();
    const bienes = await cargarBienes();
    const servicios = await cargarServicios();

    mostrarCategorias(categorias);
    mostrarBienes(bienes);
    mostrarServicios(servicios);
});

// =============================
// MOSTRAR CATEGORÍAS
// =============================
function mostrarCategorias(categorias) {
    console.log("Categorías cargadas:", categorias);
}

// =============================
// CREAR ACORDEÓN
// =============================
function crearAcordeon(titulo, contenidoHTML) {
    const cont = document.createElement("div");
    cont.classList.add("acordeon");

    const header = document.createElement("div");
    header.classList.add("acordeon-titulo");
    header.textContent = titulo;

    const body = document.createElement("div");
    body.classList.add("acordeon-contenido");
    body.innerHTML = contenidoHTML;

    header.addEventListener("click", () => {
        document.querySelectorAll(".acordeon-contenido").forEach(c => {
            if (c !== body) c.style.display = "none";
        });

        body.style.display = body.style.display === "block" ? "none" : "block";
    });

    cont.appendChild(header);
    cont.appendChild(body);
    return cont;
}

// =============================
// MOSTRAR BIENES
// =============================
function mostrarBienes(bienes) {
    const contenedor = document.getElementById("lista-lugares");
    contenedor.innerHTML = "";

    bienes.forEach(bien => {

        const fotosHTML = bien.imagenes
            .map(img => `<img src="data/${img}" />`)
            .join("");

        const contenido = `
            <p><strong>Dirección:</strong> ${bien.direccion}</p>
            <p><strong>Tipo:</strong> ${bien.tipo}</p>
            <p><strong>Latitud:</strong> ${bien.latitud}</p>
            <p><strong>Longitud:</strong> ${bien.longitud}</p>

            <div class="carrusel">${fotosHTML}</div>
        `;

        const card = crearAcordeon(bien.nombre, contenido);
        contenedor.appendChild(card);
    });
}

// =============================
// MOSTRAR SERVICIOS
// =============================
function mostrarServicios(servicios) {
    const contenedor = document.getElementById("lista-servicios");
    contenedor.innerHTML = "";

    servicios.forEach(serv => {

        const fotosHTML = serv.imagenes
            .map(img => `<img src="data/${img}" />`)
            .join("");

        const contenido = `
            <p>${serv.descripcion}</p>
            <p><strong>Dirección:</strong> ${serv.direccion}</p>
            <p><strong>Teléfono:</strong> ${serv.telefono}</p>

            <div class="carrusel">${fotosHTML}</div>
        `;

        const card = crearAcordeon(serv.nombre, contenido);
        contenedor.appendChild(card);
    });
}
