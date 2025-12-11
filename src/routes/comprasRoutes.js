const express = require('express');
const router = express.Router();
const {
  crearOrden,
  obtenerOrdenes,
  actualizarOrden,
  crearFactura,
  obtenerFacturas,
  obtenerFactura,
  actualizarFactura
} = require('../controllers/comprasController');
const { protegerRuta } = require('../middleware/auth');

router.use(protegerRuta);

// Órdenes de compra
router.route('/ordenes')
  .get(obtenerOrdenes)
  .post(crearOrden);

router.put('/ordenes/:id', actualizarOrden);

// Facturas
router.route('/facturas')
  .get(obtenerFacturas)
  .post(crearFactura);

router.route('/facturas/:id')
  .get(obtenerFactura)
  .put(actualizarFactura);

module.exports = router;
