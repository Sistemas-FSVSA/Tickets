const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const bcrypt = require('bcrypt'); // Importa bcrypt

const actualizarContraseña = async (req, res) => {
    try {
        const { idusuario, oldpassword, newpassword } = req.body;

        if (!idusuario || !oldpassword || !newpassword) {
            return res.status(400).json({ error: 'Por favor, proporciona los datos completos' });
        }

        const sistemasPool = await sistemasPoolPromise;

        // Consulta para obtener la contraseña actual del usuario
        const usuarioQuery = `
            SELECT contrasena 
            FROM responsable     
            WHERE idresponsable = @idusuario
        `;
        const usuarioResult = await sistemasPool.request()
            .input('idusuario', idusuario)
            .query(usuarioQuery);

        if (usuarioResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = usuarioResult.recordset[0];

        // Compara la contraseña vieja (oldpassword) con la almacenada en la base de datos
        const contrasenaValida = await bcrypt.compare(oldpassword, usuario.contrasena);

        if (!contrasenaValida) {
            // Si la contraseña vieja no es correcta
            return res.status(200).json({ estado: "incorrecto", message: 'Contraseña actual incorrecta' });
        }

        // Si la contraseña vieja es correcta, encriptamos la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newpassword, salt);

        // Actualizamos la contraseña en la base de datos
        const updateQuery = `
            UPDATE responsable
            SET contrasena = @newPassword
            WHERE idresponsable = @idusuario
        `;
        await sistemasPool.request()
            .input('idusuario', idusuario)
            .input('newPassword', newPasswordHash)
            .query(updateQuery);

        // Respuesta exitosa
        return res.status(200).json({ estado: "exitoso", message: 'Contraseña actualizada exitosamente' });

    } catch (error) {
        console.error('Error al cambiar la contraseña:', error);
        res.status(500).json({ error: 'Error del servidor al cambiar la contraseña' });
    }
};

module.exports = { actualizarContraseña };