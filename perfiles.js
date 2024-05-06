console.log("Script perfiles.js cargado"); // Añadido para verificar la carga del script

document.addEventListener('DOMContentLoaded', function() {
    // Llama a la función para mostrar el mensaje de bienvenida con el nombre de usuario
    showWelcomeMessage();
});

function showWelcomeMessage() {
    console.log("Ejecutando showWelcomeMessage()"); // Añadido para verificar la ejecución
    // Recupera el nombre de usuario del almacenamiento local
    chrome.storage.local.get(['currentUser'], function(result) {
        // Verifica si hay un nombre de usuario almacenado
        if (result.currentUser) {
            // Muestra el mensaje de bienvenida con el nombre de usuario almacenado
            document.getElementById('welcomeMessage').innerText = `¡Bienvenido, ${result.currentUser}!`;
        } else {
            // Si no hay nombre de usuario almacenado, muestra un mensaje genérico
            document.getElementById('welcomeMessage').innerText = "¡Bienvenido!";
        }
    });
}


async function deleteAllNavigationProfiles() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.remove("navigationProfiles", function() {
            console.log("Todos los perfiles de navegación eliminados");
            resolve();
        });
    });
}

// Función para guardar un perfil de navegación asociado al usuario activo
async function addNavigationProfileForCurrentUser(navigationProfile) {
    // Obtener el perfil de usuario activo
    const activeProfile = await getActiveProfile();
    if (!activeProfile) {
        console.error("No se ha establecido ningún perfil activo de usuario.");
        return;
    }

    // Obtener todos los perfiles de navegación asociados al usuario activo
    const navigationProfiles = await getNavigationProfiles(activeProfile.username);

    // Verificar si el perfil de navegación ya existe
    if (navigationProfiles.some(np => np.name === navigationProfile.name)) {
        console.error("El perfil de navegación ya existe para el usuario activo.");
        return;
    }

    // Agregar el nuevo perfil de navegación
    navigationProfiles.push(navigationProfile);

    // Guardar los perfiles de navegación actualizados
    await saveNavigationProfiles(activeProfile.username, navigationProfiles);

    console.log("Perfil de navegación agregado:", navigationProfile.name);

    // Recargar los perfiles de navegación del usuario activo
    loadNavigationProfilesForActiveUser(activeProfile.username);
}

async function addNavigationProfileForCurrentUser() {
    // Obtener el perfil de usuario activo más reciente
    const mostRecentActiveProfile = await getActiveProfile();

    // Verificar si se proporcionó un perfil activo
    if (!mostRecentActiveProfile || !mostRecentActiveProfile.username) {
        console.error("No se puede obtener el perfil activo más reciente.");
        return;
    }

    // Obtener el nombre del perfil de usuario activo
    const profileName = mostRecentActiveProfile.username;

    // Obtener el nombre del perfil de navegación ingresado por el usuario
    const navigationProfileNameInput = document.getElementById("navigationProfileNameInput");
    const navigationProfileName = navigationProfileNameInput.value.trim();

    // Verificar si se proporcionó un nombre de perfil de navegación
    if (!navigationProfileName) {
        console.error("El nombre del perfil de navegación no puede estar vacío.");
        return;
    }

    // Crear el nuevo perfil de navegación
    const newNavigationProfile = {
        name: navigationProfileName,
        perfilesDeNavegacion: [],
        navigationHistory: [] // Inicialmente, no hay historial de navegación
    };

    try {
        // Actualizar el documento del usuario con el nuevo perfil de navegación
        await Usuario.findOneAndUpdate(
            { username: profileName },
            { $push: { navigationProfiles: newNavigationProfile } }
        );

        console.log("Nuevo perfil de navegación agregado:", newNavigationProfile);
    } catch (error) {
        console.error("Error al agregar el perfil de navegación:", error);
        return;
    }

    // Limpiar el campo de entrada del nombre del perfil de navegación
    navigationProfileNameInput.value = "";

    // Actualizar la interfaz de usuario si es necesario
}

// Función para cargar los perfiles de navegación del usuario activo

// Función para guardar perfiles de navegación en el almacenamiento local


// Función para obtener perfiles de navegación del almacenamiento local
async function getNavigationProfiles() {
    const currentUser = await getCurrentUser();
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(`${currentUser}_navigationProfiles`, function(data) {
            const navigationProfiles = data[`${currentUser}_navigationProfiles`] || [];
            resolve(navigationProfiles);
        });
    });
}

function getStorageKeyForNavigationProfiles(currentUser) {
    return `navigationProfiles_${currentUser}`;
}

async function getNavigationProfilesForCurrentUser() {
    const currentUser = await getCurrentUser();
    const storageKey = getStorageKeyForNavigationProfiles(currentUser);
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(storageKey, function(result) {
            const navigationProfiles = result[storageKey] || [];
            console.log("Perfiles de navegación obtenidos para el usuario actual:", navigationProfiles);
            resolve(navigationProfiles);
        });
    });
}

// Función para obtener la clave de almacenamiento de perfiles de navegación
function getNavigationStorageKey(username) {
    return `navigationProfiles_${username}`;
}

function createDeleteButton(profileName) {
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Eliminar";
    deleteButton.className = "deleteButton";
    deleteButton.dataset.profileName = profileName; // Guardar el nombre del perfil como un atributo de datos
    return deleteButton;
}

