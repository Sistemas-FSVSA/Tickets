const { Router } = require('express');
const { obtenerSoportes } = require('../controllers/dashboard/obtenerSoportes');
const { obtenerDependencias } = require('../controllers/dashboard/obtenerDependencias');
const { obtenerEquiposActivos } = require('../controllers/dashboard/obtenerEquipos');
const { obtenerConteoTicketsPorEstado } = require('../controllers/dashboard/obtenerEstadoTickets');
const { obtenerEstadoMantenimientos } = require('../controllers/dashboard/obtenerEstadoMantenimiento');
const { obtenerModificacionesPorMes } = require('../controllers/dashboard/obtenerModificaciones');
const { obtenerUsuarioMasActivo } = require('../controllers/dashboard/usuarioMasTickets');
const { setupMonitor } = require("../controllers/dashboard/monitorController");
const { obtenerTemasSolicitados } = require('../controllers/dashboard/obtenerTemasSolicitados');
const { obtenerSubtemasSolicitados } = require('../controllers/dashboard/obtenerSubtemasSolicitados');

const router = Router();

router.post('/obtenerSoportes', obtenerSoportes);
router.post('/obtenerDependencias', obtenerDependencias);
router.get('/obtenerEquipos', obtenerEquiposActivos);
router.get('/obtenerEstadoTickets', obtenerConteoTicketsPorEstado);
router.get('/obtenerEstadoMantenimiento', obtenerEstadoMantenimientos);
router.post('/obtenerModificaciones', obtenerModificacionesPorMes);
router.get('/usuarioMasTickets', obtenerUsuarioMasActivo);
router.get('/monitorController', setupMonitor);
router.post('/temas-solicitados', obtenerTemasSolicitados);
router.post('/subtemas-solicitados', obtenerSubtemasSolicitados);

module.exports = router;