console.log("ver-todos.js activo");

async function cargar(ruta){ const r = await fetch(ruta); return await r.json(); }

async function iniciar(){
  const bienes = await cargar('data/bienes.json');
  const servicios = await cargar('data/servicios.json');

  render("lista-bienes", bienes);
  render("lista-servicios", servicios);
}

function render(id, arr){
  const cont = document.getElementById(id);
  cont.innerHTML = arr.map(it=>{
    const img = it.imagenes?.[0] ? `<img src="data/${it.imagenes[0]}" alt="${it.nombre}">` : '';
    return `
      <div class="tarjeta">
        ${img}
        <h3>${it.nombre}${it.destacado ? ' ⭐' : ''}</h3>
        <p>${it.descripcion || it.direccion || ''}</p>
      </div>
    `;
  }).join('');
}

iniciar();
