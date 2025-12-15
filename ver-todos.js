async function cargar(ruta) {
  try {
    const r = await fetch(ruta);
    return await r.json();
  } catch {
    return [];
  }
}

async function iniciar() {
  const bienes = await cargar("data/bienes.json");
  const servicios = await cargar("data/servicios.json");

  const todos = [...bienes, ...servicios];
  const cont = document.getElementById("lista-todos");

  cont.innerHTML = "";

  todos.forEach(item => {
    const img = item.imagenes?.[0] ? `data/${item.imagenes[0]}` : "";

    cont.innerHTML += `
      <div class="tarjeta">
        ${img ? `<img src="${img}">` : ""}
        <h3>${item.nombre}</h3>
        <p><b>Categoría:</b> ${item.categoria}</p>
        <p>${item.descripcion || ""}</p>
        <p>${item.direccion || ""}</p>

        ${
          item.imagenes && item.imagenes.length > 1
            ? `<button onclick='abrirGaleria(${JSON.stringify(item.imagenes)})'>
                Ver más
              </button>`
            : ""
        }
      </div>
    `;
  });
}

iniciar();
