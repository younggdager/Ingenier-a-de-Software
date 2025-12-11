require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const conectarDB = require('./config/database');

// Crear aplicación Express
const app = express();

// Conectar a la base de datos
conectarDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Servir archivos estáticos
app.use(express.static('public'));

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API del Sistema de Gestión de Almacén',
    version: '1.0.0',
    documentacion: '/api/docs',
    estado: 'Activo'
  });
});

// Rutas de la API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/usuarios', require('./routes/usuarioRoutes'));
app.use('/api/productos', require('./routes/productoRoutes'));
app.use('/api/proveedores', require('./routes/proveedorRoutes'));
app.use('/api/caja', require('./routes/cajaRoutes'));
app.use('/api/ventas', require('./routes/ventaRoutes'));
app.use('/api/clientes', require('./routes/clienteRoutes'));
app.use('/api/compras', require('./routes/comprasRoutes'));
app.use('/api/reportes', require('./routes/reportesRoutes'));
app.use('/api/mantenimiento', require('./routes/mantenimientoRoutes'));

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    mensaje: 'Ruta no encontrada'
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    mensaje: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error del servidor'
  });
});

// Puerto
const PORT = process.env.PORT || 3000;

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   Sistema de Gestión de Almacén - API REST            ║
║   Servidor corriendo en: http://localhost:${PORT}     ║
║   Entorno: ${process.env.NODE_ENV || 'development'}              ║
╚════════════════════════════════════════════════════════╝
  `);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.log('Error no manejado:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;