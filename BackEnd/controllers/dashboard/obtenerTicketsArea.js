const { ticketsPoolPromise } = require('../../db/conexion');
const sql = require('mssql');

async function obtenerTicketsArea(req, res) {
    try {
        // Obtener parámetros del cuerpo de la solicitud (body)
        const { fechaInicio, fechaFin } = req.body;

        // Validar parámetros de fecha
        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar ambas fechas (inicio y fin)'
            });
        }

        // Convertir fechas a formato SQL Server si es necesario
        const fechaInicioSQL = new Date(fechaInicio).toISOString();
        const fechaFinSQL = new Date(fechaFin).toISOString();

        // Obtener conexión a la base de datos tickets
        const pool = await ticketsPoolPromise;

        // Consulta SQL para contar tickets por área/dependencia
        const query = `
            SELECT 
                d.iddependencia,
                d.nombre AS nombre_dependencia,
                COUNT(t.idticket) AS cantidad_tickets
            FROM 
                ticket t
            INNER JOIN 
                dependencias d ON t.iddependencia = d.iddependencia
            WHERE 
                t.fechainicio BETWEEN @fechaInicio AND @fechaFin
                AND d.estado = 1  -- Solo dependencias activas
            GROUP BY 
                d.iddependencia, d.nombre
            ORDER BY 
                cantidad_tickets DESC
        `;

        const result = await pool.request()
            .input('fechaInicio', sql.DateTime, fechaInicioSQL)
            .input('fechaFin', sql.DateTime, fechaFinSQL)
            .query(query);

        // Responder con los datos obtenidos
        return res.status(200).json({
            success: true,
            data: result.recordset,
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            totalDependencias: result.recordset.length,
            totalTickets: result.recordset.reduce((sum, item) => sum + item.cantidad_tickets, 0)
        });

    } catch (error) {
        console.error('Error en obtenerTicketsArea:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error al obtener tickets por área'
        });
    }
}

module.exports = { obtenerTicketsArea };