window.onload = async function() {
    await loadProfilesDropdown();

    // Obtener el usuario actual
    const currentUser = await getCurrentUser();

    // Cargar el perfil activo más reciente para el usuario actual
    await setMostRecentActiveProfile(currentUser);

    // Función para normalizar la URL
    function normalizeURL(url) {
        return url.replace(/^www\./i, "");
    }

    

    async function setMostRecentActiveProfile(username) {
        // Obtener el perfil del usuario que inicia sesión
        const userActiveProfile = { username: username }; // Simplemente crea el objeto con el nombre de usuario
    
        // Establecer el perfil activo para el usuario que inicia sesión
        setUserActiveProfile(userActiveProfile);
        console.log("Perfil activo más reciente establecido:", username);
    }

    async function getProfileByUsername(username) {
        return new Promise((resolve, reject) => {
            const storageKey = getStorageKey(username);
            // Obtener el perfil del usuario del almacenamiento sincronizado
            chrome.storage.sync.get(storageKey, function(data) {
                const userProfiles = data[storageKey];
                if (userProfiles && userProfiles.length > 0) {
                    // Devolver el primer perfil del usuario (podría haber varios, aunque lo normal es solo uno)
                    resolve(userProfiles[0]);
                } else {
                    reject("No se encontraron perfiles para el usuario: " + username);
                }
            });
        });
    }

    async function getProfiles(username) {
        return new Promise(resolve => {
            const storageKey = getStorageKey(username);
            chrome.storage.sync.get(storageKey, function(data) {
                const profiles = data[storageKey] || [];
                resolve(profiles);
            });
        });
    }

    function setUserActiveProfile(userProfile) {
        // Guardar el perfil de usuario en el almacenamiento sincronizado de Chrome
        chrome.storage.sync.set({ activeProfile: userProfile }, function() {
            console.log("Perfil de usuario activo establecido:", userProfile.username);
        });
    }

    

    

    async function loadActiveProfile() {
        const profileTitle = document.getElementById("profileTitle");
        if (!profileTitle) return;
    
        const activeProfile = await getActiveProfile();
        if (activeProfile) {
            profileTitle.textContent = activeProfile.createdBy || "Ninguno";
        } else {
            profileTitle.textContent = "Ninguno";
        }
    }
    
    // Listener para el evento 'DOMContentLoaded' que se ejecuta cuando el DOM ha sido completamente cargado
    document.addEventListener('DOMContentLoaded', function() {
        // Llama a la función para mostrar el perfil activo al cargar la página
        loadActiveProfile();
    });

    async function getActiveProfile(username) {
        return new Promise((resolve) => {
            // Obtiene el perfil activo del almacenamiento sincronizado de Chrome
            chrome.storage.sync.get("activeProfile", function(data) {
                const activeProfile = data.activeProfile;
                resolve(activeProfile); // Resuelve la promesa con el perfil activo
            });
        });
    }

    function getStorageKey(username) {
        return `profiles_${username}`;
    }

    // Llamar a la función al cargar la extensión
    addProfileForCurrentUser();

    async function shouldBlockWebsite(url) {
        return new Promise((resolve) => {
            if (typeof url === 'string' && url.trim() !== '') {
                const currentHostname = normalizeURL(new URL(url).hostname);
                chrome.storage.sync.get("blockedWebsitesArray", function(data) {
                    const blockedUrls = data.blockedWebsitesArray || [];
                    resolve(blockedUrls.includes(currentHostname) || blockedUrls.includes(normalizeURL(currentHostname)));
                });
            } else {
                // Si url no es una cadena válida, resolvemos con false
                resolve(false);
            }
        });
    }

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

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const currentTab = tabs[0];
        const url = currentTab.url;
        shouldBlockWebsite(url).then(shouldBlock => {
            if (shouldBlock) {
                createBlockedPage();
            }
        });
    });

    // Crear la página de bloqueo dinámicamente
    function createBlockedPage() {
        const blockedPage = generateHTML();
        const style = generateSTYLING();
        // Inyectar los estilos y la página bloqueada en el documento actual
        document.head.insertAdjacentHTML("beforeend", style);
        document.body.innerHTML = blockedPage;
    }

    // Generar los estilos
    function generateSTYLING() {
        return `
        <style>
        body {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important; /* Añadido para centrar verticalmente */
            height: 100vh !important;
            margin: 0 !important;
            background-color: #174b42 !important;
            font-family: 'Noto Serif', serif !important;
        }
        h1 {
            font-size: 3em !important;
            color: white !important;
        }
        </style>
        `;
    }

    // Generar la página bloqueada
    function generateHTML() {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Site Blocked</title>
            <!-- Cambiado a la fuente Google predeterminada -->
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" rel="stylesheet">
        </head>
        <body>
            <h1>Site Blocked</h1>
        </body>
        </html>
        `;
    }

    // Función para cargar perfiles desde almacenamiento
    function loadProfilesDropdown() {
        const profileSelect = document.getElementById("profileSelect");
        if (!profileSelect) return; // Verificar que el elemento exista

        profileSelect.innerHTML = ""; // Limpiar el menú desplegable
        chrome.storage.sync.get("profiles", function(data) {
            const profiles = data.profiles || [];
            profiles.forEach(function(profile) {
                const option = document.createElement("option");
                option.value = profile.username; // Usar solo el nombre de usuario
                option.textContent = profile.username; // Usar solo el nombre de usuario
                profileSelect.appendChild(option);
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', async function() {
    console.log("DOMContentLoaded event listener registrado");

    try {
        // Obtener el usuario actual
        const currentUser = await getCurrentUser();
        console.log("Usuario actual:", currentUser);

        // Cargar los perfiles de navegación del usuario activo al cargar la página
        await loadNavigationProfilesForActiveUser(currentUser);
    } catch (error) {
        console.error("Error al obtener el usuario actual:", error);
    }
});

// Función para obtener el usuario actual
async function getCurrentUser() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get("currentUser", function(data) {
            const currentUser = data.currentUser;
            console.log("Usuario actual:", currentUser);
            resolve(currentUser);
        });
    });
}

// Función para cargar los perfiles del usuario activo
async function loadProfilesForActiveUser(activeUser) {
    return new Promise((resolve) => {
        const profileList = document.getElementById("navigationProfileList");
        if (!profileList) {
            console.error("Elemento 'navigationProfileList' no encontrado en el DOM.");
            resolve(); // Resuelve la promesa sin hacer nada más si el elemento no se encuentra
            return;
        }

        profileList.innerHTML = ""; // Limpiar la lista antes de cargar los perfiles

        // Obtener perfiles del usuario activo del almacenamiento local
        chrome.storage.local.get("profiles", function(data) {
            const profiles = data.profiles || [];

            // Filtrar los perfiles por el usuario activo
            const activeUserProfiles = profiles.filter(profile => profile.createdBy === activeUser);

            // Recorrer los perfiles y crear elementos para mostrarlos
            activeUserProfiles.forEach(function(profile, index) {
                const li = document.createElement("li");
                const profileName = document.createElement("span");
                profileName.textContent = profile.username; // Mostrar el nombre de usuario

                // Botón para establecer perfil activo
                const setActiveButton = document.createElement("button");
                setActiveButton.textContent = "Establecer como activo";
                setActiveButton.onclick = function(event) {
                    event.stopPropagation(); // Evitar que el clic se propague al li y active su evento onclick
                    setActiveProfile(profile);
                };

                // Botón para editar perfil
                const editButton = document.createElement("button");
                editButton.textContent = "Editar";
                editButton.onclick = function(event) {
                    event.stopPropagation(); // Evitar que el clic se propague al li y active su evento onclick
                    editProfile(profile, index);
                };

                // Botón para eliminar perfil
                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Eliminar";
                deleteButton.onclick = function(event) {
                    event.stopPropagation(); // Evitar que el clic se propague al li y active su evento onclick
                    deleteProfile(profile, index);
                };

                // Agregar elementos al li
                li.appendChild(profileName);
                li.appendChild(setActiveButton);
                li.appendChild(editButton);
                li.appendChild(deleteButton);

                // Redirigir al panel del perfil seleccionado al hacer clic en el nombre
                li.onclick = function() {
                    setActiveProfile(profile);
                };

                // Agregar el li a la lista de perfiles
                profileList.appendChild(li);
            });

            resolve(); // Resolver la promesa después de cargar los perfiles del usuario activo
        });
    });
}


// Función para establecer un perfil como activo


async function deleteAllNavigationProfiles() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.remove("navigationProfiles", function() {
            console.log("Todos los perfiles de navegación han sido eliminados.");
            resolve();
        });
    });
}

// Función para inicializar el perfil activo al cargar la página
async function initializeActiveProfile(activeProfile) {
    if (!activeProfile) {
        console.error("No se ha establecido ningún perfil activo.");
        return;
    }

    try {
        // Actualizar la interfaz de usuario para reflejar el perfil activo
        loadProfilesForActiveUser(activeProfile.createdBy);
    } catch (error) {
        console.error("Error al inicializar el perfil activo:", error);
    }
}

// Función para agregar un nuevo perfil
document.addEventListener("DOMContentLoaded", async function() {
    const addProfileButton = document.getElementById("addProfileButton");
    addProfileButton.addEventListener("click", addProfile);

    // Mostrar los perfiles del perfil activo al cargar la página
    await showNavigationProfiles();
});

// Función para cargar y mostrar los perfiles del perfil activo al cargar la página
document.addEventListener("DOMContentLoaded", async function() {
    const addProfileButton = document.getElementById("addProfileButton");
    addProfileButton.addEventListener("click", addProfile);

    const addNavigationProfileButton = document.getElementById("addNavigationProfileButton");
    addNavigationProfileButton.addEventListener("click", addNavigationProfile);
    
    // Cargar y mostrar los perfiles del perfil activo al cargar la página
    loadNavigationProfilesForActiveUser(currentUser);
});

async function addProfile() {
    const mostRecentActiveProfile = await getActiveProfile();

    if (!mostRecentActiveProfile || !mostRecentActiveProfile.username) {
        console.error("No se puede obtener el perfil activo más reciente.");
        return;
    }

    const profileName = mostRecentActiveProfile.username;
    const navigationProfileNameInput = document.getElementById("navigationProfileNameInput");
    const navigationProfileName = navigationProfileNameInput.value.trim();

    if (navigationProfileName === "") {
        console.error("El nombre del perfil de navegación no puede estar vacío.");
        return;
    }

    let navigationProfile = {
        name: navigationProfileName,
        createdBy: currentUser,
        navigationHistory: []
    };

    // Obtener los perfiles de navegación existentes
    let navigationProfiles = await getNavigationProfiles(profileName);

    // Verificar si ya existe un perfil de navegación con el mismo nombre
    if (navigationProfiles.some(profile => profile.name === navigationProfileName)) {
        console.error("Ya existe un perfil de navegación con el mismo nombre.");
        return;
    }

    // Añadir el nuevo perfil a la lista de perfiles de navegación
    navigationProfiles.push(navigationProfile);

    // Guardar los perfiles de navegación actualizados
    await saveNavigationProfiles(navigationProfiles);
    

    console.log("Nuevo perfil de navegación agregado:", navigationProfile);

    // Limpiar el campo de entrada del nombre del perfil de navegación
    navigationProfileNameInput.value = "";

    // Actualizar la lista de perfiles de navegación
    await loadNavigationProfilesForActiveUser(currentUser);

    // Agregar el botón para establecer este perfil como activo
    const profileList = document.getElementById("navigationProfileList");
    const profileListItem = profileList.lastElementChild;
    const setActiveButton = document.createElement("button");
    setActiveButton.textContent = "Establecer como Activo";
    setActiveButton.onclick = () => setProfileAsActive(navigationProfileName);
    profileListItem.appendChild(setActiveButton);
}






async function showNavigationProfiles() {
    const username = await getCurrentUser();

    if (!username) {
        console.error("No se puede obtener el nombre de usuario actual.");
        return;
    }

    const navigationProfiles = await getNavigationProfiles(username);

    const navigationProfileList = document.getElementById("navigationProfileList");

    // Limpiar la lista antes de mostrar los perfiles
    navigationProfileList.innerHTML = "";

    // Recorrer los perfiles y agregarlos a la lista
    navigationProfiles.forEach(profile => {
        const listItem = document.createElement("li");
        listItem.textContent = profile.name;
        navigationProfileList.appendChild(listItem);
    });
}




async function clearLocalStorage() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.clear(function() {
            console.log("Almacenamiento local vaciado.");
            resolve();
        });
    });
}

function showLocalStorage() {
    chrome.storage.local.get(null, function(items) {
      console.log("Contenido del almacenamiento local:");
      console.log(items);
    });
  }

function clearSyncStorage() {
    chrome.storage.sync.clear(function() {
      console.log("El almacenamiento sincronizado ha sido borrado.");
    });
  }



// Función para eliminar un perfil
async function deleteProfile(profile, index) {
    const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar el perfil '${profile.username}'?`);
    if (confirmDelete) {
        // Obtener todos los perfiles
        const profiles = await getProfiles();

        // Eliminar el perfil seleccionado
        profiles.splice(index, 1);

        // Guardar los perfiles actualizados en el almacenamiento local
        await saveProfiles(profiles);

        console.log("Perfil eliminado:", profile.username);

        // Actualizar la interfaz de usuario para reflejar el cambio
        loadProfilesForActiveUser(profile.createdBy);
    }
}

