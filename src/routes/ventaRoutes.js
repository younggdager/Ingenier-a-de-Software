const express = require('express');
const router = express.Router();
const {
  crearVenta,
  obtenerVentas,
  obtenerVenta,
  pagarVentaCredito
} = require('../controllers/ventaController');
const { protegerRuta } = require('../middleware/auth');

router.use(protegerRuta);

router.route('/')
  .get(obtenerVentas)
  .post(crearVenta);

router.get('/:id', obtenerVenta);
router.put('/:id/pagar', pagarVentaCredito);

module.exports = router;
