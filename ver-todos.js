async function cargar(ruta) {
  const r = await fetch(ruta);
  return r.json();
}

async function iniciar() {
  const bienes = await cargar("data/bienes.json");
  const servicios = await cargar("data/servicios.json");

  const todos = [...bienes, ...servicios];
  const cont = document.getElementById("lista-todos");

  cont.innerHTML = "";

  todos.forEach(item => {
    const img = item.imagenes?.[0] ? "data/" + item.imagenes[0] : "";
    const mas = item.imagenes && item.imagenes.length > 1;

    cont.innerHTML += `
      <div class="tarjeta">
        ${img ? `<img src="${img}">` : ""}
        <h3>${item.nombre}</h3>
        <p>${item.descripcion || ""}</p>
        ${mas ? `<button onclick='abrirGaleria(${JSON.stringify(item.imagenes)})'>Ver imágenes</button>` : ""}
      </div>
    `;
  });
}
iniciar();
