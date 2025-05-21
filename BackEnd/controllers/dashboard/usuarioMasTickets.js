const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');

const obtenerUsuarioMasActivo = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5; // Por defecto 5, puede recibir parámetro
        
        // 1. Obtener las IPs que más tickets han generado
        const ticketsPool = await ticketsPoolPromise;
        const topIpsQuery = `
            SELECT TOP ${limit}
                ipticket,
                COUNT(idticket) as cantidad_tickets,
                MAX(fechainicio) as ultima_fecha
            FROM [tickets].[dbo].[ticket]
            WHERE ipticket IS NOT NULL AND ipticket <> ''
            GROUP BY ipticket
            ORDER BY cantidad_tickets DESC
        `;
        
        const topIpsResult = await ticketsPool.request().query(topIpsQuery);
        
        if (!topIpsResult.recordset.length) {
            return res.json({
                success: true,
                data: [],
                message: 'No se encontraron tickets registrados'
            });
        }

        // 2. Buscar información de los usuarios asociados a esas IPs
        const sistemasPool = await sistemasPoolPromise;
        const resultados = [];
        
        for (const ipData of topIpsResult.recordset) {
            const ip = ipData.ipticket;
            
            const usuarioQuery = `
                SELECT TOP 1
                    de.nombreusuario,
                    de.ipequipo,
                    d.nombre as nombre_dependencia,
                    de.cargousuario
                FROM [sistemas].[dbo].[detalleequipo] de
                LEFT JOIN [sistemas].[dbo].[dependencia] d ON de.iddependencia = d.iddependencia
                WHERE de.ipequipo = @ip
                ORDER BY de.iddetalle DESC
            `;
            
            const usuarioResult = await sistemasPool.request()
                .input('ip', ip)
                .query(usuarioQuery);

            // 3. Obtener el último ticket de cada IP
            const ultimoTicketQuery = `
                SELECT TOP 1
                    t.idticket,
                    t.detalle,
                    t.estado,
                    t.fechainicio,
                    te.nombre as nombre_tema
                FROM [tickets].[dbo].[ticket] t
                LEFT JOIN [tickets].[dbo].[temas] te ON t.idtema = te.idtema
                WHERE t.ipticket = @ip
                ORDER BY t.fechainicio DESC
            `;
            
            const ultimoTicketResult = await ticketsPool.request()
                .input('ip', ip)
                .query(ultimoTicketQuery);

            resultados.push({
                estadisticas: {
                    cantidad_tickets: ipData.cantidad_tickets,
                    ultima_fecha: ipData.ultima_fecha,
                    ip: ip
                },
                usuario: usuarioResult.recordset.length ? {
                    nombre: usuarioResult.recordset[0].nombreusuario || 'No disponible',
                    dependencia: usuarioResult.recordset[0].nombre_dependencia || 'No disponible',
                    cargo: usuarioResult.recordset[0].cargousuario || 'No disponible',
                    ip: usuarioResult.recordset[0].ipequipo || ip
                } : null,
                ultimo_ticket: ultimoTicketResult.recordset.length ? {
                    id: ultimoTicketResult.recordset[0].idticket,
                    detalle: ultimoTicketResult.recordset[0].detalle || 'Sin detalle',
                    estado: ultimoTicketResult.recordset[0].estado || 'Desconocido',
                    fecha: ultimoTicketResult.recordset[0].fechainicio,
                    tema: ultimoTicketResult.recordset[0].nombre_tema || 'Sin tema'
                } : null
            });
        }

        res.json({
            success: true,
            data: resultados
        });

    } catch (error) {
        console.error('Error al obtener usuarios más activos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener la información de los usuarios más activos',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = { obtenerUsuarioMasActivo };