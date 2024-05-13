const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const crypto = require('crypto');
const PORT = process.env.PORT || 3000;


app.use(cors()); // Habilitar CORS para todas las solicitudes
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

mongoose.connect('mongodb://localhost:27017/usuarios', {
  useUnifiedTopology: true,
  useNewUrlParser: true
}).then(() => {
  console.log('Conexión exitosa a MongoDB');
}).catch((error) => {
  console.error('Error de conexión a MongoDB:', error);
});
mongoose.connection.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));

const navigationHistorySchema = new mongoose.Schema({
  title: String,
  url: String
});

const navigationProfileSchema = new mongoose.Schema({
  name: String,
  navigationHistory: [navigationHistorySchema],
  blockedWebsites: [String]
});

const usuarioSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
   
  navigationProfiles: [navigationProfileSchema],
   resetPasswordToken: { type: String, default: null } 
  
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/login', (req, res) => {
  const { username, password } = req.body;
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

app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  Usuario.findOne({ username: username })
    .then(usuarioExistente => {
      if (usuarioExistente) {
        res.status(400).json({ success: false, message: 'El usuario ya existe' });
      } else {
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

// Ruta para agregar un perfil de navegación a un usuario
app.post('/add-navigation-profile/:username', async (req, res) => {
  const { name } = req.body;
  const username = req.params.username;

  try {
    const usuario = await Usuario.findOne({ username: username });
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const existingProfile = usuario.navigationProfiles.find(profile => profile.name === name);
    if (existingProfile) {
      res.status(400).json({ success: false, message: 'Ya existe un perfil de navegación con el mismo nombre' });
      return;
    }

    const newProfile = {
      name: name,
      navigationHistory: [],
      blockedWebsites: []
    };

    usuario.navigationProfiles.push(newProfile);
    await usuario.save();

    res.json({ success: true, message: 'Nuevo perfil de navegación agregado exitosamente' });
  } catch (error) {
    console.error('Error al agregar el perfil de navegación:', error);
    res.status(500).json({ success: false, message: 'Error al agregar el perfil de navegación' });
  }
});

// Ruta para obtener todos los perfiles de navegación de un usuario
app.get('/get-navigation-profiles/:username', async (req, res) => {
  const username = req.params.username;

  try {
    const usuario = await Usuario.findOne({ username: username });
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    res.json({ success: true, navigationProfiles: usuario.navigationProfiles });
  } catch (error) {
    console.error('Error al obtener perfiles de navegación:', error);
    res.status(500).json({ success: false, message: 'Error al obtener perfiles de navegación' });
  }
});

// Ruta para actualizar el nombre de un perfil de navegación
app.put('/update-profile-name/:username/:oldName', async (req, res) => {
  const { newName } = req.body;
  const { username, oldName } = req.params;

  try {
    const usuario = await Usuario.findOne({ username: username });
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const profile = usuario.navigationProfiles.find(profile => profile.name === oldName);
    if (!profile) {
      res.status(404).json({ success: false, message: 'Perfil no encontrado' });
      return;
    }

    profile.name = newName;
    await usuario.save();

    res.json({ success: true, message: 'Nombre de perfil actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar el nombre del perfil:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el nombre del perfil' });
  }
});

app.delete('/delete-navigation-profile/:username/:profileName', async (req, res) => {
  const { username, profileName } = req.params;

  try {
    const usuario = await Usuario.findOne({ username: username });
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    usuario.navigationProfiles = usuario.navigationProfiles.filter(profile => profile.name !== profileName);
    await usuario.save();

    res.json({ success: true, message: 'Perfil eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el perfil:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar el perfil' });
  }
});

// Ruta para bloquear una URL
app.post('/block-website/:username/:profileName', async (req, res) => {
  const { username, profileName } = req.params;
  const { websiteUrl } = req.body;

  try {
    const usuario = await Usuario.findOne({ username: username });
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const profile = usuario.navigationProfiles.find(profile => profile.name === profileName);
    if (!profile) {
      res.status(404).json({ success: false, message: 'Perfil no encontrado' });
      return;
    }

    // Agregar la URL bloqueada al perfil de navegación
    profile.blockedWebsites.push(websiteUrl);
    await usuario.save();

    res.json({ success: true, message: 'URL bloqueada exitosamente' });
  } catch (error) {
    console.error('Error al bloquear la URL:', error);
    res.status(500).json({ success: false, message: 'Error al bloquear la URL' });
  }
});

app.get('/get-blocked-urls/:username/:profileName', async (req, res) => {
  const { username, profileName } = req.params;

  try {
    const usuario = await Usuario.findOne({ username: username });
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const profile = usuario.navigationProfiles.find(profile => profile.name === profileName);
    if (!profile) {
      res.status(404).json({ success: false, message: 'Perfil no encontrado' });
      return;
    }

    // Devolver las URLs bloqueadas en formato JSON
    res.json({ success: true, blockedUrls: profile.blockedWebsites });
  } catch (error) {
    console.error('Error al obtener las URLs bloqueadas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener las URLs bloqueadas' });
  }
});


app.post('/set-active-navigation-profile/:username/:profileName', async (req, res) => {
  const { username, profileName } = req.params;

  try {
      const usuario = await Usuario.findOne({ username: username });
      if (!usuario) {
          res.status(404).json({ success: false, message: 'Usuario no encontrado' });
          return;
      }

      const profile = usuario.navigationProfiles.find(profile => profile.name === profileName);
      if (!profile) {
          res.status(404).json({ success: false, message: 'Perfil no encontrado' });
          return;
      }

      // Obtener las URLs bloqueadas del perfil
      const blockedWebsites = profile.blockedWebsites;

      // Aquí podrías realizar otras acciones relacionadas con establecer el perfil como activo

      res.json({ success: true, message: 'Perfil establecido como activo', blockedWebsites: blockedWebsites });
  } catch (error) {
      console.error('Error al establecer el perfil activo:', error);
      res.status(500).json({ success: false, message: 'Error al establecer el perfil activo' });
  }
});


app.post('/add-navigation-history/:username/:profileName', async (req, res) => {
  const { title, url } = req.body;
  const { username, profileName } = req.params;

  try {
    const usuario = await Usuario.findOne({ username: username });
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const profile = usuario.navigationProfiles.find(profile => profile.name === profileName);
    if (!profile) {
      res.status(404).json({ success: false, message: 'Perfil no encontrado' });
      return;
    }

    // Agregar la visita al historial de navegación del perfil
    profile.navigationHistory.push({ title: title, url: url });
    await usuario.save();

    res.json({ success: true, message: 'Visita agregada al historial de navegación' });
  } catch (error) {
    console.error('Error al agregar visita al historial de navegación:', error);
    res.status(500).json({ success: false, message: 'Error al agregar visita al historial de navegación' });
  }
});

// Ruta para obtener el historial de navegación de un perfil
app.get('/get-navigation-history/:username/:profileName', async (req, res) => {
  const { username, profileName } = req.params;

  try {
    // Buscar el usuario por su nombre de usuario
    const usuario = await Usuario.findOne({ username: username });

    if (!usuario) {
      // Si no se encuentra el usuario, enviar respuesta con estado 404
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Buscar el perfil de navegación por su nombre en los perfiles del usuario
    const profile = usuario.navigationProfiles.find(profile => profile.name === profileName);

    if (!profile) {
      // Si no se encuentra el perfil, enviar respuesta con estado 404
      return res.status(404).json({ success: false, message: 'Perfil no encontrado' });
    }

    // Si se encuentra el perfil, devolver su historial de navegación
    res.json({ success: true, navigationHistory: profile.navigationHistory });

  } catch (error) {
    // Si ocurre un error, enviar respuesta con estado 500
    console.error('Error al obtener historial de navegación:', error);
    res.status(500).json({ success: false, message: 'Error al obtener historial de navegación' });
  }
});

// Ruta para eliminar una visita del historial de navegación de un perfil
app.delete('/delete-navigation-history/:username/:profileName/:url', async (req, res) => {
  const { username, profileName, url } = req.params;

  try {
    const usuario = await Usuario.findOne({ username: username });
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const profile = usuario.navigationProfiles.find(profile => profile.name === profileName);
    if (!profile) {
      res.status(404).json({ success: false, message: 'Perfil no encontrado' });
      return;
    }

    // Eliminar la visita del historial de navegación del perfil
    profile.navigationHistory = profile.navigationHistory.filter(history => history.url !== url);
    await usuario.save();

    res.json({ success: true, message: 'Visita eliminada del historial de navegación' });
  } catch (error) {
    console.error('Error al eliminar visita del historial de navegación:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar visita del historial de navegación' });
  }
});

// Ruta para desbloquear una URL
app.post('/unblock-website/:username/:profileName', async (req, res) => {
  const { username, profileName } = req.params;
  const { websiteUrl } = req.body;

  try {
    const usuario = await Usuario.findOne({ username: username });
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const profile = usuario.navigationProfiles.find(profile => profile.name === profileName);
    if (!profile) {
      res.status(404).json({ success: false, message: 'Perfil no encontrado' });
      return;
    }

    // Eliminar la URL bloqueada del perfil de navegación
    profile.blockedWebsites = profile.blockedWebsites.filter(url => url !== websiteUrl);
    await usuario.save();

    res.json({ success: true, message: 'URL desbloqueada exitosamente' });
  } catch (error) {
    console.error('Error al desbloquear la URL:', error);
    res.status(500).json({ success: false, message: 'Error al desbloquear la URL' });
  }
});

const generarToken = () => {
  return crypto.randomBytes(20).toString('hex'); // Genera un token único de 20 bytes en formato hexadecimal
};

function generarYGuardarTokenRecuperacion(email) {
  const tokenRecuperacion = generarToken(); // Generar un token único
  const resetPasswordExpires = Date.now() + 3600000; // Establecer la fecha de vencimiento del token (1 hora en este ejemplo)

  Usuario.findOneAndUpdate({ email: email }, { resetPasswordToken: tokenRecuperacion, resetPasswordExpires: resetPasswordExpires })
      .then(usuario => {
          if (!usuario) {
              console.log("No se encontró ningún usuario con este correo electrónico.");
              return; // Si no se encuentra el usuario, no se guarda el token
          }
          console.log("Token de recuperación generado y guardado en el usuario:", tokenRecuperacion);
      })
      .catch(error => {
          console.error('Error al guardar el token de recuperación en el usuario:', error);
      });
}



// Ruta para solicitar restablecimiento de contraseña
app.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  // Generar y guardar el token de recuperación en el usuario
  generarYGuardarTokenRecuperacion(email);

  // Envía la respuesta al cliente
  res.json({ success: true, message: 'Se ha enviado un correo electrónico con un enlace para restablecer la contraseña' });
});

