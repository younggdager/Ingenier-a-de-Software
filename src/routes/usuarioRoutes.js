const express = require('express');
const router = express.Router();
const {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  eliminarUsuario
} = require('../controllers/usuarioController');
const { protegerRuta, autorizarRol } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de Administrador
router.use(protegerRuta);
router.use(autorizarRol('Administrador'));

router.route('/')
  .get(obtenerUsuarios)
  .post(crearUsuario);

router.route('/:id')
  .get(obtenerUsuario)
  .put(actualizarUsuario)
  .delete(eliminarUsuario);

module.exports = router;
