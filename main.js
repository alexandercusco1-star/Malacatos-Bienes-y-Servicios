// main.js - carga mapa, marcadores, leyenda y popups
const map = L.map('map').setView([-4.219167, -79.258333], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

// helper para leer JSON local
async function cargar(ruta){ const r = await fetch(ruta); return await r.json(); }

// Crear icono con ruta (respeta .jpeg/.jpg tal cual)
function iconoDe(ruta){
  return L.icon({
    iconUrl: `data/${ruta}`,
    iconSize: [36,36],
    iconAnchor: [18,36],
    popupAnchor: [0,-34]
  });
}

// popup elegante
function crearPopup(item){
  const img = item.imagenes?.length ? `data/${item.imagenes[0]}` : '';
  const telefono = item.telefono ? `<p style="margin:6px 0 0;"><strong>Tel:</strong> ${item.telefono}</p>` : '';
  return `
    <div style="width:220px;font-family:Inter, sans-serif;">
      ${img ? `<img src="${img}" style="width:100%;height:110px;object-fit:cover;border-radius:6px;margin-bottom:8px;">` : ''}
      <div style="font-weight:700;color:${getComputedStyle(document.documentElement).getPropertyValue('--verde-principal') || '#2e7d32'};margin-bottom:4px;">${item.nombre}</div>
      <div style="font-size:13px;color:#444">${item.descripcion || item.direccion || ''}</div>
      <div style="font-size:12px;color:#666;margin-top:6px">📍 ${item.ubicacion || item.direccion || ''}</div>
      ${telefono}
    </div>
  `;
}

// pinta marcadores y lista
async function iniciar(){
  const bienes = await cargar('data/bienes.json');
  const servicios = await cargar('data/servicios.json');
  const categorias = await cargar('data/categorias.json');

  // marcadores
  [...bienes, ...servicios].forEach(item => {
    // aseguramos types numéricos
    const lat = parseFloat(item.latitud);
    const lng = parseFloat(item.longitud);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    // usar icono de categoria si existe, sino el icono directo del registro
    let iconoArchivo = item.icono || (categorias[item.tipo] && categorias[item.tipo][item.categoria] && categorias[item.tipo][item.categoria].icono) || 'icon-default.jpeg';
    const mk = L.marker([lat, lng], { icon: iconoDe(iconoArchivo) }).addTo(map);
    mk.bindPopup(crearPopup(item));
  });

  // listas
  const renderLista = (arr, id) => {
    const cont = document.getElementById(id);
    if(!cont) return;
    cont.innerHTML = arr.map(it => `
      <div class="tarjeta">
        ${it.imagenes?.[0] ? `<img src="data/${it.imagenes[0]}" alt="${it.nombre}">` : ''}
        <h3 style="margin:8px 0 6px;color:var(--azul-mediterraneo);">${it.nombre}</h3>
        <div style="color:var(--muted);font-size:14px">${it.descripcion || it.direccion || ''}</div>
      </div>
    `).join('');
  };

  renderLista(bienes, 'lista-lugares');
  renderLista(servicios, 'lista-servicios');

  // leyenda
  const caja = document.getElementById('leyenda-items');
  if(caja){
    caja.innerHTML = '';
    // bienes
    Object.keys(categorias.bienes || {}).forEach(k => {
      const ic = categorias.bienes[k].icono;
      caja.innerHTML += `<div class="leyenda-item"><img src="data/${ic}" alt="${k}"><div>${k}</div></div>`;
    });
    // servicios
    Object.keys(categorias.servicios || {}).forEach(k => {
      const ic = categorias.servicios[k].icono;
      caja.innerHTML += `<div class="leyenda-item"><img src="data/${ic}" alt="${k}"><div>${k}</div></div>`;
    });
  }
}

// comportamiento de la barra/ventanita
(function bindLeyenda(){
  const bar = document.getElementById('leyenda-bar');
  const drawer = document.getElementById('leyenda-drawer');

  // abrir/ocultar con touch o click
  let open = false;
  function toggle(){
    open = !open;
    if(open) drawer.classList.add('open');
    else drawer.classList.remove('open');
  }
  // click en la barra
  bar.addEventListener('click', toggle);
  // cerrar si se hace click fuera (tocando el documento)
  document.addEventListener('click', (e)=>{
    if(!drawer || !bar) return;
    if(e.target === bar || bar.contains(e.target) || drawer.contains(e.target)) return;
    drawer.classList.remove('open');
    open = false;
  });
})();

// iniciar
iniciar();
