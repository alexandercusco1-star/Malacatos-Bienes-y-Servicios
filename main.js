window.onload = async function () {
    // Cargar las listas
    await DataApp.cargarLugares();
    await DataApp.cargarServicios();

    // Cargar mapa con iconos
    initMap();
};

// MAPA + ICONOS
async function initMap() {
    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -4.2005, lng: -79.2191 },
        zoom: 14,
    });

    const categorias = await (await fetch("data/categorias.json")).json();
    const bienes = await (await fetch("data/bienes.json")).json();

    bienes.forEach(item => {
        const icono = categorias[item.categoria]?.icono || "";
        new google.maps.Marker({
            position: item.coords,
            map,
            title: item.nombre,
            icon: {
                url: icono,
                scaledSize: new google.maps.Size(38, 38),
            }
        });
    });
}
