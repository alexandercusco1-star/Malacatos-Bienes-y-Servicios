// main.js – Inicialización

document.addEventListener("DOMContentLoaded", () => {
    if (typeof iniciarApp === "function") {
        iniciarApp();
    } else {
        console.error("No se encontró la función iniciarApp");
    }
});
