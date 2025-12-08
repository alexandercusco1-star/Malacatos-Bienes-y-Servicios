async function cargarListas(){
  const bienes = await fetch("data/bienes.json").then(r => r.json());
  const servicios = await fetch("data/servicios.json").then(r => r.json());

  document.getElementById("lista-lugares").innerHTML =
    bienes.map(x => `
      <div class="card">
        <h3>${x.nombre}</h3>
        <p>${x.descripcion}</p>
      </div>`).join("");

  document.getElementById("lista-servicios").innerHTML =
    servicios.map(x => `
      <div class="card">
        <h3>${x.nombre}</h3>
        <p>${x.descripcion}</p>
      </div>`).join("");
}

cargarListas();
