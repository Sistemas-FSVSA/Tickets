const multer = require('multer');
const path = require('path');

// Configuración para guardar archivos en una carpeta llamada 'uploads'
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');  // La carpeta debe existir
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));  // Nombre del archivo con timestamp
    }
});

const upload = multer({ storage: storage });

// Middleware para procesar la subida de archivos
const uploadFields = upload.fields([
    { name: 'images[]', maxCount: 2 },
    { name: 'files[]', maxCount: 2 },
    { name: 'archivos[]', maxCount: 500 }
]);

module.exports = { uploadFields };
