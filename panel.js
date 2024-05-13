document.addEventListener('DOMContentLoaded', async function() {
  // Obtener el nombre de usuario y el nombre del perfil de los parámetros de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get('username');
  let activeProfile = urlParams.get('profile');

  // Mostrar el nombre de usuario y el nombre del perfil
  const profileNameElement = document.getElementById('profileName');
  profileNameElement.textContent = `Perfil: ${activeProfile}, Usuario: ${username}`;

  // Mostrar las URLs bloqueadas
  await showBlockedUrls(username, activeProfile);

  // Agregar un evento al formulario para bloquear una nueva URL
  const addBlockedUrlForm = document.getElementById('addBlockedUrlForm');
  addBlockedUrlForm.addEventListener('submit', async function(event) {
      event.preventDefault(); // Evitar que se envíe el formulario

      const blockedUrlInput = document.getElementById('blockedUrlInput').value;
      try {
          await blockWebsite(username, activeProfile, blockedUrlInput); // Bloquear la URL
          await showBlockedUrls(username, activeProfile); // Actualizar la lista de URLs bloqueadas
      } catch (error) {
          console.error("Error al bloquear la URL:", error);
          alert("Error al bloquear la URL. Inténtalo de nuevo más tarde.");
      }
  });

  // Mostrar el historial de navegación
  await showNavigationHistory(username, activeProfile);

  // Establecer el perfil activo
  async function setActiveProfile(profileName) {
      try {
          const response = await fetch(`http://localhost:3000/set-active-navigation-profile/${username}/${profileName}`, {
              method: 'POST'
          });
          const data = await response.json();
          if (data.success) {
              activeProfile = profileName;
              profileNameElement.textContent = `Perfil: ${activeProfile}, Usuario: ${username}`;
              await showNavigationHistory(username, activeProfile); // Actualizar el historial de navegación
          } else {
              throw new Error(data.message);
          }
      } catch (error) {
          console.error("Error al establecer el perfil activo:", error);
          alert("Error al establecer el perfil activo. Inténtalo de nuevo más tarde.");
      }
  }

  // Agregar un evento a los enlaces para cambiar el perfil activo
  const profileLinks = document.querySelectorAll('.profile-link');
  profileLinks.forEach(link => {
      link.addEventListener('click', function(event) {
          event.preventDefault(); // Evitar la acción predeterminada del enlace
          const profileName = this.textContent.trim();
          setActiveProfile(profileName);
      });
  });

  // Agregar un listener para capturar las visitas a las páginas
  window.addEventListener('load', async function() {
      const title = document.title;
      const url = window.location.href;
      await addNavigationHistory(username, activeProfile, title, url);
  });
});

// Función para mostrar las URLs bloqueadas
async function showBlockedUrls(username, profileName) {
  const blockedUrlsList = document.getElementById('blockedUrlsList');
  blockedUrlsList.innerHTML = ""; // Limpiar la lista antes de mostrar las URLs

  try {
      const blockedUrls = await getBlockedUrls(username, profileName);
      blockedUrls.forEach(url => {
          const urlItem = document.createElement('li');
          urlItem.textContent = url;

          // Botón para desbloquear la URL
          const unblockButton = document.createElement('button');
          unblockButton.textContent = "Desbloquear";
          unblockButton.addEventListener('click', async function() {
              try {
                  await unblockWebsite(username, profileName, url); // Desbloquear la URL
                  await showBlockedUrls(username, profileName); // Actualizar la lista de URLs bloqueadas
              } catch (error) {
                  console.error("Error al desbloquear la URL:", error);
                  alert("Error al desbloquear la URL. Inténtalo de nuevo más tarde.");
              }
          });

          urlItem.appendChild(unblockButton);
          blockedUrlsList.appendChild(urlItem);
      });
  } catch (error) {
      console.error("Error al obtener las URLs bloqueadas:", error);
      alert("Error al obtener las URLs bloqueadas. Inténtalo de nuevo más tarde.");
  }
}

// Función para obtener las URLs bloqueadas
async function getBlockedUrls(username, profileName) {
  try {
      const response = await fetch(`http://localhost:3000/get-blocked-urls/${username}/${profileName}`);
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data.success) {
              return data.blockedUrls;
          } else {
              throw new Error(data.message);
          }
      } else {
          throw new Error("La respuesta del servidor no es JSON");
      }
  } catch (error) {
      console.error("Error al obtener las URLs bloqueadas:", error);
      throw error;
  }
}

// Función para bloquear una URL
async function blockWebsite(username, profileName, websiteUrl) {
  try {
      const response = await fetch(`http://localhost:3000/block-website/${username}/${profileName}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ websiteUrl: websiteUrl })
      });
      const data = await response.json();
      if (data.success) {
          console.log("URL bloqueada exitosamente.");
          return true;
      } else {
          throw new Error(data.message);
      }
  } catch (error) {
      console.error("Error al bloquear la URL:", error);
      throw error;
  }
}

// Función para desbloquear una URL
async function unblockWebsite(username, profileName, websiteUrl) {
  try {
      const response = await fetch(`http://localhost:3000/unblock-website/${username}/${profileName}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ websiteUrl: websiteUrl })
      });
      const data = await response.json();
      if (data.success) {
          console.log("URL desbloqueada exitosamente.");
          return true;
      } else {
          throw new Error(data.message);
      }
  } catch (error) {
      console.error("Error al desbloquear la URL:", error);
      throw error;
  }
}