// Función para editar un perfil
async function editProfile(profile, index) {
    const newProfileName = prompt("Ingrese el nuevo nombre de perfil:", profile.username);
    if (newProfileName === null || newProfileName.trim() === "") {
        console.error("El nombre de perfil no puede estar vacío.");
        return;
    }

    // Obtener todos los perfiles
    const profiles = await getProfiles();

    // Verificar si ya existe un perfil con el mismo nombre
    if (profiles.some((p, i) => i !== index && p.username === newProfileName)) {
        console.error("Ya existe un perfil con el mismo nombre.");
        return;
    }

    // Actualizar el nombre del perfil
    profile.username = newProfileName;

    // Guardar los perfiles actualizados en el almacenamiento local
    await saveProfiles(profiles);

    console.log("Perfil editado:", profile.username);

    // Actualizar la interfaz de usuario para reflejar el cambio
    loadProfilesForActiveUser(profile.createdBy);
}

// Función para guardar los perfiles en el almacenamiento local
async function saveProfiles(profiles) {
    return new Promise(resolve => {
        chrome.storage.local.set({ profiles: profiles }, function() {
            console.log("Perfiles guardados:", profiles);
            resolve();
        });
    });
}

// Función para obtener todos los perfiles del almacenamiento local
async function getProfiles() {
    return new Promise(resolve => {
        chrome.storage.local.get("profiles", function(data) {
            const profiles = data.profiles || [];
            resolve(profiles);
        });
    });
}

