// app.js - carga listas desde /data y dibuja tarjetas simples

async function fetchJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error("Error cargando " + path);
  return await r.json();
}

async function cargarListas() {
  try {
    const [bienes, servicios] = await Promise.all([
      fetchJSON("data/bienes.json"),
      fetchJSON("data/servicios.json")
    ]);

    const contB = document.getElementById("lista-lugares");
    contB.innerHTML = bienes.map(item => {
      return `
        <div class="card">
          <h3>${item.nombre}</h3>
          <p>${item.descripcion || ""}</p>
          <p><strong>Ubicación:</strong> ${item.ubicacion || item.direccion || ""}</p>
        </div>`;
    }).join("");

    const contS = document.getElementById("lista-servicios");
    contS.innerHTML = servicios.map(item => {
      return `
        <div class="card">
          <h3>${item.nombre}</h3>
          <p>${item.descripcion || ""}</p>
          <p><strong>Dirección:</strong> ${item.direccion || item.ubicacion || ""}</p>
          <p><strong>Tel:</strong> ${item.telefono || ""}</p>
        </div>`;
    }).join("");

  } catch (e) {
    console.error(e);
  }
}

document.addEventListener("DOMContentLoaded", cargarListas);
