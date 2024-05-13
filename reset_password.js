console.log("El script se está ejecutando.");

document.getElementById("resetPasswordForm").addEventListener("submit", function(event) {
  // Evita que el formulario se envíe automáticamente
  event.preventDefault();

  // Obtiene el valor de la nueva contraseña ingresada por el usuario
  var password = document.getElementById("password").value;

  // Si la contraseña no está vacía, envía la solicitud al servidor
  if (password.trim() !== '') {
      enviarDatos(password);
  } else {
      showError("Por favor, ingresa una contraseña.");
  }
});

// Función para mostrar un mensaje de error
function showError(mensaje) {
  var errorDiv = document.createElement("div");
  errorDiv.className = "error";
  errorDiv.textContent = mensaje;

  var resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "";
  resultDiv.appendChild(errorDiv);
}

// Función para enviar la solicitud al servidor
function enviarDatos(password) {
  var token = getTokenFromUrl(); // Obtener el token de la URL
  console.log("Token obtenido:", token); // Agregamos un console.log para verificar el token obtenido

  fetch(`http://localhost:3000/reset-password/${token}`, { // Envía la solicitud al servidor en el puerto 3000
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: password, token: token }) // Enviar la contraseña y el token en el cuerpo de la solicitud
  })
  .then(response => {
      console.log("Status de la respuesta:", response.status); // Agregamos un console.log para verificar el status de la respuesta
      if (!response.ok) {
          throw new Error('Error al enviar datos al servidor');
      }
      return response.json();
  })
  .then(data => {
      // Muestra un mensaje de éxito si la solicitud fue exitosa
      console.log("Datos recibidos del servidor:", data); // Agregamos un console.log para verificar los datos recibidos
      if (data.success) {
          showSuccess(data.message);
      } else {
          showError(data.message);
      }
  })
  .catch(error => {
      // Muestra un mensaje de error si hubo algún problema con la solicitud
      console.error('Error al enviar datos al servidor:', error);
      showError('Error al enviar datos al servidor. Inténtalo de nuevo más tarde.');
  });
}

// Función para obtener el token de la URL
function getTokenFromUrl() {
  var urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
}

// Función para mostrar un mensaje de éxito
function showSuccess(mensaje) {
  var successDiv = document.createElement("div");
  successDiv.className = "success";
  successDiv.textContent = mensaje;

  var resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "";
  resultDiv.appendChild(successDiv);
}
