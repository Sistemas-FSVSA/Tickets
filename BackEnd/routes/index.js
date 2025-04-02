const { Router } = require('express');
const router = Router();

const rateLimiterStrict = require('../models/rateLimiterStrict'); // 1 solicitud por minuto
const rateLimiterFast = require('../models/rateLimiterFast'); // 100 solicitudes por segundo

const { login } = require('../controllers/index/login');
const { logout } = require('../controllers/index/logout');
const { horario } = require('../controllers/index/horario'); 


// Usar el middleware de Multer antes del controlador
router.post('/login', rateLimiterFast, login);
router.post('/horario', rateLimiterFast, horario);
router.post('/logout', rateLimiterFast, logout);

module.exports = router;
