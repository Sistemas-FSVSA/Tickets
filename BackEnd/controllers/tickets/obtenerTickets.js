const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');

const obtenerTickets = async (req, res) => {
    try {
        const { idticket, estado, filtro } = req.body; // Ahora recibimos "filtro"
        const ticketsPool = await ticketsPoolPromise;

        const getNombreDependencia = async (iddependencia) => {
            const query = `SELECT nombre AS nombreDependencia FROM dependencias WHERE iddependencia = @iddependencia`;
            const result = await ticketsPool.request()
                .input('iddependencia', iddependencia)
                .query(query);
            return result.recordset[0]?.nombreDependencia || null;
        };

        const getNombreTema = async (idtema) => {
            const query = `SELECT nombre AS nombreTema FROM temas WHERE idtema = @idtema`;
            const result = await ticketsPool.request()
                .input('idtema', idtema)
                .query(query);
            return result.recordset[0]?.nombreTema || null;
        };

        if (idticket) {
            const ticketQuery = `SELECT * FROM ticket WHERE idticket = @idticket`;
            const ticketResult = await ticketsPool.request()
                .input('idticket', idticket)
                .query(ticketQuery);

            if (ticketResult.recordset.length === 0) {
                return res.status(404).json({ error: 'Ticket no encontrado' });
            }

            const ticket = ticketResult.recordset[0];

            if (estado) {
                const updateQuery = `UPDATE ticket SET estado = @estado, fechaleido = GETDATE() WHERE idticket = @idticket`;
                await ticketsPool.request()
                    .input('idticket', idticket)
                    .input('estado', estado)
                    .query(updateQuery);
                ticket.estado = estado;
            }

            const sistemasPool = await sistemasPoolPromise;
            const usuarioQuery = `SELECT nombres, apellidos FROM responsable WHERE idresponsable = @idusuario`;
            const usuarioResult = await sistemasPool.request()
                .input('idusuario', ticket.idusuario)
                .query(usuarioQuery);

            if (usuarioResult.recordset.length > 0) {
                const usuario = usuarioResult.recordset[0];
                ticket.nombresUsuario = usuario.nombres;
                ticket.apellidosUsuario = usuario.apellidos;
            }

            ticket.nombreDependencia = await getNombreDependencia(ticket.iddependencia);
            ticket.nombreTema = await getNombreTema(ticket.idtema);

            const attachmentsQuery = `SELECT idadjunto, idticket, url, fecha, tipo FROM adjuntos WHERE idticket = @idticket`;
            const attachmentsResult = await ticketsPool.request()
                .input('idticket', idticket)
                .query(attachmentsQuery);

            const gestionQuery = `SELECT idgestion, idticket, idsoporte, observacion, falsaalarma, sn, fechagestion FROM gestion WHERE idticket = @idticket`;
            const gestionResult = await ticketsPool.request()
                .input('idticket', idticket)
                .query(gestionQuery);

            return res.status(200).json({
                ticket,
                adjuntos: attachmentsResult.recordset,
                gestiones: gestionResult.recordset,
            });
        } else {
            let filtroCondicion = '';
            if (estado && filtro) {
                filtroCondicion = `WHERE estado ${filtro === '=' ? '=' : '!='} @estado`;
            }

            const ticketsQuery = `
                SELECT idticket, usuario, idtema, iddependencia, detalle, fechainicio, estado
                FROM ticket
                ${filtroCondicion}
            `;

            const request = ticketsPool.request();
            if (estado && filtro) {
                request.input('estado', estado);
            }

            const allTicketsResult = await request.query(ticketsQuery);

            if (allTicketsResult.recordset.length === 0) {
                return res.status(200).json({ error: 'No hay tickets disponibles' });
            }

            const tickets = allTicketsResult.recordset;

            const ticketsWithDetails = await Promise.all(
                tickets.map(async (ticket) => {
                    ticket.nombreDependencia = await getNombreDependencia(ticket.iddependencia);
                    ticket.nombreTema = await getNombreTema(ticket.idtema);
                    return ticket;
                })
            );

            return res.status(200).json({ tickets: ticketsWithDetails });
        }
    } catch (error) {
        console.error('Error al obtener los tickets:', error);
        res.status(500).json({ error: 'Error del servidor al obtener los tickets' });
    }
};

module.exports = { obtenerTickets };
