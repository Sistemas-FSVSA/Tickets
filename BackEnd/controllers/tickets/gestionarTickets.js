const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');

const gestionarTickets = async (req, res) => {
    try {
        const { idticket, observacion, idsoporte, falsaalarma, SN } = req.body;

        // Validar que los campos requeridos estén presentes
        if (!idticket || !observacion || typeof falsaalarma === 'undefined') {
            return res.status(400).json({
                error: 'Faltan datos requeridos: idticket, observacion, idsoporte o falsaalarma',
            });
        }

        // Obtener conexión al pool de tickets
        const pool = await ticketsPoolPromise;

        // Iniciar una transacción
        const transaction = pool.transaction();

        try {
            await transaction.begin();

            // Insertar en la tabla gestion
            const insertQuery = `
                INSERT INTO gestion (idticket, observacion, idsoporte, falsaalarma, SN, fechagestion)
                VALUES (@idticket, @observacion, @idsoporte, @falsaalarma, @SN, GETDATE())
            `;

            const insertRequest = transaction.request();
            insertRequest.input('idticket', idticket);
            insertRequest.input('observacion', observacion);
            insertRequest.input('idsoporte', idsoporte || null);
            insertRequest.input('falsaalarma', falsaalarma);
            insertRequest.input('SN', SN || null); // Valor opcional, usa null si no se proporciona

            await insertRequest.query(insertQuery);

            // Actualizar el estado del ticket a "CERRADO"
            const updateQuery = `
                UPDATE ticket
                SET estado = 'CERRADO', fechacierre = GETDATE()
                WHERE idticket = @idticket
            `;

            const updateRequest = transaction.request();
            updateRequest.input('idticket', idticket);

            const updateResult = await updateRequest.query(updateQuery);

            if (updateResult.rowsAffected[0] === 0) {
                throw new Error('No se pudo cerrar el ticket: idticket no encontrado.');
            }

            // Confirmar la transacción
            await transaction.commit();

            return res.status(201).json({
                message: 'Gestión creada y ticket cerrado correctamente',
                idticket,
            });
        } catch (transactionError) {
            // Revertir la transacción en caso de error
            await transaction.rollback();
            throw transactionError;
        }
    } catch (error) {
        console.error('Error al gestionar el ticket:', error);
        res.status(500).json({ error: 'Error del servidor al gestionar el ticket' });
    }
};

module.exports = { gestionarTickets };