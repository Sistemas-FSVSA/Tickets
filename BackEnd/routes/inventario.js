const { Router } = require('express');
const router = Router();

const rateLimiterStrict = require('../models/rateLimiterStrict'); // 1 solicitud por minuto
const rateLimiterFast = require('../models/rateLimiterFast'); // 100 solicitudes por segundo

const { actualizarEstadoInv } = require('../controllers/inventario/actualizarEstadoInv');
const { obtenerInventario } = require('../controllers/inventario/obtenerInventario');
const { guardarEquipo } = require('../controllers/inventario/guardarEquipo');
const { actualizarEquipo } = require('../controllers/inventario/actualizarEquipo');
const { guardarDatos } = require('../controllers/inventario/guardarDatos');
const { obtenerDatos } = require('../controllers/inventario/obtenerDatos');
const { actualizarDatos } = require('../controllers/inventario/actualizarDatos');

const authenticateToken = require('../models/authMiddleware');
const { uploadFields } = require('../models/multer');

// Usar el middleware de Multer antes del controlador
router.post('/obtenerInventario', authenticateToken, rateLimiterFast, obtenerInventario);
router.post('/actualizarEstadoInv', authenticateToken, rateLimiterFast, actualizarEstadoInv);
router.post('/guardarEquipo', authenticateToken, rateLimiterFast, uploadFields, guardarEquipo);
router.post('/actualizarEquipo', authenticateToken, rateLimiterFast, uploadFields, actualizarEquipo);
router.post('/guardarDatos', authenticateToken, rateLimiterFast, guardarDatos);
router.get('/obtenerDatos', authenticateToken, rateLimiterFast, obtenerDatos);
router.post('/actualizarDatos', authenticateToken, rateLimiterFast, actualizarDatos);

module.exports = router;