// Función para mostrar el historial de navegación
async function showNavigationHistory(username, profileName) {
  const navigationHistoryContainer = document.getElementById('navigationHistoryContainer');

  try {
      const response = await fetch(`http://localhost:3000/get-navigation-history/${username}/${profileName}`);
      const data = await response.json();

      if (data.success) {
          // Limpiar el contenedor antes de mostrar los datos
          navigationHistoryContainer.innerHTML = "";

          // Crear una lista ul para mostrar el historial de navegación
          const historyList = document.createElement('ul');

          // Iterar sobre cada URL en el historial y agregarla como un ítem de lista
          data.navigationHistory.forEach(visit => {
              const listItem = document.createElement('li');
              const visitLink = document.createElement('a');
              visitLink.href = visit.url; // Enlace a la URL visitada
              visitLink.textContent = visit.title || visit.url; // Mostrar título si está disponible, de lo contrario, mostrar URL
              visitLink.target = "_blank"; // Abrir enlace en una nueva pestaña
              listItem.appendChild(visitLink); // Agregar enlace al ítem de lista
              historyList.appendChild(listItem); // Agregar ítem de lista a la lista de historial
          });

          // Agregar la lista de historial al contenedor
          navigationHistoryContainer.appendChild(historyList);
      } else {
          throw new Error(data.message);
      }
  } catch (error) {
      console.error("Error al obtener el historial de navegación:", error);
      alert("Error al obtener el historial de navegación. Inténtalo de nuevo más tarde.");
  }
}

// Función para agregar una visita al historial de navegación
async function addNavigationHistory(username, profileName, title, url) {
  try {
      const response = await fetch(`http://localhost:3000/add-navigation-history/${username}/${profileName}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title: title, url: url })
      });
      const data = await response.json();
      if (!data.success) {
          throw new Error(data.message);
      }
  } catch (error) {
      console.error("Error al agregar la visita al historial de navegación:", error);
      alert("Error al agregar la visita al historial de navegación. Inténtalo de nuevo más tarde.");
  }
}



function displayNavigationHistory(navigationHistory) {
    const navigationHistoryContainer = document.getElementById('navigationHistoryContainer');
    navigationHistoryContainer.innerHTML = ""; // Limpiar el contenedor

    if (navigationHistory && navigationHistory.length > 0) {
        const historyList = document.createElement('ul');
        navigationHistory.forEach(visit => {
            const listItem = document.createElement('li');
            const visitLink = document.createElement('a');
            visitLink.href = visit.url; // URL visitada
            visitLink.textContent = visit.title || visit.url; // Título si está disponible, de lo contrario, URL
            visitLink.target = "_blank"; // Abrir enlace en una nueva pestaña
            listItem.appendChild(visitLink); // Agregar enlace al ítem de lista
            historyList.appendChild(listItem); // Agregar ítem de lista a la lista de historial
        });
        navigationHistoryContainer.appendChild(historyList); // Agregar la lista de historial al contenedor
    } else {
        const noHistoryMessage = document.createElement('p');
        noHistoryMessage.textContent = "No hay historial de navegación para este perfil.";
        navigationHistoryContainer.appendChild(noHistoryMessage); // Mostrar mensaje si no hay historial
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    const activeProfile = urlParams.get('profile');

    // Mostrar el nombre de usuario y el nombre del perfil
    const profileNameElement = document.getElementById('profileName');
    profileNameElement.textContent = `Perfil: ${activeProfile}, Usuario: ${username}`;

    // Obtener y mostrar el historial de navegación del perfil seleccionado
    await showNavigationHistory(username, activeProfile);
});

async function showNavigationHistory(username, profileName) {
    try {
        // Obtener el historial de navegación del perfil seleccionado del backend
        const navigationHistory = await fetchNavigationHistory(username, profileName);

        // Mostrar el historial de navegación en el panel
        displayNavigationHistory(navigationHistory);
    } catch (error) {
        console.error("Error al obtener el historial de navegación:", error);
        alert("Error al obtener el historial de navegación. Inténtalo de nuevo más tarde.");
    }
}

async function fetchNavigationHistory(username, profileName) {
    try {
        const response = await fetch(`http://localhost:3000/get-navigation-history/${username}/${profileName}`);
        const data = await response.json();
        if (data.success) {
            return data.navigationHistory;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error al obtener el historial de navegación del backend:", error);
        throw error;
    }
}

function displayNavigationHistory(navigationHistory) {
    const navigationHistoryContainer = document.getElementById('navigationHistoryContainer');
    navigationHistoryContainer.innerHTML = ""; // Limpiar el contenedor

    if (navigationHistory && navigationHistory.length > 0) {
        const historyList = document.createElement('ul');
        navigationHistory.forEach(visit => {
            const listItem = document.createElement('li');
            const visitLink = document.createElement('a');
            visitLink.href = visit.url; // URL visitada
            visitLink.textContent = visit.title || visit.url; // Título si está disponible, de lo contrario, URL
            visitLink.target = "_blank"; // Abrir enlace en una nueva pestaña
            listItem.appendChild(visitLink); // Agregar enlace al ítem de lista
            historyList.appendChild(listItem); // Agregar ítem de lista a la lista de historial
        });
        navigationHistoryContainer.appendChild(historyList); // Agregar la lista de historial al contenedor
    } else {
        const noHistoryMessage = document.createElement('p');
        noHistoryMessage.textContent = "No hay historial de navegación para este perfil.";
        navigationHistoryContainer.appendChild(noHistoryMessage); // Mostrar mensaje si no hay historial
    }
}
