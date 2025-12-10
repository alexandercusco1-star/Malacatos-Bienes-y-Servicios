async function loadAll(){
  const bienes = await (await fetch("data/bienes.json")).json();
  const servicios = await (await fetch("data/servicios.json")).json();

  const cont = document.getElementById("todos");
  cont.innerHTML = "";

  [...bienes, ...servicios].forEach(item=>{
    cont.innerHTML += `
      <div class="card">
        <img src="data/${item.imagenes[0]}">
        <h3>${item.nombre}</h3>
        <p>${item.descripcion || item.direccion}</p>
      </div>
    `;
  });
}

loadAll();
