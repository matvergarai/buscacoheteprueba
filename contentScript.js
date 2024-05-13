// contentScript.js

console.log("El contentScript se está ejecutando.");

// Obtener las reglas de bloqueo del almacenamiento sincronizado
chrome.storage.sync.get('blockedWebsites', function(data) {
    const blockedWebsites = data.blockedWebsites || []; // Obtener el array de sitios bloqueados

    console.log("Urls bloqueadas recibidas:", blockedWebsites);

    // Verificar si la página debe ser bloqueada
    const url = window.location.href; // Obtener la URL actual
    const blocked = isUrlBlocked(url, blockedWebsites); // Verificar si la URL está bloqueada
    console.log("¿Está bloqueada la página?", blocked);

    if (blocked) {
        blockPage(); // Bloquear la página si está en la lista de bloqueo
    }
});

// Función para verificar si la URL está bloqueada
function isUrlBlocked(url, blockedWebsites) {
    console.log("Comprobando si la URL está bloqueada...");
    console.log("Urls bloqueadas:", blockedWebsites);

    return blockedWebsites.some(website => {
        // Verificar si la URL coincide con algún patrón de bloqueo
        const regex = new RegExp(website.replace(/\*/g, '.*'));
        console.log("Regex:", regex);

        return regex.test(url);
    });
}

// Función para bloquear la página
function blockPage() {
    document.body.innerHTML = ""; // Limpiar el contenido de la página
    document.body.style.background = "black"; // Establecer el fondo en negro
    document.body.style.color = "white"; // Establecer el color del texto en blanco
    document.body.style.fontFamily = "Arial, sans-serif"; // Establecer la fuente
    document.body.style.padding = "20px"; // Añadir un espacio de relleno

    // Crear un mensaje de bloqueo
    const blockMessage = document.createElement("h1");
    blockMessage.textContent = "Esta página ha sido bloqueada.";
    document.body.appendChild(blockMessage);
}