// Listener para el evento 'click' del botón de agregar perfil de navegación
const addNavigationProfileButton = document.getElementById("addNavigationProfileButton");
if (addNavigationProfileButton) {
    addNavigationProfileButton.addEventListener("click", function() {
        const navigationProfileNameInput = document.getElementById("navigationProfileNameInput");
        if (!navigationProfileNameInput) {
            console.error("Elemento 'navigationProfileNameInput' no encontrado en el DOM.");
            return;
        }

        const navigationProfileName = navigationProfileNameInput.value.trim();

        if (navigationProfileName === "") {
            console.error("El nombre del perfil de navegación no puede estar vacío.");
            return;
        }

        // Crear el perfil de navegación
        const navigationProfile = {
            name: navigationProfileName,
            createdAt: new Date().toISOString(), // Fecha y hora actual
            navigationHistory: [] // Inicialmente, no hay historial de navegación
        };

        // Llamar a la función para agregar el perfil de navegación
        addNavigationProfileForCurrentUser(navigationProfile);

        // Limpiar el campo de entrada del nombre del perfil de navegación
        navigationProfileNameInput.value = "";
    });
} else {
    console.error("El botón 'addNavigationProfileButton' no se ha encontrado en el DOM.");
}

// Listener para el evento 'DOMContentLoaded' que se ejecuta cuando el DOM ha sido completamente cargado
document.addEventListener('DOMContentLoaded', async function() {
    console.log("DOMContentLoaded event listener registrado");

    // Obtener el usuario actual
    const currentUser = await getCurrentUser();
    console.log("Usuario actual:", currentUser);

    // Cargar los perfiles de navegación del usuario activo al cargar la página
    loadNavigationProfilesForActiveUser(currentUser);
});

async function loadNavigationProfilesForActiveUser(currentUser) {
    try {
        const navigationProfiles = await getNavigationProfiles(currentUser);
        const navigationProfileList = document.getElementById("navigationProfileList");
        if (!navigationProfileList) {
            console.error("Elemento 'navigationProfileList' no encontrado en el DOM.");
            return;
        }
        // Limpiar la lista antes de cargar los perfiles
        navigationProfileList.innerHTML = "";
        navigationProfiles.forEach(profile => {
            // Crear un elemento de lista
            const listItem = document.createElement("li");
            
            // Crear un botón para establecer como perfil activo
            const setActiveButton = document.createElement("button");
            setActiveButton.textContent = "Establecer como perfil activo";
            setActiveButton.addEventListener("click", async () => {
                await setProfileAsActive(currentUser, profile); // Llamada a la función
            });

            // Crear un botón para editar el perfil
            const editButton = document.createElement("button");
            editButton.textContent = "Editar";
            editButton.addEventListener("click", () => {
                editProfile(profile);
            });

            // Crear un botón para eliminar el perfil
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Eliminar";
            deleteButton.addEventListener("click", async () => {
                await deleteProfile(currentUser, profile);
            });

            // Botón para ir al panel de bloqueo
            const goToBlockingPanelButton = document.createElement("button");
            goToBlockingPanelButton.textContent = "Ir al panel de bloqueo";
            goToBlockingPanelButton.addEventListener("click", () => {
                redirectToPanel(currentUser, profile.name); // Pasar el nombre del perfil como argumento
            });

            // Agregar los botones al elemento de lista
            listItem.appendChild(document.createTextNode(profile.name));
            listItem.appendChild(setActiveButton);
            listItem.appendChild(editButton);
            listItem.appendChild(deleteButton);
            listItem.appendChild(goToBlockingPanelButton);

            // Agregar el elemento de lista a la lista
            navigationProfileList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Error al cargar los perfiles de navegación:", error);
    }
}

function redirectToPanel(currentUser, profileName) {
    const profileParam = encodeURIComponent(JSON.stringify({ name: profileName }));
    const userParam = encodeURIComponent(JSON.stringify(currentUser));
    window.location.href = `panel.html?user=${userParam}&profile=${profileParam}`;
}   


async function setProfileAsActive(currentUser, profile) {
    if (!currentUser) {
        console.error("No se puede obtener el usuario actual.");
        return;
    }
    try {
        // Obtener las URLs bloqueadas del perfil de navegación desde el almacenamiento local
        const blockedWebsites = await getBlockedWebsites(profile.name);

        // Guardar las URLs bloqueadas en el almacenamiento sincronizado
        await saveBlockedWebsitesToSyncStorage(currentUser, profile.name, blockedWebsites);

        

        // Mostrar un mensaje indicando que el perfil se ha establecido como activo
        const messageDiv = document.getElementById("profileStatusMessage");
        messageDiv.textContent = `Perfil '${profile.name}' establecido como activo.`;

        // Resto del código para establecer el perfil activo...
    } catch (error) {
        console.error("Error al establecer el perfil como activo:", error);
    }
}


async function getBlockedWebsites(profileName) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(profileName, function(data) {
            const blockedWebsitesArray = data[profileName] || [];
            resolve(blockedWebsitesArray);
        });
    });
}

