const { Router } = require('express');
const router = Router();

const rateLimiterStrict = require('../models/rateLimiterStrict'); // 1 solicitud por minuto
const rateLimiterFast = require('../models/rateLimiterFast'); // 100 solicitudes por segundo

const { obtenerActividades } = require('../controllers/mantenimientos/obtenerActividades');
const { programarMantenimientos } = require('../controllers/mantenimientos/programarMantenimientos');
const { obtenerMantenimientos } = require('../controllers/mantenimientos/obtenerMantenimientos');
const { obtenerEquipoSN } = require('../controllers/mantenimientos/obtenerEquipoSN');
const { obtenerHVC } = require('../controllers/mantenimientos/obtenerHVC');
const { guardarMantenimientos } = require('../controllers/mantenimientos/guardarMantenimientos');

const authenticateToken = require('../models/authMiddleware');

// Usar el middleware de Multer antes del controlador
router.get('/obtenerActividades', authenticateToken, rateLimiterFast, obtenerActividades);
router.post('/programarMantenimientos', authenticateToken, rateLimiterFast, programarMantenimientos);
router.post('/obtenerMantenimientos', authenticateToken, rateLimiterFast, obtenerMantenimientos);
router.post('/obtenerHVC', authenticateToken, rateLimiterFast, obtenerHVC);
router.post('/guardarMantenimientos', authenticateToken, rateLimiterFast, guardarMantenimientos);
router.post('/obtenerEquipoSN', authenticateToken, rateLimiterFast, obtenerEquipoSN);

module.exports = router;
