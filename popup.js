// Función para obtener el nombre de usuario actual
async function getCurrentUser() {
    return localStorage.getItem('currentUser');
}

// Función para guardar el nombre de usuario actual en el almacenamiento
function saveCurrentUser(username, callback) {
    chrome.storage.sync.set({ "currentUser": username }, function() {
        console.log("Usuario actual guardado:", username);
        if (callback && typeof callback === 'function') {
            callback();
        }
    });
}

// Función para obtener la clave de almacenamiento de perfiles del usuario actual
function getStorageKey(username) {
    return `profiles_${username}`;
}

// Función para agregar un nuevo perfil para el usuario actual
async function addProfileForCurrentUser() {
    // Obtener el usuario actual
    const currentUser = await getCurrentUser();

    // Verificar si se obtuvo el usuario actual correctamente
    if (currentUser) {
        // Obtener el perfil del usuario actual
        const userProfile = await getProfileByUsername(currentUser);

        // Verificar si se encontró el perfil del usuario
        if (userProfile) {
            // Obtener todos los perfiles del usuario actual
            const profiles = await getProfiles(currentUser);

            // Verificar si el usuario ya tiene un perfil de navegación
            if (profiles && profiles.length > 0) {
                console.log("El usuario ya tiene un perfil de navegación existente:", profiles[0]);
            } else {
                // Si no tiene un perfil de navegación, creamos uno nuevo basado en el perfil de usuario y lo guardamos
                const newProfile = { 
                    username: userProfile.username, 
                    createdBy: userProfile.createdBy, 
                    blockedWebsitesArray: userProfile.blockedWebsitesArray 
                };
                profiles.push(newProfile);
                await saveProfiles(currentUser, profiles);
                console.log("Nuevo perfil de navegación creado para el usuario:", newProfile.username);
            }
        } else {
            console.log("No se encontró un perfil de usuario para el usuario actual.");
        }
    } else {
        console.log("No se pudo obtener el usuario actual.");
    }
}

async function getProfileByUsername(username) {
    return new Promise((resolve) => {
        chrome.storage.local.get("profiles", function(data) {
            const profiles = data.profiles || [];
            const profile = profiles.find(profile => profile.username === username);
            resolve(profile);
        });
    });
}

// Función para guardar perfiles en el almacenamiento
async function saveProfiles(username, profiles) {
    const storageKey = getStorageKey(username);
    chrome.storage.sync.set({ [storageKey]: profiles }, function() {
        console.log("Perfiles guardados:", profiles);
    });
}

// Función para obtener perfiles del almacenamiento
async function getProfiles(username) {
    return new Promise(resolve => {
        const storageKey = getStorageKey(username);
        chrome.storage.sync.get(storageKey, function(data) {
            const profiles = data[storageKey] || [];
            resolve(profiles);
        });
    });
}

function redirectToCreateProfilePageWithUser(profile) {
    const profileParam = JSON.stringify(profile);
    const url = "perfiles.html?profile=" + encodeURIComponent(profileParam);
    chrome.tabs.create({ url: url });
}
// Función para establecer el perfil de usuario activo


// Función para mostrar el perfil activo en el DOM
async function showActiveProfile() {
    const activeProfileNameElement = document.getElementById("activeProfileName");

    if (activeProfileNameElement) {
        const currentUser = await getCurrentUser();
        const activeProfile = await getActiveProfile(currentUser);

        if (activeProfile && activeProfile.username) {
            activeProfileNameElement.textContent = activeProfile.username;
            console.log("Perfil activo encontrado:", activeProfile);
            console.log("URLs bloqueadas del perfil activo (almacenamiento sincronizado):", activeProfile.blockedWebsitesArray);
        } else {
            activeProfileNameElement.textContent = "Ninguno";
            console.log("No hay ningún perfil activo.");
        }
    } else {
        console.error("El elemento 'activeProfileName' no fue encontrado en el DOM.");
    }
}

// Listener para el evento 'DOMContentLoaded' que se ejecuta cuando el DOM ha sido completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Llama a la función para mostrar el perfil activo al cargar la página
    showActiveProfile();
});

// En el evento de DOMContentLoaded, agrega un escuchador al formulario de inicio de sesión
document.addEventListener('DOMContentLoaded', function() {
    // Llama a la función para mostrar el perfil activo al cargar la página
    showActiveProfile();
});

// En el evento de DOMContentLoaded, agrega un escuchador al formulario de inicio de sesión
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Evitar el envío del formulario por defecto

    const username = document.getElementById('username').value; // Obtener el valor del campo de nombre de usuario
    console.log('Valor del campo de nombre de usuario:', username); // Agregar un console.log para depurar

    const password = document.getElementById('password').value;

    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(async function(data) {
        if (data.success) {
            // Redirigir a perfiles.html después de iniciar sesión exitosamente
            window.open(`perfiles.html?user=${username}&currentUser=${username}`, '_blank');
        } else {
            document.getElementById('result').innerText = data.message;
        }
    })
    .catch(error => console.error('Error:', error));
});


