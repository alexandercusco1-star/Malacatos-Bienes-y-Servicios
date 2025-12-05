// app.js — carga los datos desde data/places.json y guarda en window.places
const DATA_URL = "data/places.json";

function loadData(callback){
  fetch(DATA_URL)
    .then(r => r.json())
    .then(json => {
      const places = json.map(p => {
        const lat = p.lat !== undefined ? p.lat : (p.coords && p.coords[0]) ;
        const lon = p.lon !== undefined ? p.lon : (p.coords && p.coords[1]) ;
        return Object.assign({}, p, {lat: lat, lon: lon});
      });
      window.places = places;
      if (typeof callback === "function") callback(places);
    })
    .catch(err => {
      console.error("Error cargando data/places.json", err);
      window.places = [];
      if (typeof callback === "function") callback([]);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  loadData(function(){
    if (typeof initMap === "function") initMap();
  });
});
