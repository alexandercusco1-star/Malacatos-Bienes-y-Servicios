async function cargar(r){ const x = await fetch(r); return await x.json(); }

async function iniciarTodos(){
    const bienes = await cargar("data/bienes.json");
    const servicios = await cargar("data/servicios.json");

    render("todos-bienes", bienes);
    render("todos-servicios", servicios);
}

function render(id, arr){
    const box = document.getElementById(id);
    box.innerHTML = arr.map(it => {
        const img = it.imagenes?.[0] ? `data/${it.imagenes[0]}` : '';
        return `
        <div class="tarjeta">
            ${img ? `<img src="${img}">` : ''}
            <h3>${it.nombre}</h3>
            <p style="color:var(--muted); font-size:14px">${it.descripcion || it.direccion || ''}</p>
        </div>`;
    }).join("");
}

iniciarTodos();
