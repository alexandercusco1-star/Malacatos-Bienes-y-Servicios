// ver-todos.js - muestra todos los elementos que NO estén marcado destacado:true
async function fetchJson(url){ const r = await fetch(url,{cache:'no-store'}); return await r.json(); }

async function initTodos(){
  const bienes = await fetchJson('data/bienes.json');
  const servicios = await fetchJson('data/servicios.json');

  const all = [...bienes, ...servicios];
  // mostrar los que NO son destacados (si quieres incluir los destacados también, quita el filter)
  const noDest = all.filter(i => !i.destacado);

  const cont = document.getElementById('todos-lista');
  cont.innerHTML = noDest.map(it=>{
    const img = it.imagenes && it.imagenes.length ? `<img src="data/${it.imagenes[0]}" style="width:100%;height:160px;object-fit:cover;border-radius:8px">` : '';
    return `<div class="card">${img}<h3>${it.nombre}</h3><p style="color:var(--muted)">${it.descripcion || it.direccion || ''}</p></div>`;
  }).join('');
}

initTodos();