function showSyncStorage() {
    chrome.storage.sync.get(null, function(data) {
      console.log("Contenido del almacenamiento sincronizado:");
      console.log(data);
    });
  }

  async function saveBlockedWebsitesToSyncStorage(currentUser, profileName, blockedWebsites) {
    // Verificar si blockedWebsites es un objeto
    if (typeof blockedWebsites === 'object' && blockedWebsites !== null) {
        // Extraer solo los valores (sitios web) del objeto blockedWebsites
        const blockedWebsitesArray = Object.values(blockedWebsites);
        
        // Eliminar el prefijo del perfil de las URLs bloqueadas y extraerlas
        const cleanedBlockedWebsites = blockedWebsitesArray.map(url => {
            // Obtener el hostname eliminando el prefijo del perfil
            return url.split("-")[1];
        });

        // Guardar las URLs bloqueadas actualizadas en el almacenamiento sincronizado
        chrome.storage.sync.set({ blockedWebsitesArray: cleanedBlockedWebsites }, function () {
            console.log("URLs bloqueadas del perfil", profileName, "cargadas en blockedWebsitesArray en el almacenamiento sincronizado.");
        });
    } else {
        console.error("Blocked websites no es un objeto o está vacío.");
        return Promise.reject("Blocked websites no es un objeto o está vacío.");
    }
}


async function setActiveProfile(profileName) {
    const currentUser = await getCurrentUser();
    console.log("Estableciendo el perfil activo:", profileName);
    const navigationProfiles = await getNavigationProfiles(currentUser);
    const updatedProfiles = navigationProfiles.map(profile => ({
        ...profile,
        isActive: profile.name === profileName
    }));
    await saveNavigationProfiles(currentUser, updatedProfiles);
    console.log("Perfil activo establecido:", profileName);
}






function updateActiveProfileUI(profileName) {
    // Actualizar la interfaz de usuario para mostrar el perfil activo
    const activeProfileElement = document.getElementById("activeProfile");
    activeProfileElement.textContent = profileName;
}

// Listener para el evento 'DOMContentLoaded'
document.addEventListener("DOMContentLoaded", async function() {
    // Cargar los perfiles de navegación al cargar la página
    await loadNavigationProfilesForActiveUser();
});

// Función para establecer un perfil como activo cuando se hace clic en el botón correspondiente
function handleSetActiveProfileClick(profileName) {
    setProfileAsActive(profileName);
}



// Función para editar un perfil
function editProfile(profile) {
    // Aquí puedes implementar la lógica para editar el perfil
    console.log("Editando perfil:", profile.name);
}

// Función para eliminar un perfil
async function deleteProfile(currentUser, profile) {
    try {
        // Obtener los perfiles de navegación actuales
        let navigationProfiles = await getNavigationProfiles(currentUser);
        // Filtrar el perfil a eliminar
        navigationProfiles = navigationProfiles.filter(p => p.name !== profile.name);
        // Guardar los perfiles actualizados
        await saveNavigationProfiles(currentUser, navigationProfiles);
        console.log("Perfil eliminado:", profile.name);
        // Recargar la lista de perfiles
        await loadNavigationProfilesForActiveUser(currentUser);
    } catch (error) {
        console.error("Error al eliminar el perfil:", error);
    }
}

// Función para ir al panel de bloqueo
function goToBlockingPanel(profile) {
    // Aquí puedes implementar la lógica para redirigir al usuario al panel de bloqueo
    console.log("Yendo al panel de bloqueo para el perfil:", profile.name);
}

// Listener para el evento 'DOMContentLoaded'
document.addEventListener("DOMContentLoaded", async function() {
    // Cargar los perfiles de navegación al cargar la página
    const currentUser = await getCurrentUser();
    await loadNavigationProfilesForActiveUser(currentUser);
});

// Listener para el evento click en el botón de agregar perfil
const addProfileButton = document.getElementById("addProfileButton");
addProfileButton.addEventListener("click", addNavigationProfile);

async function addNavigationProfileForCurrentUser(profileName) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        console.error("No se puede obtener el usuario actual.");
        return;
    }

    try {
        let navigationProfiles = await getNavigationProfilesForUser(currentUser);
        
        // Verificar si ya existe un perfil de navegación con el mismo nombre
        if (navigationProfiles.some(profile => profile.name === profileName)) {
            console.error("Ya existe un perfil de navegación con el mismo nombre.");
            return;
        }

        // Añadir el nuevo perfil a la lista de perfiles de navegación
        navigationProfiles.push({
            name: profileName,
            createdAt: new Date().toISOString(),
            navigationHistory: []
        });

        // Guardar los perfiles de navegación actualizados
        await saveNavigationProfilesForUser(currentUser, navigationProfiles);

        console.log("Nuevo perfil de navegación agregado:", profileName);

        // Actualizar la lista de perfiles de navegación en la interfaz
        await loadNavigationProfilesForActiveUser(currentUser);
    } catch (error) {
        console.error("Error al agregar un perfil de navegación:", error);
    }
}

// Listener para el evento 'DOMContentLoaded'
document.addEventListener("DOMContentLoaded", async function() {
    // Cargar los perfiles de navegación al cargar la página
    const currentUser = await getCurrentUser();
    await loadNavigationProfilesForActiveUser(currentUser);
});


