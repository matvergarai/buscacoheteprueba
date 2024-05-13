// Función para obtener el último ID de las reglas existentes
function getLastRuleId(existingRules) {
    let lastId = 0;
    existingRules.forEach(rule => {
        if (rule.id > lastId) {
            lastId = rule.id;
        }
    });
    return lastId;
}

// Función para actualizar las reglas de bloqueo
let ruleCounter = 1000; // Inicializamos el contador de reglas

// Función para generar un nuevo ID único para las reglas
function generateUniqueId(existingIds) {
    let newId = Math.max(...existingIds) + 1; // Obtener el máximo de los IDs existentes y sumarle uno
    return newId;
}

// Función para actualizar las reglas de bloqueo
// Función para actualizar las reglas de bloqueo
function updateBlockingRules(blockedWebsites) {
    // Verificar si blockedWebsites es un array y no está vacío
    if (Array.isArray(blockedWebsites) && blockedWebsites.length > 0) {
        // Obtener las reglas de bloqueo dinámicas actuales
        chrome.declarativeNetRequest.getDynamicRules(function(existingRules) {
            const ruleIdsToRemove = existingRules.map(rule => rule.id); // Obtener los IDs de todas las reglas existentes

            // Eliminar las reglas existentes
            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIdsToRemove // Eliminar todas las reglas existentes
            }, function() {
                console.log("Se han eliminado las reglas existentes.");

                // Crear un arreglo de reglas de bloqueo basadas en las URLs bloqueadas
                const rulesToAdd = blockedWebsites.map((website, index) => {
                    return {
                        id: index + 1, // Asignar un nuevo ID secuencial
                        priority: 1, // Prioridad de la regla
                        action: { type: "block" }, // Acción de bloqueo
                        condition: {
                            urlFilter: website // URL a bloquear
                        }
                    };
                });

                // Agregar las nuevas reglas de bloqueo
                chrome.declarativeNetRequest.updateDynamicRules({
                    addRules: rulesToAdd // Agregar solo las nuevas reglas
                }, function() {
                    console.log("Se han agregado las nuevas reglas de bloqueo.");
                });
            });
        });
    } else {
        console.log("No hay URLs bloqueadas para actualizar las reglas de bloqueo.");
    }
}


// Cuando la extensión se inicia, obtén las URLs bloqueadas y actualiza las reglas de bloqueo
chrome.runtime.onInstalled.addListener(async function() {
    try {
        const syncData = await getSyncData(); // Obtener los datos sincronizados
        let blockedWebsites = syncData.blockedWebsites || []; // Obtener el array de sitios bloqueados

        // Verificar si blockedWebsites es un array
        if (!Array.isArray(blockedWebsites)) {
            // Si no es un array, conviértelo a uno
            blockedWebsites = [blockedWebsites];
        }

        // Actualizar las reglas de bloqueo con las URLs bloqueadas
        updateBlockingRules(blockedWebsites);
    } catch (error) {
        console.error("Error al actualizar las reglas de bloqueo:", error);
    }
});

// Listener para cambios en el almacenamiento sincronizado
chrome.storage.onChanged.addListener(async function(changes, areaName) {
    if (areaName === 'sync' && 'blockedWebsites' in changes) {
        let blockedWebsites = changes.blockedWebsites.newValue || []; // Obtener el array de sitios bloqueados

        // Verificar si blockedWebsites es un array
        if (!Array.isArray(blockedWebsites)) {
            // Si no es un array, conviértelo a uno
            blockedWebsites = [blockedWebsites];
        }

        // Actualizar las reglas de bloqueo con las URLs bloqueadas
        updateBlockingRules(blockedWebsites);
    }
});

// Función para obtener los datos sincronizados
function getSyncData() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get('blockedWebsites', function(data) {
            resolve(data);
        });
    });
}
