const { ticketsPoolPromise } = require('../../db/conexion');

const obtenerHorarios = async (req, res) => {
    try {
        const pool = await ticketsPoolPromise;
        
        const result = await pool.request()
            .query(`
                SELECT 
                    id,
                    dia,
                    CONVERT(VARCHAR(5), inicia, 108) as inicia,
                    CONVERT(VARCHAR(5), fin, 108) as fin,
                    estado
                FROM [tickets].[dbo].[horario]
                ORDER BY dia, inicia
            `);

        // Mapear los días numéricos a nombres
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const horarios = result.recordset.map(horario => ({
            ...horario,
            diaNombre: diasSemana[horario.dia] || `Día ${horario.dia}`
        }));

        return res.status(200).json({
            success: true,
            horarios,
            total: horarios.length
        });

    } catch (error) {
        console.error('Error al obtener horarios:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los horarios'
        });
    }
};

module.exports = { obtenerHorarios };