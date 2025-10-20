const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { sistemasPoolPromise } = require('../../db/conexion');

const convertirTIFFaPNG = (inputPath) => {
    return new Promise((resolve, reject) => {
        const outputPath = inputPath.replace(/\.(tif|tiff)$/, '.png');

        const imageMagickPath = `"C:\\Program Files\\ImageMagick-7.1.1-Q16-HDRI\\magick.exe"`;

        exec(`${imageMagickPath} "${inputPath}" "${outputPath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Error con ImageMagick:`, error);
                return reject(error);
            }
            resolve(outputPath);
        });
    });
};


const guardarModificaciones = async (req, res) => {
    try {
        const { mesAnio } = req.body;
        if (!mesAnio) {
            return res.status(400).json({ error: 'El campo mes y año es obligatorio.' });
        }
        
        const pool = await sistemasPoolPromise;
        const archivosSubidos = Array.isArray(req.files['archivos[]']) ? req.files['archivos[]'] : [];
        
        if (archivosSubidos.length === 0) {
            return res.status(400).json({ error: 'No se han subido archivos.' });
        }
        
        let valoresInsertar = [];
        
        for (let file of archivosSubidos) {
            let filePath = file.path;
            const fileSize = file.size;
            const fileName = file.originalname;
            const fileExt = path.extname(file.originalname).toLowerCase();
            
            // Remover extensión
            const nombreSinExtension = fileName.replace(/\.(tif|tiff|png|jpg|jpeg|pdf)$/i, '');
            
            // Detectar modificaciones
            const palabras = nombreSinExtension.split(' ');
            
            const modificaciones = palabras.filter(codigo => {
                return /^[A-Z]+\d+$/i.test(codigo.trim());
            });
            
            const cantidadModificaciones = modificaciones.length > 0 ? modificaciones.length : 1;
            
            let finalUrl = filePath;
            
            // Convertir TIFF si es necesario
            if (fileExt === '.tif' || fileExt === '.tiff') {
                try {
                    finalUrl = await convertirTIFFaPNG(filePath);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (error) {
                    console.error('❌ Error convirtiendo TIFF:', error);
                    continue;
                }
            }
            
            // ✅ EXTRAER SOLO EL NOMBRE DEL ARCHIVO (timestamp.pdf)
            const nombreArchivo = path.basename(finalUrl);
            
            // ✅ CONSTRUIR RUTA RELATIVA: uploads\timestamp.pdf
            const rutaRelativa = `uploads\\${nombreArchivo}`;
            
            // Escapar comillas para SQL
            const finalUrlEscaped = rutaRelativa.replace(/'/g, "''");
            const fileNameEscaped = fileName.replace(/\.(tif|tiff)$/i, '.png').replace(/'/g, "''");
            
            valoresInsertar.push(
                `('${fileNameEscaped}', ${fileSize}, '${finalUrlEscaped}', '${mesAnio}', GETDATE(), ${cantidadModificaciones})`
            );
        }
        
        if (valoresInsertar.length > 0) {
            const insertModificacionQuery = `
                INSERT INTO modificaciones (nombre, tamaño, url, fecha, fechasubida, total)
                VALUES ${valoresInsertar.join(',')}
            `;
            
            await pool.request().query(insertModificacionQuery);
        }
        
        res.status(200).json({
            message: `Se almacenaron ${valoresInsertar.length} archivos correctamente.`,
        });
    } catch (error) {
        console.error('❌ Error al guardar archivos:', error);
        res.status(500).json({ error: 'Ocurrió un error en el servidor: ' + error.message });
    }
};

module.exports = { guardarModificaciones };