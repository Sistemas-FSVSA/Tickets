const { Router } = require('express');
const router = Router();

const rateLimiterStrict = require('../models/rateLimiterStrict'); // 1 solicitud por minuto
const rateLimiterFast = require('../models/rateLimiterFast'); // 100 solicitudes por segundo

const { actualizarEstadoUsr } = require('../controllers/usuarios/actualizarEstadoUsr');
const { actualizarContraseña } = require('../controllers/usuarios/actualizarContraseña');
const { actualizarUsuario } = require('../controllers/usuarios/actualizarUsuario');
const { obtenerUsuarios } = require('../controllers/usuarios/obtenerUsuarios');
const { registrarUsuario } = require('../controllers/usuarios/registrarUsuario');

const authenticateToken = require('../models/authMiddleware');

// Usar el middleware de Multer antes del controlador
router.post('/obtenerUsuarios', authenticateToken, rateLimiterFast, obtenerUsuarios);
router.post('/actualizarUsuario', authenticateToken, rateLimiterFast, actualizarUsuario);
router.post('/actualizarContraseña', authenticateToken, rateLimiterFast, actualizarContraseña);
router.post('/actualizarEstadoUsr', authenticateToken, rateLimiterFast, actualizarEstadoUsr);
router.post('/registrarUsuario', authenticateToken, rateLimiterFast, registrarUsuario);

module.exports = router;
