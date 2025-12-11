// ver-todos.js

async function cargar(ruta) {
  const r = await fetch(ruta);
  return await r.json();
}

let ALL = { bienes: [], servicios: [] };

async function iniciar() {
  [ALL.bienes, ALL.servicios] = await Promise.all([
    cargar('data/bienes.json'),
    cargar('data/servicios.json')
  ]);

  renderLista('lista-bienes', ALL.bienes);
  renderLista('lista-servicios', ALL.servicios);
}

// Renderizar tarjetas
function renderLista(id, arr) {
  const cont = document.getElementById(id);
  if (!cont) return;

  cont.innerHTML = arr.map(it => {
    const img = it.imagenes?.length ? `data/${it.imagenes[0]}` : '';
    return `
      <div class="tarjeta" data-nombre="${it.nombre}">
        ${img ? `<img src="${img}" class="mini-img" alt="${it.nombre}">` : ''}
        <h3>${it.nombre}${it.destacado ? ' ⭐' : ''}</h3>
        <p>${it.descripcion || it.direccion || ''}</p>
      </div>
    `;
  }).join('');

  cont.querySelectorAll('.tarjeta').forEach(card => {
    card.addEventListener('click', () => {
      const nombre = card.dataset.nombre;
      abrirModal(nombre);
    });
  });
}

// Modal para ver TODAS las imágenes
function abrirModal(nombre) {
  const all = [...ALL.bienes, ...ALL.servicios];
  const item = all.find(x => x.nombre === nombre);
  if (!item) return;

  const modal = document.getElementById('modal');
  const content = document.getElementById('modal-content');

  const fotos = item.imagenes || [];

  content.innerHTML = `
    <h2>${item.nombre}</h2>
    <p>${item.descripcion || item.direccion || ''}</p>
    <div class="modal-fotos">
      ${fotos.map(f => `<img src="data/${f}" class="modal-img">`).join('')}
    </div>
    <button id="modal-close">Cerrar</button>
  `;

  document.getElementById('modal-close').onclick = () => {
    modal.classList.remove('open');
  };

  modal.classList.add('open');
}

iniciar();
