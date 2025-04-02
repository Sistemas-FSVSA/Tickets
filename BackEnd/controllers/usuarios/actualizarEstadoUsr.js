const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');

const actualizarEstadoUsr = async (req, res) => {
    try {
        const { idusuario, estado } = req.body; // Obtener datos del cuerpo de la solicitud

        const sistemasPool = await sistemasPoolPromise; // Obtener conexión al pool

        // Actualizar solo el estado del usuario en la tabla "responsable"
        const updateQuery = `
            UPDATE responsable
            SET estado = @estado
            WHERE idresponsable = @idusuario
        `;

        await sistemasPool.request()
            .input('idusuario', idusuario)
            .input('estado', estado)
            .query(updateQuery);

        return res.status(200).json({ success: true, message: 'Estado del usuario actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el estado del usuario:', error);
        res.status(500).json({ error: 'Error del servidor al actualizar el estado del usuario' });
    }
};

module.exports = { actualizarEstadoUsr };
