const { ticketsPoolPromise } = require('../../db/conexion');

const obtenerConteoTicketsPorEstado = async (req, res) => {
    try {
        const pool = await ticketsPoolPromise;
        const request = pool.request();

        // Consulta única que cuenta tickets agrupados por estado
        const result = await request.query(`
            SELECT 
                estado,
                COUNT(*) as cantidad
            FROM [tickets].[dbo].[ticket]
            WHERE estado IN ('CERRADO', 'LEIDO', 'CREADO')
            GROUP BY estado
        `);

        // Procesar resultados para devolver estructura clara
        const conteos = {
            CERRADO: 0,
            LEIDO: 0,
            CREADO: 0
        };

        result.recordset.forEach(row => {
            conteos[row.estado] = row.cantidad;
        });

        res.json({
            success: true,
            data: {
                cerrados: conteos.CERRADO,
                leidos: conteos.LEIDO,
                activos: conteos.CREADO,
                total: conteos.CERRADO + conteos.LEIDO + conteos.CREADO
            }
        });
        
    } catch (error) {
        console.error('Error al obtener el conteo de tickets:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener el conteo de tickets' 
        });
    }
};

module.exports = { obtenerConteoTicketsPorEstado };