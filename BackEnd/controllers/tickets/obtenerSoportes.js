const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');

const obtenerSoportes = async (req, res) => {
    try {
        // Obtener la conexión del pool
        const pool = await ticketsPoolPromise;

        // Ejecutar la consulta para obtener los soportes
        const result = await pool.request().query('SELECT * FROM soporte');

        // Responder con los datos obtenidos
        res.status(200).json({
            message: 'Soportes obtenidos correctamente',
            soportes: result.recordset,
        });
    } catch (error) {
        console.error('Error al obtener los soportes:', error);
        res.status(500).json({
            error: 'Ocurrió un error al obtener los soportes',
        });
    }
};


module.exports = { obtenerSoportes };
