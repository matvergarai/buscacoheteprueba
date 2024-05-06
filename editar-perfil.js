document.addEventListener('DOMContentLoaded', function() {
  const editProfileForm = document.getElementById('editProfileForm');

  // Obtener el índice del perfil a editar de los parámetros de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const index = parseInt(urlParams.get('index'));

  // Cargar el perfil para mostrar los datos actuales en el formulario
  loadProfile();

  // Función para cargar el perfil
  function loadProfile() {
    chrome.storage.sync.get("profiles", function (data) {
      const profiles = data.profiles || [];
      const profile = profiles[index];
      if (!profile) return; // Salir si no se encuentra el perfil

      // Mostrar los datos actuales del perfil en el formulario
      document.getElementById('username').value = profile.username || '';
      document.getElementById('age').value = profile.age || '';
      document.getElementById('field1').value = profile.field1 || '';
      document.getElementById('field2').value = profile.field2 || '';
    });
  }

  // Agregar un evento de escucha para enviar el formulario
  editProfileForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Evitar el envío del formulario por defecto

    // Obtener los valores actualizados del formulario
    const username = document.getElementById('username').value.trim();
    const age = parseInt(document.getElementById('age').value);
    const field1 = document.getElementById('field1').value.trim();
    const field2 = document.getElementById('field2').value.trim();

    // Validar que los campos requeridos no estén vacíos
    if (!username || !age) {
      alert('Por favor, completa los campos requeridos (nombre de usuario y edad).');
      return;
    }

    // Obtener los perfiles almacenados
    chrome.storage.sync.get("profiles", function (data) {
      let profiles = data.profiles || [];

      // Actualizar el perfil en la posición correspondiente
      profiles[index] = {
        username: username,
        age: age,
        field1: field1,
        field2: field2
      };

      // Guardar los perfiles actualizados
      chrome.storage.sync.set({ profiles: profiles }, function () {
        // Redirigir de nuevo a la lista de perfiles
        window.location.href = 'perfiles.html';
      });
    });
  });
});
