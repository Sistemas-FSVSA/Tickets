const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Obtener la ruta desde la variable de entorno
const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';

// Verificar y crear el directorio si no existe
if (!fs.existsSync(UPLOAD_PATH)) {
    fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

// Configuración para guardar archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_PATH);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024
    }
});

const uploadFields = upload.fields([
    { name: 'images[]', maxCount: 2 },
    { name: 'files[]', maxCount: 2 },
    { name: 'archivos[]', maxCount: 500 }
]);

module.exports = { uploadFields };
