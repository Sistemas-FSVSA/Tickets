const { Router } = require('express');
const router = Router();

const rateLimiterStrict = require('../models/rateLimiterStrict'); // 1 solicitud por minuto
const rateLimiterFast = require('../models/rateLimiterFast'); // 100 solicitudes por segundo

const { obtenerCorreo } = require('../controllers/configuraciones/obtenerCorreo');
const { actualizarCorreo } = require('../controllers/configuraciones/actualizarCorreo');
const { registrarCorreo } = require('../controllers/configuraciones/registrarCorreo');
const { obtenerFestivos } = require('../controllers/configuraciones/obtenerFestivos');
const { actualizarFestivo } = require('../controllers/configuraciones/actualizarFestivos'); 
const { obtenerFestivosColombia, registrarFestivosColombia } = require('../controllers/configuraciones/registrarFestivos');
const { obtenerHorarios } = require('../controllers/configuraciones/obtenerHorario');
const { actualizarHorario } = require('../controllers/configuraciones/actualizarHorario');

const authenticateToken = require('../models/authMiddleware');

router.get('/obtenerCorreo', authenticateToken, rateLimiterFast, obtenerCorreo);
router.post('/actualizarCorreo/:id', authenticateToken, rateLimiterFast, actualizarCorreo);
router.post('/registrarCorreo', authenticateToken, rateLimiterFast, registrarCorreo);
router.get('/obtenerFestivos', authenticateToken, rateLimiterFast, obtenerFestivos);
router.post('/actualizarFestivo/:fecha', authenticateToken, rateLimiterFast, actualizarFestivo);
router.get('/festivosColombia/:year', obtenerFestivosColombia);
router.post('/registrarFestivosColombia', authenticateToken, rateLimiterFast, registrarFestivosColombia);
router.get('/obtenerHorario', authenticateToken, rateLimiterFast, obtenerHorarios);
router.post('/actualizarHorario/:id', authenticateToken, rateLimiterFast, actualizarHorario);

module.exports = router;
