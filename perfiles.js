// Función para obtener el nombre de usuario actual
async function getCurrentUser() {
    return new Promise((resolve, reject) => {
        // Obtener el nombre de usuario de los parámetros de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('user');
        if (username) {
            resolve(username); // Si el nombre de usuario está en los parámetros de la URL, devolverlo
        } else {
            // Obtener el nombre de usuario del almacenamiento local
            chrome.storage.local.get('username', function(data) {
                const storedUsername = data['username'];
                if (storedUsername) {
                    resolve(storedUsername); // Si se encuentra en el almacenamiento local, devolverlo
                } else {
                    resolve(null); // Si no se puede encontrar, devolver null
                }
            });
        }
    });
}

// Función para obtener el perfil activo
async function getActiveProfile(username) {
    // Lógica para obtener el perfil activo
    // Por simplicidad, asumiremos que ya está implementado
}

// Función para mostrar el mensaje de bienvenida con el perfil activo
async function showWelcomeMessage() {
    const welcomeMessageElement = document.getElementById("welcomeMessage");
    if (welcomeMessageElement) {
        const currentUser = await getCurrentUser();
        const activeProfile = await getActiveProfile(currentUser);
        if (activeProfile && activeProfile.name) {
            welcomeMessageElement.textContent = `Bienvenido, ${currentUser}! Perfil activo: ${activeProfile.name}`;
        } else {
            welcomeMessageElement.textContent = `Bienvenido, ${currentUser}! No hay ningún perfil activo.`;
        }
    }
}

async function setUserActiveProfile(currentUser, profile) {
    try {
        const response = await fetch(`http://localhost:3000/set-active-navigation-profile/${currentUser}/${profile.name}`, {
            method: 'POST'
        });
        const data = await response.json();
        if (data.success) {
            // Almacenar las URLs bloqueadas en el almacenamiento sincronizado de Chrome
            chrome.storage.sync.set({ blockedWebsites: data.blockedWebsites }, function() {
                console.log("URLs bloqueadas guardadas en el almacenamiento sincronizado de Chrome");
            });
            return true;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error al establecer el perfil activo:", error);
        throw error;
    }
}

function clearBlockingRules() {
    chrome.declarativeNetRequest.getDynamicRules(function(rules) {
        const ruleIds = rules.map(rule => rule.id); // Obtener los IDs de todas las reglas
        if (ruleIds.length > 0) {
            // Eliminar todas las reglas de bloqueo
            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIds, // IDs de las reglas a eliminar
                addRules: [] // No hay reglas para agregar
            }, function() {
                console.log("Todas las reglas de bloqueo han sido eliminadas.");
            });
        } else {
            console.log("No hay reglas de bloqueo para eliminar.");
        }
    });
}

function getActiveBlockingRules(callback) {
    chrome.declarativeNetRequest.getDynamicRules(function(rules) {
        // Filtrar solo las reglas de bloqueo (acción 'block')
        const blockingRules = rules.filter(rule => rule.action.type === "block");
        
        // Verificar si se proporcionó una función de devolución de llamada
        if (typeof callback === "function") {
            callback(blockingRules); // Llamar a la función de devolución de llamada con las reglas
        } else {
            console.error("Error: Se requiere una función de devolución de llamada.");
        }
    });
}

// Ejemplo de uso:
getActiveBlockingRules(function(rules) {
    console.log("Reglas de bloqueo activas:", rules);
});


function getBlockingRules() {
    chrome.declarativeNetRequest.getDynamicRules(function(rules) {
        console.log("Reglas de bloqueo actuales:");
        console.log(rules);
    });
}

function limpiarSyncStorage() {
    chrome.storage.sync.clear(function() {
      console.log('Todos los elementos han sido eliminados correctamente.');
    });
  }
  

