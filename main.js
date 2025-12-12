// ============================
//  CARGA DE DATOS
// ============================
let bienes = [];
let servicios = [];
let categorias = [];

// Cargar JSON de bienes, servicios y categorías
async function cargarDatos() {
    try {
        const bienesRes = await fetch("data/bienes.json");
        bienes = await bienesRes.json();

        const serviciosRes = await fetch("data/servicios.json");
        servicios = await serviciosRes.json();

        const catRes = await fetch("data/categorias.json");
        categorias = (await catRes.json()).categorias;

        console.log("Datos cargados correctamente");
        inicializarApp();
    } catch (error) {
        console.error("Error cargando datos:", error);
    }
}

// ============================
//  INICIALIZACIÓN DE LA APP
// ============================
function inicializarApp() {
    cargarDestacados();
    cargarLeyendaCategorias();
}

// ============================
//  MOSTRAR DESTACADOS
// ============================
function cargarDestacados() {
    const contenedor = document.getElementById("destacados");

    if (!contenedor) return;

    contenedor.innerHTML = "";

    const destacados = [
        ...bienes.filter(b => b.destacado),
        ...servicios.filter(s => s.destacado)
    ];

    destacados.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";
        
        const imagen = item.imagenes && item.imagenes.length > 0 
            ? item.imagenes[0] 
            : "sin-imagen.jpg";

        card.innerHTML = `
            <img src="images/${imagen}" class="card-img">
            <h3>${item.nombre}</h3>
            <p>${item.descripcion}</p>
        `;

        card.onclick = () => abrirDetalle(item);
        contenedor.appendChild(card);
    });
}

// ============================
//  CARGAR LEYENDA (ICONOS)
// ============================
function cargarLeyendaCategorias() {
    const contenedor = document.getElementById("leyenda-categorias");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    categorias.forEach(cat => {
        const item = document.createElement("div");
        item.className = "leyenda-item";

        item.innerHTML = `
            <img src="icons/${cat.icono}" class="leyenda-icono">
            <span>${cat.nombre}</span>
        `;

        contenedor.appendChild(item);
    });
}

// ============================
//  ABRIR DETALLE
// ============================
function abrirDetalle(item) {
    localStorage.setItem("detalleItem", JSON.stringify(item));
    window.location.href = "ver-todos.html";
}

// ============================
//  BOTÓN DESACTIVADO
// ============================
// ESTE BOTÓN YA NO HACE NADA. QUEDA MUERTO.
document.addEventListener("DOMContentLoaded", () => {
    const botonDesactivar = document.getElementById("btnRestablecer");

    if (botonDesactivar) {
        botonDesactivar.onclick = (e) => {
            e.preventDefault();
            console.log("Botón restablecer DESACTIVADO");
            // No hace absolutamente nada
        };
    }
});

// ============================
//  INICIO
// ============================
cargarDatos();
