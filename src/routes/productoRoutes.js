const express = require('express');
const router = express.Router();
const {
  crearProducto,
  obtenerProductos,
  obtenerProducto,
  actualizarProducto,
  actualizarStock,
  obtenerStockBajo,
  obtenerProximosVencer,
  eliminarProducto,
  transferirStock
} = require('../controllers/productoController');
const { protegerRuta, autorizarRol } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(protegerRuta);

// Rutas de alertas
router.get('/alertas/stock-bajo', obtenerStockBajo);
router.get('/alertas/vencimiento', obtenerProximosVencer);

// Rutas CRUD
router.route('/')
  .get(obtenerProductos)
  .post(crearProducto);

router.route('/:id')
  .get(obtenerProducto)
  .put(actualizarProducto)
  .delete(autorizarRol('Administrador'), eliminarProducto);

router.put('/:id/stock', actualizarStock);
router.post('/:id/transferir', transferirStock);

module.exports = router;