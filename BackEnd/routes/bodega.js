const { Router } = require('express');
const router = Router();

const rateLimiterStrict = require('../models/rateLimiterStrict'); // 1 solicitud por minuto
const rateLimiterFast = require('../models/rateLimiterFast'); // 100 solicitudes por segundo

const { obtenerBodega } = require('../controllers/bodega/obtenerBodega');
const { obtenerCategorias } = require('../controllers/bodega/obtenerCategorias');
const { registrarItem } = require('../controllers/bodega/registrarItem');
const { obtenerItems } = require('../controllers/bodega/obtenerItems');
const { registrarMovimiento } = require('../controllers/bodega/registrarMovimiento');

const authenticateToken = require('../models/authMiddleware');

router.get('/obtenerBodega', authenticateToken, rateLimiterFast, obtenerBodega);
router.get('/obtenerCategorias', authenticateToken, rateLimiterFast, obtenerCategorias);
router.post('/registrarItem', authenticateToken, rateLimiterFast, registrarItem);
router.get('/obtenerItems', authenticateToken, rateLimiterFast, obtenerItems);
router.post('/registrarMovimiento', authenticateToken, rateLimiterFast, registrarMovimiento);
router.get('/vistaRegistros', authenticateToken, (req, res) => {
    res.render('bodega/registroBodega', {
        movimientos: [] // luego aquí puedes pasar datos reales
    });
});


module.exports = router;