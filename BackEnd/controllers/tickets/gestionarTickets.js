const { ticketsPoolPromise } = require('../../db/conexion');

const gestionarTickets = async (req, res) => {
    try {
        const { idticket, observacion, idsoporte, falsaalarma, SN, idsubtema } = req.body;

        if (!idticket || !observacion || typeof falsaalarma === 'undefined' || !idsubtema) {
            return res.status(400).json({
                error: 'Faltan datos requeridos: idticket, observacion, idsoporte o falsaalarma',
            });
        }

        const pool = await ticketsPoolPromise;
        const transaction = pool.transaction();

        try {
            await transaction.begin();

            // ✅ Un solo request para todo
            const request = transaction.request();
            request.input('idticket', idticket);
            request.input('observacion', observacion);
            request.input('idsoporte', idsoporte || null);
            request.input('falsaalarma', falsaalarma);
            request.input('SN', SN || null);
            request.input('idsubtema', idsubtema);

            // 1. Insertar en gestion
            await request.query(`
                INSERT INTO gestion (idticket, observacion, idsoporte, falsaalarma, SN, fechagestion, idsubtema)
                VALUES (@idticket, @observacion, @idsoporte, @falsaalarma, @SN, GETDATE(), @idsubtema)
            `);

            // 2. Actualizar estado del ticket
            const updateResult = await request.query(`
                UPDATE ticket
                SET estado = 'CERRADO', fechacierre = GETDATE()
                WHERE idticket = @idticket
            `);

            if (updateResult.rowsAffected[0] === 0) {
                throw new Error('No se pudo cerrar el ticket: idticket no encontrado.');
            }

            await transaction.commit();

            return res.status(201).json({
                message: 'Gestión creada y ticket cerrado correctamente',
                idticket,
            });
        } catch (transactionError) {
            await transaction.rollback();
            throw transactionError;
        }
    } catch (error) {
        console.error('❌ Error al gestionar el ticket:', error);
        res.status(500).json({ error: 'Error del servidor al gestionar el ticket' });
    }
};

module.exports = { gestionarTickets };
