const { ticketsPoolPromise } = require('../../db/conexion');

const obtenerTicketsPorSN = async (req, res) => {
    try {
        const { sn } = req.params;
        
        const pool = await ticketsPoolPromise;
        
        // Primero obtenemos las gestiones con ese SN
        const gestiones = await pool.request()
            .input('sn', sn)
            .query(`
                SELECT g.idticket, g.observacion, g.falsaalarma, g.fechagestion,
                       t.detalle, t.iddependencia, t.idtema, t.usuario,
                       t.estado, t.fechainicio, t.fechacierre
                FROM [tickets].[dbo].[gestion] g
                JOIN [tickets].[dbo].[ticket] t ON g.idticket = t.idticket
                WHERE g.sn = @sn
                ORDER BY g.fechagestion DESC
            `);
        
        if (gestiones.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron tickets para este equipo'
            });
        }
        
        return res.status(200).json({
            success: true,
            tickets: gestiones.recordset,
            total: gestiones.recordset.length
        });
        
    } catch (error) {
        console.error('Error al obtener tickets por SN:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los tickets del equipo'
        });
    }
};

module.exports = { obtenerTicketsPorSN };