const express = require('express');
const router = express.Router();
const {
  abrirCaja,
  cerrarCaja,
  obtenerCajaActual,
  obtenerHistorialCajas
} = require('../controllers/cajaController');
const { protegerRuta } = require('../middleware/auth');

router.use(protegerRuta);

router.post('/abrir', abrirCaja);
router.put('/cerrar/:id', cerrarCaja);
router.get('/actual', obtenerCajaActual);
router.get('/historial', obtenerHistorialCajas);

module.exports = router;
