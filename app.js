// =============================
// CARGA DE JSON DESDE /data
// =============================

// Cargar Categorías
async function cargarCategorias() {
    const res = await fetch("data/categorias.json");
    return await res.json();
}

// Cargar Bienes
async function cargarBienes() {
    const res = await fetch("data/bienes.json");
    return await res.json();
}

// Cargar Servicios
async function cargarServicios() {
    const res = await fetch("data/servicios.json");
    return await res.json();
}
