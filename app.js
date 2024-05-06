const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Conexión a la base de datos
mongoose.connect('mongodb://localhost:27017/usuarios', {
  useUnifiedTopology: true,
  useNewUrlParser: true
}).then(() => {
  console.log('Conexión exitosa a MongoDB');
}).catch((error) => {
  console.error('Error de conexión a MongoDB:', error);
});
// Manejo de errores de conexión a la base de datos
mongoose.connection.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));

// Definición del esquema del usuario
const usuarioSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});

// Creación del modelo de usuario
const Usuario = mongoose.model('Usuario', usuarioSchema);

// Middleware para analizar el cuerpo de las solicitudes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Ruta de inicio de sesión
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Busca el usuario en la base de datos
  Usuario.findOne({ username: username, password: password })
    .then(usuario => {
      if (usuario) {
        res.json({ success: true, message: '¡Inicio de sesión exitoso!' });
      } else {
        res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
      }
    })
    .catch(error => {
      console.error('Error al buscar usuario:', error);
      res.status(500).json({ success: false, message: 'Error en el servidor' });
    });
});

// Ruta de registro de usuarios
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  // Verifica si el usuario ya está registrado
  Usuario.findOne({ username: username })
    .then(usuarioExistente => {
      if (usuarioExistente) {
        res.status(400).json({ success: false, message: 'El usuario ya existe' });
      } else {
        // Crea un nuevo usuario
        const nuevoUsuario = new Usuario({ username: username, email: email, password: password });
        nuevoUsuario.save()
          .then(() => {
            res.json({ success: true, message: '¡Usuario registrado exitosamente!' });
          })
          .catch(error => {
            console.error('Error al guardar nuevo usuario:', error);
            res.status(500).json({ success: false, message: 'Error en el servidor' });
          });
      }
    })
    .catch(error => {
      console.error('Error al buscar usuario existente:', error);
      res.status(500).json({ success: false, message: 'Error en el servidor' });
    });
});

// Ruta de recuperación de contraseña
app.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  // Buscar el usuario por su correo electrónico
  Usuario.findOne({ email: email })
    .then(usuario => {
      if (!usuario) {
        // Si el usuario no existe, enviar un mensaje de error
        res.status(404).json({ success: false, message: 'El correo electrónico no está registrado' });
      } else {
        // Enviar correo electrónico para restablecer la contraseña
        enviarCorreo(email)
          .then(() => {
            res.json({ success: true, message: 'Se ha enviado un correo electrónico con las instrucciones para restablecer la contraseña' });
          })
          .catch(error => {
            console.error('Error al enviar correo electrónico:', error);
            res.status(500).json({ success: false, message: 'Error en el servidor al enviar correo electrónico' });
          });
      }
    })
    .catch(error => {
      console.error('Error al buscar usuario:', error);
      res.status(500).json({ success: false, message: 'Error en el servidor' });
    });
});

// Función para enviar correo electrónico
async function enviarCorreo(destinatario) {
  // Configuración del servicio de correo
  let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'buscacohetesa@gmail.com', // Tu dirección de correo electrónico
      pass: 'BuscaCoheteSA2205@@' // Tu contraseña
    }
  });

  // Opciones del correo electrónico
  let mailOptions = {
    from: 'buscacohetesa@gmail.com', // Tu dirección de correo electrónico
    to: destinatario,
    subject: 'Recuperación de contraseña',
    text: `Hola,\n\nHas solicitado restablecer tu contraseña en BuscaCohete. Sigue este enlace para cambiar tu contraseña.\n\nhttps://BuscaCohete.com/reset-password\n\nSi no solicitaste esto, ignora este correo y tu contraseña permanecerá sin cambios.\n\nSaludos,\nBuscaCohete`
  };

  // Envío del correo electrónico
  let info = await transporter.sendMail(mailOptions);
  console.log('Correo electrónico enviado:', info.messageId);
}

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});