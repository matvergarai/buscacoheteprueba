



window.onload = async function () {
  console.log("Window loaded");
  // Obtener el perfil activo al cargar la página
  const activeProfile = getActiveProfile();
  if (activeProfile) {
      // Insertar el nombre del perfil en el mensaje de bienvenida si el elemento existe
      insertUsernameSpan(activeProfile.username);
      // Cargar las URLs bloqueadas del perfil activo
      loadBlockedWebsites(activeProfile.username); // Pasar el username del perfil activo
      // Cargar el historial de navegación
      loadHistory();
      // Cargar el historial de navegación del perfil activo
      loadNavigationHistory();
      // Guardar las URLs bloqueadas en el almacenamiento sincronizado si el perfil de navegación activo pertenece al usuario actual
      saveBlockedWebsitesToSyncStorage(activeProfile.username);
      loadBlockedWebsites(username);
      loadActiveProfile();
  }
};



function loadActiveProfile() {
  const activeProfile = getActiveProfileName();
  if (activeProfile) {
      username = activeProfile;
      updateActiveProfile({ username: username }); // Actualizar el perfil activo
      addNavigationProfilesForUser(username); // Agregar el perfil de navegación si no existe
  }
}

// Función para obtener el perfil activo
function getActiveProfileName() {
  const urlParams = new URLSearchParams(window.location.search);
  const profileParam = urlParams.get('profile');

  if (profileParam) {
      try {
          // Parsear el parámetro 'profile' como JSON
          const profile = JSON.parse(decodeURIComponent(profileParam));
          // Obtener el nombre del perfil
          const profileName = profile.name || '';
          return profileName;
      } catch (error) {
          console.error("Error parsing profile parameter:", error);
          return null;
      }
  } else {
      return null;
  }
}

// Obtener el nombre del perfil activo
const username = getActiveProfileName();

async function loadNavigationHistory() {
  const historyTable = document.getElementById("historyTable");
  const historyTableBody = historyTable.querySelector("tbody");

  // Obtener el historial de navegación
  chrome.history.search({text: '', maxResults: 10}, function(data) {
      data.forEach(function(page) {
          const row = document.createElement("tr");
          const titleCell = document.createElement("td");
          titleCell.textContent = page.title;
          const urlCell = document.createElement("td");
          urlCell.textContent = page.url;

          row.appendChild(titleCell);
          row.appendChild(urlCell);
          historyTableBody.appendChild(row);
      });
  });
}

var blockButton = document.getElementById("blockButton");
blockButton.onclick = function () {
  console.log("Block button clicked");
  getWebsiteInput();
};



// Cargar las URLs bloqueadas del perfil activo
loadBlockedWebsites(username);

// Actualizar la sección de historial de navegación
loadHistory();

// Función para actualizar el perfil activo
function updateActiveProfile(profile) {
  document.getElementById('profileTitle').textContent = profile.username;
  document.getElementById('perfilActual').value = JSON.stringify(profile);
}

// Función para obtener la entrada de la URL del sitio web
function getWebsiteInput() {
  console.log("Getting website input");
  var websiteInput = document.getElementById("websiteInput").value;
  // Si el usuario hace clic en el botón -Bloquear- sin ingresar una entrada -> Alerta de error
  if (!websiteInput) {
      console.log("Error: please enter a website URL");
      alert("Error: Por favor, ingrese una URL");
  } else {
      console.log("Website input:", websiteInput);
      // Llamar a la función para bloquear la URL con el nombre de usuario del perfil activo
      bloquearURL(websiteInput, username);
      // Limpiar y enfocar el campo de entrada después de bloquear
      document.getElementById("websiteInput").value = "";
      document.getElementById("websiteInput").focus();
  }
}

