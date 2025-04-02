const { Router } = require('express');
const { ricoh } = require('../controllers/automaticos/ricoh');

const router = Router();

router.get('/ricoh', ricoh);

module.exports = router;
