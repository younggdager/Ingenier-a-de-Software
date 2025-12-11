const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Proteger rutas - verificar token JWT
exports.protegerRuta = async (req, res, next) => {
  try {
    let token;

    // Verificar si existe token en el header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Si no hay token
    if (!token) {
      return res.status(401).json({
        success: false,
        mensaje: 'No autorizado. No se proporcionó token de acceso'
      });
    }

    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscar usuario
      req.usuario = await Usuario.findById(decoded.id);

      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          mensaje: 'Usuario no encontrado'
        });
      }

      if (!req.usuario.activo) {
        return res.status(401).json({
          success: false,
          mensaje: 'Usuario inactivo'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        mensaje: 'Token inválido o expirado'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      mensaje: 'Error en la autenticación',
      error: error.message
    });
  }
};

// Restricción por rol
exports.autorizarRol = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        mensaje: `El rol ${req.usuario.rol} no tiene permisos para acceder a este recurso`
      });
    }
    next();
  };
};

// Generar token JWT
exports.generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};
