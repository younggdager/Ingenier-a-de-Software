const express = require('express');
const router = express.Router();
const {
  reporteProductosVendidos,
  reporteGananciaReal,
  exportarContable,
  registrarMantenimiento,
  obtenerMantenimientos
} = require('../controllers/reportesController');
const { protegerRuta, autorizarRol } = require('../middleware/auth');

router.use(protegerRuta);

// Reportes
router.get('/productos-vendidos', reporteProductosVendidos);
router.get('/ganancia-real', autorizarRol('Administrador'), reporteGananciaReal);
router.get('/exportar-contable', autorizarRol('Administrador'), exportarContable);

// Mantenimientos
router.route('/mantenimientos')
  .get(obtenerMantenimientos)
  .post(registrarMantenimiento);

module.exports = router;
