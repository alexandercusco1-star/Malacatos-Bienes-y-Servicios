async function cargar(ruta) {
  const r = await fetch(ruta);
  return r.json();
}

let currentGallery = [];
let galleryIndex = 0;

function abrirGaleria(imagenes) {
  currentGallery = imagenes;
  galleryIndex = 0;
  document.getElementById("lb-img").src = "data/" + currentGallery[0];
  document.getElementById("lightbox").classList.add("open");
}

function cambiarImg(dir) {
  galleryIndex = (galleryIndex + dir + currentGallery.length) % currentGallery.length;
  document.getElementById("lb-img").src = "data/" + currentGallery[galleryIndex];
}

document.getElementById("lb-close").onclick = () =>
  document.getElementById("lightbox").classList.remove("open");

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
        <p>${item.descripcion || ""}</p>
        ${item.imagenes && item.imagenes.length > 1
          ? `<button onclick='abrirGaleria(${JSON.stringify(item.imagenes)})'>Ver más</button>`
          : ""
        }
      </div>
    `;
  });
}

iniciar();
