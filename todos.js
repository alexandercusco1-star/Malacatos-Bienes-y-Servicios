async function cargar(r){ const x = await fetch(r); return await x.json(); }

let bienes = [];
let servicios = [];

async function iniciar(){
  bienes = await cargar('data/bienes.json');
  servicios = await cargar('data/servicios.json');

  const cont = document.getElementById('todos-lista');

  const combine = [...bienes, ...servicios].filter(i=>!i.destacado);

  cont.innerHTML = combine.map(it=>{
    const img = it.imagenes?.[0] ? `data/${it.imagenes[0]}` : '';
    return `
      <div class="tarjeta">
        ${img ? `<img src="${img}">` : ''}
        <h3>${it.nombre}</h3>
        <p>${it.descripcion || it.direccion || ''}</p>
      </div>
    `;
  }).join('');
}

iniciar();