// Función para obtener el perfil activo
async function getActiveProfile(username) {
    return new Promise((resolve) => {
        // Obtiene el perfil activo del almacenamiento sincronizado de Chrome
        chrome.storage.sync.get("activeProfile", function(data) {
            const activeProfile = data.activeProfile;
            resolve(activeProfile); // Resuelve la promesa con el perfil activo
        });
    });
}

async function addNavigationProfile(currentUser) {
    try {
        console.log("Usuario actual:", currentUser);

        // Lógica para agregar un nuevo perfil de navegación
        const newProfile = {
            name: "Nuevo Perfil",
            createdBy: currentUser, // Se asegura de que currentUser sea el nombre de usuario
            navigationHistory: [],
            blockedWebsitesArray: [] // Corregido de 'blockedWebsites' a 'blockedWebsitesArray'
        };

        console.log("Nuevo perfil de navegación a agregar:", newProfile);

        // Obtener los perfiles existentes del usuario actual
        let profiles = await getProfiles(currentUser);

        // Verificar si el usuario ya tiene un perfil de navegación
        if (profiles && profiles.length > 0) {
            console.log("El usuario ya tiene un perfil de navegación existente:", profiles[0]);
        } else {
            // Si no tiene un perfil de navegación, creamos uno nuevo basado en el perfil de usuario y lo guardamos
            profiles.push(newProfile);
            await saveProfiles(currentUser, profiles);
            console.log("Nuevo perfil de navegación creado para el usuario:", newProfile.username);
        }
    } catch (error) {
        console.error("Error al agregar un nuevo perfil de navegación:", error);
    }
}

// Función para establecer el perfil activo más reciente
async function setMostRecentActiveProfile(username) {
    // Obtener el perfil activo más reciente del usuario actual
    const mostRecentActiveProfile = await getActiveProfile(username);

    if (mostRecentActiveProfile) {
        // Establecer el perfil activo más reciente
        setUserActiveProfile(mostRecentActiveProfile);
        console.log("Perfil activo más reciente establecido:", mostRecentActiveProfile.username);
    } else {
        console.log("No se encontró ningún perfil activo.");
    }
}

// Escucha mensajes del script de fondo
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "updateBlockedWebsitesSection") {
        updateBlockedWebsitesSection();
    }
});

// Función para actualizar la sección de sitios web bloqueados en el DOM
function updateBlockedWebsitesSection() {
    const blockedWebsitesDiv = document.getElementById("blockedWebsitesDiv");

    while (blockedWebsitesDiv.firstChild) {
        blockedWebsitesDiv.removeChild(blockedWebsitesDiv.firstChild);
    }

    chrome.storage.sync.get("blockedWebsitesArray", function(data) {
        const blockedWebsitesArray = data.blockedWebsitesArray;

        if (blockedWebsitesArray && blockedWebsitesArray.length > 0) {
            blockedWebsitesArray.forEach((website, index) => {
                const websiteDiv = document.createElement("div");
                websiteDiv.classList.add("websiteDiv");

                const websiteDivText = document.createElement("div");
                websiteDivText.classList.add("websiteDivText");
                websiteDivText.textContent = website;

                websiteDiv.appendChild(websiteDivText);

                const deleteButton = document.createElement("button");
                deleteButton.classList.add("delete");
                deleteButton.setAttribute("id", index);

                const trashIcon = document.createElement("i");
                trashIcon.classList.add("fas", "fa-trash");
                trashIcon.setAttribute("id", index);

                deleteButton.appendChild(trashIcon);
                deleteButton.addEventListener("click", unblockURL);

                websiteDiv.appendChild(deleteButton);
                blockedWebsitesDiv.appendChild(websiteDiv);
            });
        } else {
            const nothingBlocked = document.createElement("div");
            nothingBlocked.textContent = "No websites have been blocked";
            nothingBlocked.classList.add("nothingBlocked");
            blockedWebsitesDiv.appendChild(nothingBlocked);
        }
    });
}

// Función para desbloquear un sitio web
function unblockURL(event) {
    const clickedButtonId = event.target.id;

    chrome.storage.sync.get("blockedWebsitesArray", function(data) {
        let blockedWebsitesArray = data.blockedWebsitesArray;

        for (let i = 0; i < blockedWebsitesArray.length; i++) {
            if (clickedButtonId == i) {
                blockedWebsitesArray.splice(i, 1);
                break;
            }
        }

        chrome.storage.sync.set({ blockedWebsitesArray: blockedWebsitesArray }, function() {
            updateBlockedWebsitesSection();
        });
    });
}

