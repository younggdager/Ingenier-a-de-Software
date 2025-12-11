const express = require('express');
const router = express.Router();
const {
  crearCliente,
  obtenerClientes,
  obtenerCliente,
  obtenerDeudaCliente,
  obtenerClientesConDeuda,
  actualizarCliente,
  eliminarCliente,
  registrarAbono
} = require('../controllers/clienteController');
const { protegerRuta, autorizarRol } = require('../middleware/auth');

router.use(protegerRuta);

router.get('/deuda/pendiente', obtenerClientesConDeuda);

router.route('/')
  .get(obtenerClientes)
  .post(crearCliente);

router.route('/:id')
  .get(obtenerCliente)
  .put(actualizarCliente)
  .delete(autorizarRol('Administrador'), eliminarCliente);

router.get('/:id/deuda', obtenerDeudaCliente);
router.post('/:id/abono', registrarAbono);

module.exports = router;