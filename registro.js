document.getElementById("registerForm").addEventListener("submit", function(event) {
    // Evita que el formulario se envíe automáticamente
    event.preventDefault();
    
    // Obtiene los valores de los campos
    var username = document.getElementById("reg_username").value;
    var email = document.getElementById("reg_email").value;
    var password = document.getElementById("reg_password").value;
    var confirmPassword = document.getElementById("reg_confirm_password").value;
    var termsCheckbox = document.getElementById("termsCheckbox").checked;

    // Realiza la validación
    if (username.trim() === '') {
        showError("Por favor, ingresa un nombre de usuario.");
        return false;
    }
    
    if (email.trim() === '' || !validarEmail(email)) {
        showError("Por favor, ingresa un correo electrónico válido.");
        return false;
    }
    
    if (password.trim() === '') {
        showError("Por favor, ingresa una contraseña.");
        return false;
    }

    if (!validarContrasenia(password)) {
        showError("La contraseña debe tener entre 8 y 15 caracteres, al menos un número, una mayúscula y un carácter especial.");
        return false;
    }
    
    if (password !== confirmPassword) {
        showError("Las contraseñas no coinciden.");
        return false;
    }
    if (!termsCheckbox) {
        showError("Para registrarse debe aceptar términos y condiciones.");
        return false;
    }
    
    // Si todo está bien, muestra un mensaje de éxito
    showSuccess("¡Registro exitoso!");
    // Envía los datos del formulario al servidor
    enviarDatos(username, email, password);
});

// Función para validar un correo electrónico
function validarEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}

// Función para validar una contraseña
function validarContrasenia(contrasenia) {
    // Al menos 8 caracteres, al menos 1 número, al menos 1 mayúscula, al menos 1 carácter especial
    var re = /^(?=.*\d)(?=.*[A-Z])(?=.*[!@#$%^&*()_+}{":;'?\/.,])(?=.*[a-z]).{8,15}$/;
    return re.test(contrasenia);
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

// Función para mostrar un mensaje de éxito
function showSuccess(mensaje) {
    var successDiv = document.createElement("div");
    successDiv.className = "success";
    successDiv.textContent = mensaje;

    var resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "";
    resultDiv.appendChild(successDiv);
}

// Función para enviar los datos del formulario al servidor
function enviarDatos(username, email, password) {
    fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username, email: email, password: password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess(data.message);
        } else {
            showError(data.message);
        }
    })
    .catch(error => {
        console.error('Error al enviar datos al servidor:', error);
        showError('Error en el servidor');
    });
}

document.getElementById("forgotPasswordForm").addEventListener("submit", function(event) {
    // Evita que el formulario se envíe automáticamente
    event.preventDefault();
    
    // Obtiene el valor del correo electrónico
    var email = document.getElementById("forgot_email").value;

    // Realiza la validación
    if (email.trim() === '' || !validarEmail(email)) {
        showError("Por favor, ingresa un correo electrónico válido.");
        return false;
    }

    // Envía la solicitud de recuperación de contraseña al servidor
    enviarSolicitudRecuperacion(email);
});

function enviarSolicitudRecuperacion(email) {
    fetch('http://localhost:3000/forgot-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess(data.message);
        } else {
            showError(data.message);
        }
    })
    .catch(error => {
        console.error('Error al enviar solicitud de recuperación de contraseña:', error);
        showError('Error en el servidor');
    });
}
