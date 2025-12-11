const express = require('express');
const router = express.Router();
const { login, obtenerPerfil } = require('../controllers/authController');
const { protegerRuta } = require('../middleware/auth');

// Rutas públicas
router.post('/login', login);

// Rutas protegidas
router.get('/perfil', protegerRuta, obtenerPerfil);

module.exports = router;
