const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const bcrypt = require('bcrypt'); // Importa bcrypt

const actualizarUsuario = async (req, res) => {
    try {
        const { idusuario, nombres, apellidos, correo, documento } = req.body; // Obtener datos del cuerpo de la solicitud

        const sistemasPool = await sistemasPoolPromise; // Obtener conexión al pool

        // Actualizar el registro en la tabla ticket
        const updateQuery = `
            UPDATE responsable
            SET nombres = @nombres, apellidos = @apellidos, correo = @correo, documento = @documento
            WHERE idresponsable = @idusuario
        `;

        const result = await sistemasPool.request()
            .input('idusuario', idusuario)
            .input('nombres', nombres)
            .input('apellidos', apellidos)
            .input('documento', documento)
            .input('correo', correo)
            .query(updateQuery);
        return res.status(200).json({  success: true, message: 'Usuario actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        res.status(500).json({ error: 'Error del servidor al actualizar el usuario' });
    }
};

module.exports = { actualizarUsuario };