document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profileForm');
  
    profileForm.addEventListener('submit', function(event) {
      event.preventDefault();
  
      const username = document.getElementById('username').value;
      const age = parseInt(document.getElementById('age').value);
      const field1 = document.getElementById('field1').value;
      const field2 = document.getElementById('field2').value;
  
      if (!username || !age || !field1 || !field2) {
        alert('Por favor, completa todos los campos.');
        return;
      }
  
      // Crear el objeto de perfil
      const profile = {
        username: username,
        age: age,
        field1: field1,
        field2: field2
      };
  
      // Guardar el perfil en el almacenamiento
      addProfile(profile);
  
      // Redirigir a la página de perfiles creados
      window.location.href = 'perfiles.html';
    });
  
    // Función para agregar el perfil al almacenamiento
    function addProfile(profile) {
      chrome.storage.sync.get("profiles", function (data) {
        let profiles = data.profiles || [];
        profiles.push(profile);
        chrome.storage.sync.set({ profiles: profiles });
      });
    }
  });