// Función para bloquear una URL
function bloquearURL(url, username) {
  // Extraer el hostname de la URL
  let hostname = obtenerHostname(url);

  // Transformar el hostname al formato "example.com"
  hostname = formatoExampleCom(hostname);

  // Concatenar el nombre de usuario al hostname
  const blockedHostname = username + '-' + hostname;

  // Guardar la URL bloqueada en el almacenamiento local del perfil activo
  chrome.storage.local.get(username, function(data) {
    const blockedWebsitesArray = data[username] || [];
    if (!blockedWebsitesArray.includes(blockedHostname)) {
      blockedWebsitesArray.push(blockedHostname);
      const newData = {};
      newData[username] = blockedWebsitesArray;
      chrome.storage.local.set(newData, function() {
        console.log("URL bloqueada por", username + ":", blockedHostname);
        // Llamar a la función para actualizar la lista de URLs bloqueadas en el panel
        updateBlockedWebsitesSection(username); // Pasar el username
        // Guardar las URLs bloqueadas en el almacenamiento sincronizado si el perfil de navegación activo pertenece al usuario actual
        saveBlockedWebsitesToSyncStorage(username);
      });
    } else {
      console.log("URL ya bloqueada por", username + ":", blockedHostname);
      alert("URL ya bloqueada por " + username);
    }
  });
}


// Función para actualizar la sección de URLs bloqueadas
function updateBlockedWebsitesSection(username) {
  console.log("Updating blocked websites section for", username);
  // Retrieve the blockedWebsitesDiv
  const blockedWebsitesDiv = document.getElementById("blockedWebsitesDiv");
  // Clear the blockedWebsitesDiv by removing all its child elements
  blockedWebsitesDiv.innerHTML = "";

  // Get the stored array of blocked websites for the specific profile
  chrome.storage.local.get(username, function(data) {
      const blockedWebsitesArray = data[username] || [];
      console.log("Blocked websites array for", username, ":", blockedWebsitesArray);
      // Check if the array is empty
      if (blockedWebsitesArray.length > 0) {
          // then iterate through each item in the stored array of Blocked Websites
          blockedWebsitesArray.forEach((blockedHostname, index) => {
              // Extract hostname from the concatenated string
              const hostname = blockedHostname.split("-")[1];
              // Create a new div for each URL
              const websiteDiv = document.createElement("div");
              // Add class (for styling) to websiteDiv block
              websiteDiv.classList.add("websiteDiv");
              // Create div for 'website text'
              const websiteDivText = document.createElement("div");
              websiteDivText.classList.add("websiteDivText");
              websiteDivText.textContent = hostname;
              // Append the websiteDivText to websiteDiv
              websiteDiv.appendChild(websiteDivText);
              // Create the unblock button
              const unblockButton = document.createElement("button");
              unblockButton.classList.add("unblock"); // Add your CSS class for styling the unblock button
              // Set the data-index attribute to store the index of the blocked URL
              unblockButton.dataset.index = index;
              unblockButton.textContent = 'Desbloquear';
              // Add onClick function to each unblock button
              unblockButton.addEventListener("click", function () {
                  unblockURL(index, username);
              });
              // Append the unblock button to the websiteDiv
              websiteDiv.appendChild(unblockButton);
              // Append the websiteDiv to the blockedWebsitesDiv
              blockedWebsitesDiv.appendChild(websiteDiv);
          });
      } else {
          // If the array is empty, create the message element
          const nothingBlocked = document.createElement("div");
          nothingBlocked.textContent = "No hay URLs bloqueadas";
          nothingBlocked.classList.add("nothingBlocked");
          blockedWebsitesDiv.appendChild(nothingBlocked);
          console.log("No websites have been blocked for", username);
      }
  });
}

// Función para desbloquear una URL
function unblockURL(index, username) {
  console.log("Unblocking URL for", username);
  // Get the stored array of blocked websites for the specific profile
  chrome.storage.local.get(username, function(data) {
      let blockedWebsitesArray = data[username] || [];
      // Remove the URL at the specified index
      blockedWebsitesArray.splice(index, 1);
      // Save the updated array back to Chrome storage
      chrome.storage.local.set({ [username]: blockedWebsitesArray }, function () {
          console.log("Blocked websites array updated for", username, ":", blockedWebsitesArray);
          // Update UI
          updateBlockedWebsitesSection(username);
          // Guardar las URLs bloqueadas en el almacenamiento sincronizado si el perfil de navegación activo pertenece al usuario actual
          saveBlockedWebsitesToSyncStorage(username);
      });
  });
}

