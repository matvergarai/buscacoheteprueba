document.getElementById('forgotPasswordForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    
    // Enviar la solicitud al servidor para recuperar contraseña
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
        document.getElementById('result').innerText = data.message;
      } else {
        document.getElementById('result').innerText = data.message;
      }
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('result').innerText = 'Error en el servidor';
    });
  });