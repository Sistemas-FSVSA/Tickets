const { ticketsPoolPromise } = require('../../db/conexion');

const obtenerFestivos = async (req, res) => {
    try {
        const pool = await ticketsPoolPromise;
        const result = await pool.request().query(`
            SELECT [fecha], [motivo]
            FROM [tickets].[dbo].[festivos]
            ORDER BY [fecha] ASC
        `);

        res.json({
            success: true,
            festivos: result.recordset
        });
    } catch (error) {
        console.error('Error al obtener festivos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los festivos'
        });
    }
};

module.exports = { obtenerFestivos };