// Función para establecer un perfil de navegación como activo
async function setActiveNavigationProfile(navigationProfile) {
    // Guardar el perfil de navegación activo en el almacenamiento local
    chrome.storage.local.set({ activeNavigationProfile: navigationProfile }, function() {
        console.log("Perfil de navegación activo establecido:", navigationProfile.name);
    });
}



async function getActiveProfile(username) {
    return new Promise((resolve) => {
        // Obtiene el perfil activo del almacenamiento sincronizado de Chrome
        chrome.storage.sync.get("activeProfile", function(data) {
            const activeProfile = data.activeProfile;
            resolve(activeProfile); // Resuelve la promesa con el perfil activo
        });
    });
}

async function getCurrentUser() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get("currentUser", function(data) {
            const currentUser = data.currentUser;
            console.log("Usuario actual:", currentUser); // Agregar un console.log para verificar el valor de currentUser
            resolve(currentUser);
        });
    });
}

document.addEventListener("DOMContentLoaded", async function() {
    try {
        // Obtener el usuario actual
        const currentUser = await getCurrentUser();

        // Verificar si se pudo obtener el usuario
        if (!currentUser) {
            console.error("No se pudo obtener el usuario actual.");
            return;
        }

        console.log("Usuario actual:", currentUser);

        // Cargar los perfiles de navegación para el usuario actual
        await loadNavigationProfilesForActiveUser(currentUser);
    } catch (error) {
        console.error("Error en la carga inicial:", error);
    }
});





// Función para editar un perfil de navegación
async function editNavigationProfile(navigationProfile, index) {
    const newProfileName = prompt("Ingrese el nuevo nombre de perfil de navegación:", navigationProfile.name);
    if (newProfileName === null || newProfileName.trim() === "") {
        console.error("El nombre del perfil de navegación no puede estar vacío.");
        return;
    }

    // Obtener todos los perfiles de navegación
    const navigationProfiles = await getNavigationProfiles();

    // Verificar si ya existe un perfil de navegación con el mismo nombre
    if (navigationProfiles.some((p, i) => i !== index && p.name === newProfileName)) {
        console.error("Ya existe un perfil de navegación con el mismo nombre.");
        return;
    }

    // Actualizar el nombre del perfil de navegación
    navigationProfile.name = newProfileName;

    // Guardar los perfiles de navegación actualizados en el almacenamiento local
    await saveNavigationProfiles(navigationProfiles);

    console.log("Perfil de navegación editado:", navigationProfile.name);

    // Actualizar la interfaz de usuario para reflejar el cambio
    loadNavigationProfilesForActiveUser();
}

// Función para eliminar un perfil de navegación

async function deleteAllNavigationProfiles() {
    try {
        // Guardar una lista vacía de perfiles de navegación
        await saveNavigationProfiles([]);
        
        // Recargar la lista de perfiles después de la eliminación
        await loadNavigationProfilesForActiveUser();
    } catch (error) {
        console.error("Error al eliminar todos los perfiles de navegación:", error);
    }
}



// Función para guardar perfiles de navegación en el almacenamiento local


// Función para obtener perfiles de navegación del almacenamiento local
async function getNavigationProfiles(currentUser) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(`${currentUser}_navigationProfiles`, function(data) {
            const navigationProfiles = data[`${currentUser}_navigationProfiles`] || [];
            console.log("Perfiles de navegación obtenidos para el usuario", currentUser, ":", navigationProfiles);

            // Verificar si el arreglo de perfiles de navegación está vacío
            if (navigationProfiles.length === 0) {
                const messageDiv = document.getElementById("navigationProfilesMessage");
                messageDiv.textContent = "No hay perfiles de navegación disponibles";
            } else {
                // Eliminar el mensaje si hay perfiles disponibles
                const messageDiv = document.getElementById("navigationProfilesMessage");
                messageDiv.textContent = "";
            }
            
            resolve(navigationProfiles);
        });
    });
}

document.addEventListener("DOMContentLoaded", function() {
    const addProfileButton = document.getElementById("addProfileButton");
    addProfileButton.addEventListener("click", addProfile);

    const addNavigationProfileButton = document.getElementById("addNavigationProfileButton");
    addNavigationProfileButton.addEventListener("click", addNavigationProfile);

    // Cargar y mostrar los perfiles del perfil activo al cargar la página
    loadNavigationProfilesForActiveUser(currentUser);

    // Listener para el evento 'click' en el botón de eliminar perfil de navegación
    document.addEventListener('click', async function(event) {
        if (event.target && event.target.className === 'deleteButton') {
            const profileName = event.target.dataset.profileName;
            if (!profileName) {
                console.error("No se encontró el nombre del perfil.");
                return;
            }
            try {
                await deleteNavigationProfileForUser(profileName);
            } catch (error) {
                console.error("Error al eliminar el perfil de navegación:", error);
            }
        }
    });
});



// Función para agregar un perfil de navegación y luego cargar todos los perfiles nuevamente
async function addNavigationProfileAndReload(profile) {
    await addNavigationProfile(profile);
    await loadNavigationProfilesForActiveUser();
}

deleteNavigationProfile(www)
    .then(() => {
        console.log("Perfil eliminado exitosamente.");
        // Aquí puedes realizar cualquier acción adicional después de eliminar el perfil
    })
    .catch(error => {
        console.error("Error al intentar eliminar el perfil:", error);
    });

