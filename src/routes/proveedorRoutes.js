const express = require('express');
const router = express.Router();
const {
  crearProveedor,
  obtenerProveedores,
  obtenerProveedor,
  actualizarProveedor,
  eliminarProveedor
} = require('../controllers/proveedorController');
const { protegerRuta, autorizarRol } = require('../middleware/auth');

router.use(protegerRuta);

router.route('/')
  .get(obtenerProveedores)
  .post(crearProveedor);

router.route('/:id')
  .get(obtenerProveedor)
  .put(actualizarProveedor)
  .delete(autorizarRol('Administrador'), eliminarProveedor);

module.exports = router;
