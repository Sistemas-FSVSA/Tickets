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
            let finalUrl = filePath;

            if (fileExt === '.tif' || fileExt === '.tiff') {
                try {
                    finalUrl = await convertirTIFFaPNG(filePath);
                    fs.unlinkSync(filePath); // Elimina el archivo TIFF original
                } catch (error) {
                    console.error(`❌ No se pudo convertir ${filePath}`);
                    continue;
                }
            }

            valoresInsertar.push(`('${fileName.replace(/\.(tif|tiff)$/, '.png')}', ${fileSize}, '${finalUrl}', '${mesAnio}', GETDATE())`);
        }

        if (valoresInsertar.length > 0) {
            const insertModificacionQuery = `
                INSERT INTO modificaciones (nombre, tamaño, url, fecha, fechasubida)
                VALUES ${valoresInsertar.join(',')}
            `;

            await pool.request().query(insertModificacionQuery);
        }

        res.status(200).json({
            message: `Se almacenaron ${valoresInsertar.length} archivos correctamente.`,
        });

    } catch (error) {
        console.error('❌ Error al guardar archivos:', error);
        res.status(500).json({ error: 'Ocurrió un error en el servidor' });
    }
};

module.exports = { guardarModificaciones };
