document.getElementById("forgotPasswordForm").addEventListener("submit", function(event) {
    // Evita que el formulario se envíe automáticamente
    event.preventDefault();

    // Obtiene el valor del correo electrónico ingresado por el usuario
    var email = document.getElementById("email").value;

    // Realiza la validación del correo electrónico
    if (email.trim() === '' || !validarEmail(email)) {
        showError("Por favor, ingresa un correo electrónico válido.");
        return false;
    }

    // Si la validación es exitosa, envía la solicitud al servidor
    enviarDatos(email);
});

// Función para validar un correo electrónico
function validarEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}

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
function enviarDatos(email) {
    fetch('/forgot-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al enviar datos al servidor');
        }
        return response.json();
    })
    .then(data => {
        // Muestra un mensaje de éxito si la solicitud fue exitosa
        showSuccess(data.message);
    })
    .catch(error => {
        // Muestra un mensaje de error si hubo algún problema con la solicitud
        console.error('Error al enviar datos al servidor:', error);
        showError('Error al enviar datos al servidor. Inténtalo de nuevo más tarde.');
    });
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
