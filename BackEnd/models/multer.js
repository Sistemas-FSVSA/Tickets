const multer = require('multer');
const path = require('path');

// Ruta absoluta al NAS montado (unidad de red)
// 🔧 reconstruimos la ruta UNC con doble barra inicial
const uploadDir = '\\\\' + process.env.UPLOAD_PATH;

// Configuración para guardar archivos en la ruta de red
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);  // La carpeta debe existir en la ruta de red
    },
    filename: function (req, file, cb) {
        const fileName = Date.now() + path.extname(file.originalname);
        cb(null, fileName);  // Nombre del archivo con timestamp
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
