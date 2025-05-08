const { Router } = require('express');

const { obtenerSoportes } = require('../controllers/dashboard/obtenerSoportes');
const { obtenerDependencias } = require('../controllers/dashboard/obtenerDependencias');

const router = Router();

router.post('/obtenerSoportes', obtenerSoportes);
router.post('/obtenerDependencias', obtenerDependencias);


module.exports = router;
