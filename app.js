// Cargar categorías y subcategorías
async function cargarCategorias() {
    const resp = await fetch("data/categorias.json");
    const json = await resp.json();

    const cont = document.getElementById("categorias");
    cont.innerHTML = "";

    // Botón TODOS
    const btnTodos = document.createElement("button");
    btnTodos.textContent = "Todos";
    cont.appendChild(btnTodos);

    // Crear botones
    for (const cat of Object.keys(json)) {
        const btn = document.createElement("button");
        btn.textContent = cat;
        cont.appendChild(btn);
    }
}
cargarCategorias();

// Crear mapa
const map = L.map("map").setView([-4.211, -79.205], 15);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

// Cargar bienes y servicios
async function cargarDatos() {
    const resp = await fetch("data/bienes.json");
    const datos = await resp.json();

    const leyenda = document.getElementById("leyenda");
    leyenda.innerHTML = "<h3>Leyendas</h3>";

    const grupos = {
        bienes: datos.bienes,
        servicios: datos.servicios
    };

    // Crear marcadores
    for (const grupo in grupos) {
        for (const item in grupos[grupo]) {

            const icono = grupos[grupo][item].icono;
            const nombre = item;

            // Agregar a la leyenda
            leyenda.innerHTML += `
                <div class="leyenda-item">
                    <img src="data/${icono}">
                    <span>${nombre}</span>
                </div>
            `;
        }
    }
}

cargarDatos();