deleteAllNavigationProfiles()
    .then(() => {
        console.log("Todos los perfiles de navegación han sido eliminados.");
        // Aquí puedes realizar cualquier acción adicional después de eliminar todos los perfiles
    })
    .catch(error => {
        console.error("Error al intentar eliminar todos los perfiles de navegación:", error);
    });


    function getStorageKeyForUserProfiles(userId) {
        return "navigationProfiles_" + userId;
    }

    async function saveNavigationProfilesForCurrentUser(navigationProfiles) {
        const currentUser = await getCurrentUser();
        const storageKey = getStorageKeyForNavigationProfiles(currentUser);
        await new Promise((resolve, reject) => {
            chrome.storage.local.set({ [storageKey]: navigationProfiles }, function() {
                console.log("Perfiles de navegación guardados para el usuario actual:", currentUser);
                resolve();
            });
        });
    }
    
    // Función para obtener perfiles de navegación del almacenamiento local del usuario
    async function getNavigationProfilesForUser() {
        const storageKey = getStorageKeyForNavigationProfiles(currentUser.profileentUser);
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(storageKey, function(result) {
                const navigationProfiles = result[storageKey] || [];
                console.log("Perfiles de navegación obtenidos para el usuario", currentUser, ":", navigationProfiles);
                resolve(navigationProfiles);
            });
        });
    }
    
    
    // Función para eliminar perfiles de navegación del almacenamiento local del usuario
    async function deleteNavigationProfilesForUser(userId) {
        const storageKey = getStorageKeyForNavigationProfiles(userId);
        await new Promise((resolve, reject) => {
            chrome.storage.local.remove(storageKey, () => {
                console.log("Perfiles de navegación eliminados para el usuario", userId);
                resolve();
            });
        });
    }

    // Función para agregar un perfil de navegación para el usuario actual
    async function addNavigationProfileForCurrentUser(profile) {
        try {
            const navigationProfiles = await getNavigationProfilesForCurrentUser();
            navigationProfiles.push(profile);
            await saveNavigationProfilesForCurrentUser(navigationProfiles);
            await loadNavigationProfilesForCurrentUser();
        } catch (error) {
            console.error("Error al agregar el perfil de navegación:", error);
        }
    }
    
    // Función para obtener la clave de almacenamiento para los perfiles de navegación del usuario
    function getStorageKeyForUserProfiles(userId) {
        return "navigationProfiles_" + userId;
    }

    // Función para eliminar un perfil de navegación para el usuario actual
    async function deleteNavigationProfileForCurrentUser(profileName) {
        try {
            let navigationProfiles = await getNavigationProfilesForCurrentUser();
            navigationProfiles = navigationProfiles.filter(profile => profile.name !== profileName);
            await saveNavigationProfilesForCurrentUser(navigationProfiles);
            await loadNavigationProfilesForCurrentUser();
        } catch (error) {
            console.error("Error al eliminar el perfil de navegación:", error);
        }
    }

    async function loadNavigationProfilesForCurrentUser() {
        try {
            const navigationProfiles = await getNavigationProfilesForCurrentUser();
            const navigationProfileList = document.getElementById("navigationProfileList");
            if (!navigationProfileList) {
                console.error("Elemento 'navigationProfileList' no encontrado en el DOM.");
                return;
            }
            // Limpiar la lista antes de cargar los perfiles
            navigationProfileList.innerHTML = "";
            navigationProfiles.forEach(profile => {
                const listItem = document.createElement("li");
                listItem.textContent = profile.name;
                const deleteButton = createDeleteButton(profile.name);
                listItem.appendChild(deleteButton);
                navigationProfileList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Error al cargar los perfiles de navegación:", error);
        }
    }
    


async function addNavigationProfile(profile) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("navigationProfiles", function(result) {
            let navigationProfiles = result.navigationProfiles || [];
            navigationProfiles.push(profile);

            chrome.storage.local.set({ navigationProfiles: navigationProfiles }, function() {
                console.log("Nuevo perfil de navegación agregado:", profile);
                resolve();
            });
        });
    });
}

async function saveNavigationProfiles(currentUser, navigationProfiles) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [`${currentUser}_navigationProfiles`]: navigationProfiles }, function() {
            console.log("Perfiles de navegación guardados para el usuario", currentUser);
            resolve();
        });
    });
}



