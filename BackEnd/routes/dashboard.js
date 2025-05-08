const { Router } = require('express');
const router = Router();

const rateLimiterStrict = require('../models/rateLimiterStrict'); // 1 solicitud por minuto
const rateLimiterFast = require('../models/rateLimiterFast'); // 100 solicitudes por segundo

const { obtenerTicketsArea } = require('../controllers/dashboard/obtenerTicketsArea');

const authenticateToken = require('../models/authMiddleware');

// Usar el middleware de Multer antes del controlador
router.post('/obtenerTicketsArea', authenticateToken, rateLimiterFast, obtenerTicketsArea);


module.exports = router;