// Ruta para restablecer la contraseña
app.post('/reset-password/:token', (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  
  console.log("Token recibido en el servidor:", token);
  console.log("Contraseña recibida en el servidor:", password);

  // Buscar el usuario por el token de restablecimiento
  Usuario.findOne({ resetPasswordToken: token })
    .then(usuario => {
      if (!usuario) {
        console.log("No se encontró ningún usuario con el token proporcionado.");
        return res.status(400).json({ success: false, message: 'El enlace de restablecimiento es inválido' });
      }

      // Verificar si el token ha expirado
      if (usuario.resetPasswordExpires < Date.now()) {
        console.log("El token ha expirado.");
        return res.status(400).json({ success: false, message: 'El enlace de restablecimiento ha expirado' });
      }

      // Actualizar la contraseña y borrar el token de restablecimiento
      usuario.password = password;
      usuario.resetPasswordToken = undefined;
      usuario.resetPasswordExpires = undefined;

      // Guardar los cambios en la base de datos
      usuario.save()
        .then(() => {
          console.log("Contraseña restablecida correctamente.");
          res.json({ success: true, message: 'Contraseña restablecida exitosamente' });
        })
        .catch(error => {
          console.error('Error al guardar los cambios en la base de datos:', error);
          res.status(500).json({ success: false, message: 'Error al guardar los cambios en la base de datos' });
        });
    })
    .catch(error => {
      console.error('Error al buscar usuario:', error);
      res.status(500).json({ success: false, message: 'Error al buscar usuario en la base de datos' });
    });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});


