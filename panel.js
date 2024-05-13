  document.addEventListener('DOMContentLoaded', async function() {
    // Obtener el nombre de usuario y el nombre del perfil de los parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    const profileName = urlParams.get('profile');

    // Mostrar el nombre de usuario y el nombre del perfil
    const profileNameElement = document.getElementById('profileName');
    profileNameElement.textContent = `Perfil: ${profileName}, Usuario: ${username}`;

    // Mostrar las URLs bloqueadas
    await showBlockedUrls(username, profileName);

    // Agregar un evento al formulario para bloquear una nueva URL
    const addBlockedUrlForm = document.getElementById('addBlockedUrlForm');
    addBlockedUrlForm.addEventListener('submit', async function(event) {
      event.preventDefault(); // Evitar que se envíe el formulario

      const blockedUrlInput = document.getElementById('blockedUrlInput').value;
      try {
        await blockWebsite(username, profileName, blockedUrlInput); // Bloquear la URL
        await showBlockedUrls(username, profileName); // Actualizar la lista de URLs bloqueadas
      } catch (error) {
        console.error("Error al bloquear la URL:", error);
        alert("Error al bloquear la URL. Inténtalo de nuevo más tarde.");
      }
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