// Función para obtener el hostname de una URL
function obtenerHostname(url) {
  try {
      // Agregar un esquema a la URL si no tiene uno
      const urlWithScheme = url.startsWith("http") ? url : "http://" + url;
      // Crear una URL válida
      const validUrl = new URL(urlWithScheme);
      // Obtener solo el hostname
      let hostname = validUrl.hostname;
      // Remover "www." del hostname si existe
      hostname = hostname.replace(/^www\./, '');
      return hostname;
  } catch (error) {
      console.error("Error al obtener el hostname:", error);
      return null; // Devolver null en caso de error
  }
}

// Función para formatear el hostname
function formatoExampleCom(hostname) {
  // Remover el protocolo "https://" si existe
  hostname = hostname.replace(/^https?:\/\//, '');
  // Remover "www." si existe
  hostname = hostname.replace(/^www\./, '');
  return hostname;
}

// Función para cargar el historial de navegación
function loadHistory() {
  const historyTable = document.getElementById("historyTable");
  if (!historyTable) return; // Verificar que el elemento exista

  // Limpiar la tabla antes de cargar el historial
  historyTable.innerHTML = "";

  // Obtener el historial de navegación
  chrome.history.search({ text: '', maxResults: 10 }, function(data) {
      data.forEach(function(page) {
          const row = document.createElement("tr");

          // Celda para el título de la página
          const titleCell = document.createElement("td");
          titleCell.textContent = page.title || "Sin título";
          row.appendChild(titleCell);

          // Celda para la URL de la página
          const urlCell = document.createElement("td");
          urlCell.textContent = page.url;
          row.appendChild(urlCell);

          // Agregar la fila a la tabla
          historyTable.appendChild(row);
      });
  });
}

// Función para guardar las URLs bloqueadas en el almacenamiento sincronizado
function saveBlockedWebsitesToSyncStorage(username) {
  // Verificar si el perfil de navegación está activo
  const activeProfile = getActiveProfile();
  if (activeProfile && activeProfile.username === username) {
      // Obtener las URLs bloqueadas del almacenamiento local
      chrome.storage.local.get(username, function(data) {
          const blockedWebsitesArray = data[username] || [];
          
          // Guardar las URLs bloqueadas en el almacenamiento sincronizado
          chrome.storage.sync.set({ [username]: blockedWebsitesArray }, function() {
              console.log("Blocked websites synced for", username);
          });
      });
  }
}

async function addNavigationProfilesForUser(username) {
  // Obtener el usuario actual
  const currentUser = await getCurrentUser();

  // Verificar si se obtuvo el usuario actual correctamente
  if (currentUser) {
      // Verificar si el usuario ya tiene perfiles de navegación
      const navigationProfiles = await getNavigationProfiles(currentUser);

      // Verificar si el perfil de navegación ya existe
      const existingProfile = navigationProfiles.find(profile => profile.username === username);
      if (existingProfile) {
          console.log("El perfil de navegación ya existe para el usuario:", existingProfile);
      } else {
          // Crear un nuevo perfil de navegación y guardarlo
          const newNavigationProfile = { username: username, createdBy: currentUser };
          navigationProfiles.push(newNavigationProfile);
          await saveNavigationProfiles(currentUser, navigationProfiles);
          console.log("Nuevo perfil de navegación creado:", newNavigationProfile);
      }
  } else {
      console.log("No se pudo obtener el usuario actual.");
  }
}

async function getCurrentUser() {
  return new Promise((resolve, reject) => {
      chrome.identity.getProfileUserInfo((userInfo) => {
          if (userInfo && userInfo.email) {
              resolve(userInfo.email);
          } else {
              reject("No se pudo obtener la información del usuario.");
          }
      });
  });
}

async function getNavigationProfiles(user) {
  return new Promise((resolve, reject) => {
      chrome.storage.sync.get(user, (data) => {
          const profiles = data[user] || [];
          resolve(profiles);
      });
  });
}

async function saveNavigationProfiles(user, profiles) {
  return new Promise((resolve, reject) => {
      const data = {};
      data[user] = profiles;
      chrome.storage.sync.set(data, () => {
          resolve();
      });
  });
}

function loadBlockedWebsites(profileName) {
  console.log("Loading blocked websites for", profileName);
  // Retrieve the blockedWebsitesDiv
  const blockedWebsitesDiv = document.getElementById("blockedWebsitesDiv");
  // Clear the blockedWebsitesDiv by removing all its child elements
  blockedWebsitesDiv.innerHTML = "";
  // Get the stored array of blocked websites for the specific profile from local storage
  chrome.storage.local.get(profileName, function(data) {
      const blockedWebsitesArray = data[profileName] || [];
      console.log("Blocked websites array for", profileName, ":", blockedWebsitesArray);
      // Check if the array is empty
      if (blockedWebsitesArray.length > 0) {
          // then iterate through each item in the stored array of Blocked Websites
          blockedWebsitesArray.forEach((blockedHostname, index) => {
              // Create a new div for each URL
              const websiteDiv = document.createElement("div");
              // Add class (for styling) to websiteDiv block
              websiteDiv.classList.add("websiteDiv");
              // Create div for 'website text'
              const websiteDivText = document.createElement("div");
              websiteDivText.classList.add("websiteDivText");
              // Extract hostname from the concatenated string
              const hostname = blockedHostname.split("-")[1];
              websiteDivText.textContent = hostname;
              // Append the websiteDivText to websiteDiv
              websiteDiv.appendChild(websiteDivText);
              // Create the unblock button
              const unblockButton = document.createElement("button");
              unblockButton.classList.add("unblock"); // Add your CSS class for styling the unblock button
              // Set the data-index attribute to store the index of the blocked URL
              unblockButton.dataset.index = index;
              unblockButton.textContent = 'Desbloquear';
              // Add onClick function to each unblock button
              unblockButton.addEventListener("click", function () {
                  unblockURL(index, profileName);
              });
              // Append the unblock button to the websiteDiv
              websiteDiv.appendChild(unblockButton);
              // Append the websiteDiv to the blockedWebsitesDiv
              blockedWebsitesDiv.appendChild(websiteDiv);
          });
      } else {
          // If the array is empty, create the message element
          const nothingBlocked = document.createElement("div");
          nothingBlocked.textContent = "No hay URLs bloqueadas";
          nothingBlocked.classList.add("nothingBlocked");
          blockedWebsitesDiv.appendChild(nothingBlocked);
          console.log("No websites have been blocked for", profileName);
      }
  });
}


document.addEventListener("DOMContentLoaded", function() {
  const buscarFormulario = document.getElementById("buscar-formulario");
  const resultadosDiv = document.getElementById("resultados");

  buscarFormulario.addEventListener("submit", function(event) {
      event.preventDefault(); // Prevenir el envío del formulario

      // Obtener el tema de búsqueda
      const tema = document.getElementById("tema").value;

      // Realizar la solicitud POST al servidor para buscar URLs
      fetch("http://localhost:5000/buscar", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({ tema: tema })
      })
      .then(response => response.json())
      .then(data => {
          // Limpiar los resultados anteriores
          resultadosDiv.innerHTML = "";

          // Mostrar los nuevos resultados
          if (data.hasOwnProperty("urls_encontradas") && data.urls_encontradas.length > 0) {
            const listaResultados = document.createElement("ul");
            data.urls_encontradas.forEach(function(urlEncontrada) {
                const listItem = document.createElement("li");
                const bloquearBoton = document.createElement("button"); // Botón de bloqueo
                bloquearBoton.innerText = "Bloquear";
                bloquearBoton.addEventListener("click", function() {
                    // Simular la entrada de la URL en el input y hacer clic en el botón bloquear
                    const urlFormateada = formatoExampleCom(urlEncontrada.url);
                    websiteInput.value = urlFormateada;
                    blockButton.click();
                });
                listItem.innerHTML = `<a href="${urlEncontrada.url}" target="_blank">${urlEncontrada.titulo}</a>: ${urlEncontrada.descripcion}`;
                listItem.appendChild(bloquearBoton); // Agregar el botón al elemento de la lista
                listaResultados.appendChild(listItem);
            });
            resultadosDiv.appendChild(listaResultados);
        } else {
            resultadosDiv.innerHTML = "<p>No se encontraron URLs relacionadas.</p>";
        }
      })
      .catch(error => {
          console.error("Error:", error);
          resultadosDiv.innerHTML = "<p>Ocurrió un error al buscar las URLs.</p>";
      });
  });
});

