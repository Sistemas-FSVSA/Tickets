const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const bcrypt = require('bcrypt'); // Importa bcrypt

const actualizarUsuario = async (req, res) => {
    try {
        const { idusuario, nombres, apellidos, correo, documento, contrasena } = req.body; // Obtener datos del cuerpo de la solicitud

        const sistemasPool = await sistemasPoolPromise; // Obtener conexión al pool

        // Actualizar el registro en la tabla ticket
        let updateQuery = `
            UPDATE responsable
            SET nombres = @nombres, apellidos = @apellidos, correo = @correo, documento = @documento
        `;

        if (contrasena) {
            updateQuery += `, contrasena = @contrasena`;
        }

        updateQuery += ` WHERE idresponsable = @idusuario`;

        const request = await sistemasPool.request()
            .input('idusuario', idusuario)
            .input('nombres', nombres)
            .input('apellidos', apellidos)
            .input('documento', documento)
            .input('correo', correo)

        if (contrasena) {
            const hash = await bcrypt.hash(contrasena, 10);
            request.input('contrasena', hash);
        }

        await request.query(updateQuery);

        return res.status(200).json({ success: true, message: 'Usuario actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        res.status(500).json({ error: 'Error del servidor al actualizar el usuario' });
    }
};

module.exports = { actualizarUsuario };