function mostrarSyncStorage() {
    // Obtener el contenido del almacenamiento sincronizado
    chrome.storage.sync.get(null, function(items) {
        // Verificar si hay algún error
        if (chrome.runtime.lastError) {
            console.error("Error al obtener el almacenamiento sincronizado:", chrome.runtime.lastError);
        } else {
            // Mostrar los datos en la consola
            console.log("Contenido del almacenamiento sincronizado:", items);
        }
    });
}
// Función para mostrar los perfiles de navegación existentes
// Función para mostrar los perfiles de navegación existentes
async function showNavigationProfiles() {
    const currentUser = await getCurrentUser();
    const navigationProfilesMessage = document.getElementById("navigationProfilesMessage");
    const navigationProfileList = document.getElementById("navigationProfileList");
    navigationProfileList.innerHTML = ""; // Limpiar la lista antes de mostrar los perfiles

    try {
        const navigationProfiles = await getNavigationProfiles(currentUser);
        navigationProfilesMessage.textContent = ""; // Limpiar el mensaje de error

        // Iterar sobre cada perfil de navegación y crear elementos para mostrarlos en la lista
        navigationProfiles.forEach(profile => {
            const profileItem = document.createElement("li");
            profileItem.textContent = profile.name;

            // Botones para cada perfil
            const setAsActiveButton = document.createElement("button");
            setAsActiveButton.textContent = "Establecer como activo";
            setAsActiveButton.addEventListener("click", async function() {
                try {
                    await setUserActiveProfile(currentUser, profile); // Establecer como activo
                    console.log("Perfil activo establecido exitosamente.");
                    const activeProfileMessage = document.getElementById("activeProfileMessage");
                    if (activeProfileMessage) {
                        await showActiveProfile(); // Mostrar el perfil activo actualizado
                    }
                } catch (error) {
                    console.error("Error al establecer el perfil activo:", error);
                    alert("Error al establecer el perfil activo. Inténtalo de nuevo más tarde.");
                }
            });

            const editButton = document.createElement("button");
            editButton.textContent = "Editar";
            editButton.addEventListener("click", async function() {
                const newName = prompt("Ingrese el nuevo nombre para el perfil:", profile.name);
                if (newName !== null) {
                    try {
                        await updateProfileName(currentUser, profile.name, newName); // Editar el nombre del perfil
                        await showNavigationProfiles(); // Actualizar la lista de perfiles
                    } catch (error) {
                        console.error("Error al editar el perfil:", error);
                        alert("Error al editar el perfil. Inténtalo de nuevo más tarde.");
                    }
                }
            });

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Eliminar";
            deleteButton.addEventListener("click", async function() {
                if (confirm("¿Estás seguro de que deseas eliminar este perfil?")) {
                    try {
                        await deleteNavigationProfile(currentUser, profile.name); // Eliminar el perfil
                        await showNavigationProfiles(); // Actualizar la lista de perfiles
                    } catch (error) {
                        console.error("Error al eliminar el perfil:", error);
                        alert("Error al eliminar el perfil. Inténtalo de nuevo más tarde.");
                    }
                }
            });

            const goToBlockPanelButton = document.createElement("button");
            goToBlockPanelButton.textContent = "Ir a panel de bloqueo";
            goToBlockPanelButton.addEventListener("click", async function() {
                const currentUser = await getCurrentUser(); // Obtener el usuario actual
                if (currentUser) {
                    window.open(`panel.html?username=${currentUser}&profile=${profile.name}`, '_blank');
                } else {
                    alert("No se pudo obtener el nombre de usuario.");
                }
            });

            // Agregar los botones al elemento del perfil
            profileItem.appendChild(setAsActiveButton);
            profileItem.appendChild(editButton);
            profileItem.appendChild(deleteButton);
            profileItem.appendChild(goToBlockPanelButton);

            // Agregar el elemento del perfil a la lista
            navigationProfileList.appendChild(profileItem);
        });
    } catch (error) {
        console.error("Error al obtener los perfiles de navegación:", error);
        navigationProfilesMessage.textContent = "Error al cargar los perfiles de navegación. Inténtalo de nuevo más tarde.";
    }
}

// Función para actualizar el nombre de un perfil de navegación
async function updateProfileName(username, oldName, newName) {
    try {
        const response = await fetch(`http://localhost:3000/update-profile-name/${username}/${oldName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newName: newName }),
            timeout: 10000
        });
        const data = await response.json();
        if (data.success) {
            console.log("Nombre de perfil actualizado exitosamente.");
            return true;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error al actualizar el nombre del perfil:", error);
        throw error;
    }
}

// Función para eliminar un perfil de navegación
async function deleteNavigationProfile(username, profileName) {
    try {
        const response = await fetch(`http://localhost:3000/delete-navigation-profile/${username}/${profileName}`, {
            method: 'DELETE',
            timeout: 10000
        });
        const data = await response.json();
        if (data.success) {
            console.log("Perfil eliminado exitosamente.");
            return true;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error al eliminar el perfil:", error);
        throw error;
    }
}


// Función para agregar un nuevo perfil de navegación
async function addNavigationProfile(profileName) {
    try {
        const currentUser = await getCurrentUser();
        const response = await fetch(`http://localhost:3000/add-navigation-profile/${currentUser}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: profileName })
        });
        const data = await response.json();
        if (data.success) {
            console.log("Nuevo perfil de navegación agregado exitosamente.");
            showNavigationProfiles(); // Actualizar la lista de perfiles de navegación
        } else {
            console.error("Error al agregar un nuevo perfil de navegación:", data.message);
        }
    } catch (error) {
        console.error("Error al agregar un nuevo perfil de navegación:", error);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Mostrar el mensaje de bienvenida con el perfil activo
    await showWelcomeMessage();

    // Mostrar los perfiles de navegación existentes
    await showNavigationProfiles();

    // Listener para el botón de agregar perfil
    const addProfileButton = document.getElementById('addProfileButton');
    addProfileButton.addEventListener('click', async function(event) {
        const profileNameInput = document.getElementById('navigationProfileNameInput').value;
        const currentUser = await getCurrentUser();
        try {
            await addNavigationProfile(currentUser, profileNameInput); // Agregar el nuevo perfil
            await showNavigationProfiles(); // Actualizar la lista de perfiles de navegación
        } catch (error) {
            console.error("Error al agregar un nuevo perfil de navegación:", error);
        }
    });
});


// Función para obtener los perfiles de navegación existentes
async function getNavigationProfiles(username) {
    try {
        const response = await fetch(`http://localhost:3000/get-navigation-profiles/${username}`);
        const data = await response.json();
        if (data.success) {
            return data.navigationProfiles;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error al obtener los perfiles de navegación:", error);
        throw error;
    }
}

// Función para agregar un nuevo perfil de navegación
async function addNavigationProfile(username, profileName) {
    try {
        const response = await fetch(`http://localhost:3000/add-navigation-profile/${username}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: profileName })
        });
        const data = await response.json();
        if (data.success) {
            console.log("Nuevo perfil de navegación agregado exitosamente.");
            return true;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error al agregar un nuevo perfil de navegación:", error);
        throw error;
    }
}

