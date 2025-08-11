const { ticketsPoolPromise } = require('../../db/conexion');

const obtenerTemasSolicitados = async (req, res) => {
    try {
        const pool = await ticketsPoolPromise;
        const result = await pool.request().query(`
            SELECT 
                t.idtema,
                tm.nombre AS nombreTema,
                COUNT(*) AS cantidad
            FROM [tickets].[dbo].[ticket] t
            INNER JOIN [tickets].[dbo].[temas] tm ON t.idtema = tm.idtema
            WHERE t.fechainicio BETWEEN '2025-07-17 11:26:53.597' AND GETDATE()
            GROUP BY t.idtema, tm.nombre
            ORDER BY cantidad DESC
        `);

        return res.status(200).json({
            data: result.recordset,
            total: result.recordset.length
        });
    } catch (error) {
        console.error('Error al obtener temas más solicitados:', error);
        return res.status(500).json({ message: 'Error del servidor' });
    }
};

module.exports = { obtenerTemasSolicitados };