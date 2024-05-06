document.addEventListener('DOMContentLoaded', function() {
  const historyList = document.getElementById('historyList');

  // Obtener el perfil del parámetro de la URL
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const profileName = urlParams.get('profile');
  const profile = JSON.parse(decodeURIComponent(profileName));

  // Mostrar el mensaje de bienvenida
  const welcomeMessage = document.createElement('h2');
  welcomeMessage.textContent = `Bienvenido a las configuraciones para el perfil de ${profile.username}`;
  document.body.insertBefore(welcomeMessage, historyList);

  // Obtener y mostrar el historial de navegación del perfil
  getHistory(profile);

  // Actualizar el historial cuando se visita una nueva página
  chrome.history.onVisited.addListener(function() {
    getHistory(profile);
  });

  // Función para obtener el historial de navegación de un perfil
  function getHistory(profile) {
    chrome.history.search({text: '', startTime: 0}, function(results) {
      console.log('Historial de navegación para el perfil', profile.username, ':', results);
      // Mostrar el historial en la lista
      showHistory(results);
    });
  }

  // Función para mostrar el historial en la lista
  function showHistory(historyItems) {
    historyList.innerHTML = ''; // Limpiar la lista antes de agregar nuevos elementos
    historyItems.forEach(function(item) {
      const listItem = document.createElement('li');
      // Crear un objeto de fecha a partir del timestamp de la visita
      const visitDate = new Date(item.lastVisitTime);
      // Formatear la fecha y la hora
      const formattedDate = `${visitDate.toLocaleDateString()} ${visitDate.toLocaleTimeString()}`;
      listItem.innerHTML = `<span class="visit">${item.title}</span> - ${item.url} - ${formattedDate}`;
      historyList.appendChild(listItem);
    });
  }
});
