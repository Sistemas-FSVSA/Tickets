const { Router } = require('express');
const router = Router();

const rateLimiterStrict = require('../models/rateLimiterStrict'); // 1 solicitud por minuto
const rateLimiterFast = require('../models/rateLimiterFast'); // 100 solicitudes por segundo

const { obtenerCorreo } = require('../controllers/configuraciones/obtenerCorreo');
const { actualizarCorreo } = require('../controllers/configuraciones/actualizarCorreo');

const authenticateToken = require('../models/authMiddleware');

router.get('/obtenerCorreo', authenticateToken, rateLimiterFast, obtenerCorreo);
router.post('/actualizarCorreo/:id', authenticateToken, rateLimiterFast, actualizarCorreo);

module.exports = router;
