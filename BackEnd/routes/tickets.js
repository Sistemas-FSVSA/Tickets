const { Router } = require('express');
const router = Router();

const rateLimiterStrict = require('../models/rateLimiterStrict'); // 1 solicitud por minuto
const rateLimiterFast = require('../models/rateLimiterFast'); // 100 solicitudes por segundo

const { obtenerSoportes } = require('../controllers/tickets/obtenerSoportes');
const { gestionarTickets } = require('../controllers/tickets/gestionarTickets');
const { obtenerTickets } = require('../controllers/tickets/obtenerTickets');
const { asignarTickets } = require('../controllers/tickets/asignarTickets');
const { guardarTickets } = require('../controllers/tickets/guardarTickets')
const { obtenerInfoTickets } = require('../controllers/tickets/obtenerInfoTickets')
const { obtenerDependencias } = require('../controllers/tickets/obtenerDependencias')
const { obtenerTemas } = require('../controllers/tickets/obtenerTemas')
const { obtenerDatos } = require('../controllers/tickets/obtenerDatos');
const { guardarDatos } = require('../controllers/tickets/guardarDatos');
const { actualizarDatos } = require('../controllers/tickets/actualizarDatos');

const authenticateToken = require('../models/authMiddleware');
const { uploadFields } = require('../models/multer');



// Usar el middleware de Multer antes del controlador
router.get('/obtenerSoportes', authenticateToken, rateLimiterFast, obtenerSoportes);
router.post('/obtenerTickets', authenticateToken, rateLimiterFast, obtenerTickets);
router.post('/asignarTickets', authenticateToken, rateLimiterFast, asignarTickets);
router.post('/gestionarTickets', authenticateToken, rateLimiterFast, gestionarTickets);
router.post('/guardarTickets', rateLimiterStrict, uploadFields, guardarTickets);
router.post('/obtenerInfoTickets', rateLimiterFast, obtenerInfoTickets);
router.get('/obtenerDependencias', rateLimiterFast, obtenerDependencias);
router.get('/obtenerTemas', rateLimiterFast, obtenerTemas);
router.get('/obtenerDatos', authenticateToken, rateLimiterFast, obtenerDatos);
router.post('/guardarDatos', authenticateToken, rateLimiterFast, guardarDatos);
router.post('/actualizarDatos', authenticateToken, rateLimiterFast, actualizarDatos);

module.exports = router;