async function deleteNavigationProfileForUser(profileName) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        console.error("No se puede obtener el usuario actual.");
        return;
    }

    try {
        let navigationProfiles = await getNavigationProfilesForUser(currentUser);
        console.log("Perfiles de navegación obtenidos para el usuario", currentUser, ":", navigationProfiles);

        // Buscar el índice del perfil a eliminar
        const index = navigationProfiles.findIndex(profile => profile.name === profileName);
        if (index !== -1) {
            // Eliminar el perfil de navegación del array
            navigationProfiles.splice(index, 1);
            console.log("Perfil de navegación eliminado:", profileName);

            // Guardar los perfiles de navegación actualizados
            await saveNavigationProfilesForUser(currentUser, navigationProfiles);

            // Recargar la lista de perfiles después de eliminar uno
            await loadNavigationProfilesForActiveUser();
        } else {
            console.error("No se encontró el perfil de navegación:", profileName);
        }
    } catch (error) {
        console.error("Error al eliminar el perfil de navegación:", error);
    }
}

    document.addEventListener("DOMContentLoaded", async function() {
        const addProfileButton = document.getElementById("addProfileButton");
        addProfileButton.addEventListener("click", addProfile);
    
        const addNavigationProfileButton = document.getElementById("addNavigationProfileButton");
        addNavigationProfileButton.addEventListener("click", addNavigationProfile);
        
        // Cargar y mostrar los perfiles del perfil activo al cargar la página
        await loadNavigationProfilesForActiveUser();
    });
    
    // Función para agregar un perfil de navegación para el usuario actual
    async function addNavigationProfile() {
        const currentUser = await getCurrentUser();
        const navigationProfileNameInput = document.getElementById("navigationProfileNameInput");
        const navigationProfileName = navigationProfileNameInput.value.trim();
    
        if (navigationProfileName === "") {
            console.error("El nombre del perfil de navegación no puede estar vacío.");
            return;
        }
    
        const navigationProfile = {
            name: navigationProfileName,
            createdAt: new Date().toISOString(),
            navigationHistory: []
        };
    
        let navigationProfiles = await getNavigationProfiles(currentUser);
        
        // Verificar si ya existe un perfil de navegación con el mismo nombre
        if (navigationProfiles.some(profile => profile.name === navigationProfileName)) {
            console.error("Ya existe un perfil de navegación con el mismo nombre.");
            return;
        }
    
        navigationProfiles.push(navigationProfile);
    
        await saveNavigationProfiles(currentUser, navigationProfiles);
    
        console.log("Nuevo perfil de navegación agregado:", navigationProfile);
    
        // Limpiar el campo de entrada del nombre del perfil de navegación
        navigationProfileNameInput.value = "";
    
        // Actualizar la lista de perfiles de navegación
        await loadNavigationProfilesForActiveUser(currentUser);
    }
    
    // Función para eliminar un perfil de navegación del usuario actual
    async function deleteNavigationProfile(profileName) {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            console.error("No se puede obtener el usuario actual.");
            return;
        }
    
        try {
            await deleteNavigationProfileForUser(currentUser, profileName);
            await loadNavigationProfilesForActiveUser(); // Cargar de nuevo los perfiles después de eliminar uno
        } catch (error) {
            console.error("Error al eliminar el perfil de navegación:", error);
        }
    }


    async function saveCurrentUser(currentUser) {
        try {
            await new Promise((resolve, reject) => {
                chrome.storage.sync.set({ "currentUser": currentUser }, function() {
                    resolve();
                });
            });
        } catch (error) {
            console.error("Error al guardar el usuario actualizado:", error);
        }
    }


    async function saveNavigationProfilesForUser(username, navigationProfiles) {
        const storageKey = getStorageKeyForNavigationProfiles(username);
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [storageKey]: navigationProfiles }, function() {
                console.log("Perfiles de navegación guardados para el usuario", username);
                resolve();
            });
        });
    }

    async function saveNavigationProfilesForCurrentUser(navigationProfiles) {
        try {
            const currentUser = await getCurrentUser();
            return new Promise((resolve, reject) => {
                chrome.storage.local.set({ [`${currentUser}_navigationProfiles`]: navigationProfiles }, function() {
                    console.log("Perfiles de navegación guardados para el usuario actual:", navigationProfiles);
                    resolve();
                });
            });
        } catch (error) {
            console.error("Error al guardar los perfiles de navegación:", error);
        }
    }
    
    async function getNavigationProfilesForCurrentUser() {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                console.error("No se puede obtener el usuario actual.");
                return [];
            }
            const storageKey = getStorageKeyForNavigationProfiles(currentUser);
            const result = await new Promise((resolve, reject) => {
                chrome.storage.local.get(storageKey, function(result) {
                    resolve(result);
                });
            });
            const navigationProfiles = result[storageKey] || [];
            console.log("Perfiles de navegación obtenidos para el usuario actual:", navigationProfiles);
            return navigationProfiles;
        } catch (error) {
            console.error("Error al obtener los perfiles de navegación para el usuario actual:", error);
            return [];
        }
    }

    async function loadCurrentUserAndProfiles() {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                console.error("No se pudo obtener el usuario actual.");
                return;
            }
            loadNavigationProfilesForActiveUser(currentUser);
        } catch (error) {
            console.error("Error al cargar el usuario actual y sus perfiles de navegación:", error);
        }
    }
    
    // Llama a la función para cargar el usuario actual y sus perfiles de navegación
    loadCurrentUserAndProfiles();

    

    async function deleteNavigationProfilesForCurrentUser() {
        try {
            const currentUser = await getCurrentUser();
            return new Promise((resolve, reject) => {
                chrome.storage.local.remove(`${currentUser}_navigationProfiles`, () => {
                    console.log("Perfiles de navegación eliminados para el usuario actual:", currentUser);
                    resolve();
                });
            });
        } catch (error) {
            console.error("Error al eliminar los perfiles de navegación:", error);
        }
    }

    // Agregar un perfil de navegación para el usuario actual (solo para prueba)
    async function addNavigationProfileForCurrentUserTest() {
        try {
            const profile = {
                name: "Prueba de Perfil",
                createdAt: new Date().toISOString(),
                navigationHistory: []
            };
            await addNavigationProfileForCurrentUser(profile);
            console.log("Perfil de navegación agregado:", profile);
        } catch (error) {
            console.error("Error al agregar el perfil de navegación:", error);
        }
    }

    
// Función para editar un perfil
function editProfile(profile) {
    // Aquí puedes implementar la lógica para editar el perfil
    console.log("Editando perfil:", profile.name);
}

// Función para eliminar un perfil
async function deleteProfile(currentUser, profile) {
    try {
        // Obtener los perfiles de navegación actuales
        let navigationProfiles = await getNavigationProfiles(currentUser);
        // Filtrar el perfil a eliminar
        navigationProfiles = navigationProfiles.filter(p => p.name !== profile.name);
        // Guardar los perfiles actualizados
        await saveNavigationProfiles(currentUser, navigationProfiles);
        console.log("Perfil eliminado:", profile.name);
        // Recargar la lista de perfiles
        await loadNavigationProfilesForActiveUser(currentUser);
    } catch (error) {
        console.error("Error al eliminar el perfil:", error);
    }
}

// Función para ir al panel de bloqueo
function goToBlockingPanel(profile) {
    // Aquí puedes implementar la lógica para redirigir al usuario al panel de bloqueo
    console.log("Yendo al panel de bloqueo para el perfil:", profile.name);
}

document.addEventListener('DOMContentLoaded', function() {
    // Llama a la función para mostrar el mensaje de bienvenida con el nombre de usuario
    showWelcomeMessage();
});




    
    

    




    document.addEventListener("DOMContentLoaded", async function() {
        const addProfileButton = document.getElementById("addProfileButton");
        addProfileButton.addEventListener("click", addProfile);
    
        const addNavigationProfileButton = document.getElementById("addNavigationProfileButton");
        addNavigationProfileButton.addEventListener("click", addNavigationProfile);
        
        // Cargar y mostrar los perfiles del perfil activo al cargar la página
        await loadNavigationProfilesForActiveUser();
    
        // Obtener todos los elementos <button> dentro de la lista de perfiles de navegación
        const deleteButtons = document.querySelectorAll("#navigationProfileList button");
    
        // Agregar un listener para cada botón de eliminar
        deleteButtons.forEach(button => {
            button.addEventListener("click", async function(event) {
                event.stopPropagation(); // Detener la propagación del evento para evitar conflictos
                const profileName = button.parentElement.textContent.trim(); // Obtener el nombre del perfil
                try {
                    await deleteNavigationProfileForUser(profileName); // Eliminar el perfil
                    await loadNavigationProfilesForActiveUser(); // Volver a cargar los perfiles
                } catch (error) {
                    console.error("Error al eliminar el perfil de navegación:", error);
                }
            });
        });
    });