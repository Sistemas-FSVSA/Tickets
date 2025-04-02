const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');

const obtenerTemas = async (req, res) => {
    try {
        // Obtener la conexión del pool
        const pool = await ticketsPoolPromise;

        // Ejecutar la consulta para obtener las dependencias
        const result = await pool.request().query('SELECT * FROM temas');

        // Responder con los datos obtenidos
        res.status(200).json({
            message: 'temas obtenidos correctamente',
            temas: result.recordset,
        });
    } catch (error) {
        console.error('Error al obtener los temas:', error);
        res.status(500).json({
            error: 'Ocurrió un error al obtener los temas',
        });
    }
};


module.exports = { obtenerTemas };
