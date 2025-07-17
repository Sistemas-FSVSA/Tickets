const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const sql = require("mssql");

const obtenerInfoTickets = async (req, res) => {
    try {
        const { idticket, email } = req.body;

        // Validar que se envíen el idticket y el email
        if (!idticket || !email) {
            return res.status(400).json({ estado: 'error', mensaje: 'El ID del ticket y el email son obligatorios.' });
        }

        // Conectar a la base de datos
        const pool = await ticketsPoolPromise;

        // Consulta para verificar que el idticket y el email coincidan
        const query = `
            SELECT 
                tk.idticket,
                tk.correo,
                tk.usuario,
                tk.ext,
                tk.resumen,
                tk.detalle,
                tk.estado,
                tk.fechainicio,
                tk.fechacierre,
                tk.fechaasignado,
                tk.fechaleido,
                tk.ipticket,
                d.nombre AS dependencia,
                t.nombre AS tema,
                g.observacion,
                g.idsubtema,
                s.descripcion AS subtema
            FROM ticket tk
            INNER JOIN dependencias d ON tk.iddependencia = d.iddependencia
            INNER JOIN temas t ON tk.idtema = t.idtema
            INNER JOIN subtema s ON tk.idsubtema = s.idsubtema
            
            LEFT JOIN gestion g ON tk.idticket = g.idticket
            WHERE tk.idticket = @idticket AND tk.correo = @correo
        `;

        // g.gestion es para traer la gestion que se realizo y mostrarla debajo de la linea de tiempo!

        const result = await pool.request()
            .input('idticket', sql.Int, idticket)
            .input('correo', sql.VarChar, email)
            .query(query);

        // Verificar si se encontró el ticket
        if (result.recordset.length === 0) {
            return res.status(200).json({ estado: 'no_encontrado', mensaje: 'Ticket no encontrado.' });
        }

        // Retornar toda la información del ticket
        const ticketInfo = result.recordset[0];

        res.status(200).json({
            estado: 'ok',
            mensaje: 'Información del ticket obtenida correctamente.',
            ticket: ticketInfo
        });
    } catch (error) {
        console.error('Error al obtener la información del ticket:', error);
        res.status(500).json({ estado: 'error', mensaje: 'Ocurrió un error en el servidor.' });
    }
};


module.exports = { obtenerInfoTickets };
