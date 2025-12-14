async function cargar(ruta) {
  const r = await fetch(ruta);
  return await r.json();
}

async function iniciar() {
  const [bienes, servicios] = await Promise.all([
    cargar("data/bienes.json"),
    cargar("data/servicios.json")
  ]);

  const lista = document.getElementById("lista");
  [...bienes, ...servicios].forEach(i => {
    lista.innerHTML += `
      <div class="tarjeta">
        <h3>${i.nombre}</h3>
        <p>${i.descripcion || ""}</p>
      </div>
    `;
  });
}

iniciar();
