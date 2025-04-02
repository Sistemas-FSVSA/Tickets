const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');

const asignarTickets = async (req, res) => {
    try {
        const { idticket, idusuario } = req.body; // Obtener datos del cuerpo de la solicitud
        if (!idticket || !idusuario) {
            return res.status(400).json({ error: 'Faltan datos requeridos: idticket o idusuario' });
        }

        const pool = await ticketsPoolPromise; // Obtener conexión al pool

        // Actualizar el registro en la tabla ticket
        const updateQuery = `
            UPDATE ticket
            SET idusuario = @idusuario, fechaasignado = GETDATE()
            WHERE idticket = @idticket
        `;

        const result = await pool.request()
            .input('idticket', idticket)
            .input('idusuario', idusuario)
            .query(updateQuery);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado o no actualizado' });
        }

        return res.status(200).json({ message: 'Ticket actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el ticket:', error);
        res.status(500).json({ error: 'Error del servidor al actualizar el ticket' });
    }
};

module.exports = { asignarTickets };