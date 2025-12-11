const express = require('express');
const router = express.Router();
const {
  crearMantenimiento,
  obtenerMantenimientos,
  obtenerMantenimiento,
  actualizarMantenimiento,
  eliminarMantenimiento,
  obtenerProximos,
  obtenerEstadisticas
} = require('../controllers/mantenimientoController');
const { protegerRuta, autorizarRol } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(protegerRuta);

// Rutas de alertas y estadísticas
router.get('/alertas/proximos', obtenerProximos);
router.get('/estadisticas', obtenerEstadisticas);

// Rutas CRUD
router.route('/')
  .get(obtenerMantenimientos)
  .post(crearMantenimiento);

router.route('/:id')
  .get(obtenerMantenimiento)
  .put(actualizarMantenimiento)
  .delete(autorizarRol('Administrador'), eliminarMantenimiento);

module.exports = router;
