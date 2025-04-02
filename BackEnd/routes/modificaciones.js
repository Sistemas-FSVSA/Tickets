const { Router } = require('express');
const router = Router();

const { guardarModificaciones } = require('../controllers/modificaciones/guardarModificaciones');
const { obtenerModificaciones } = require('../controllers/modificaciones/obtenerModificaciones');

const authenticateToken = require('../models/authMiddleware');
const { uploadFields } = require('../models/multer');



router.post('/guardarModificaciones', uploadFields, guardarModificaciones);
router.get('/obtenerModificaciones', obtenerModificaciones);

module.exports = router;
