const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');

const obtenerDependencias = async (req, res) => {
    try {
        // Obtener la conexión del pool
        const pool = await ticketsPoolPromise;

        // Ejecutar la consulta para obtener las dependencias
        const result = await pool.request().query('SELECT * FROM dependencias');

        // Responder con los datos obtenidos
        res.status(200).json({
            message: 'Dependencias obtenidas correctamente',
            dependencias: result.recordset,
        });
    } catch (error) {
        console.error('Error al obtener las dependencias:', error);
        res.status(500).json({
            error: 'Ocurrió un error al obtener las dependencias',
        });
    }
};

module.exports = { obtenerDependencias };