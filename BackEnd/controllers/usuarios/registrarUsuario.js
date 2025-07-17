const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const bcrypt = require('bcrypt'); // Importa bcrypt

async function registrarUsuario(req, res) {
    try {
        const { nombres, apellidos, documento, contrasena, correo } = req.body;
        if (!nombres || !apellidos || !documento || !contrasena ) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
        }

        // Encriptar la contraseña
        const hash = await bcrypt.hash(contrasena, 10);

        // Insertar en la base de datos
        const pool = await sistemasPoolPromise;
        await pool.request()
            .input('nombres', nombres)
            .input('apellidos', apellidos)
            .input('documento', documento)
            .input('contrasena', hash)
            .input('correo', correo)
            .query(`
                INSERT INTO [sistemas].[dbo].[responsable]
                (nombres, apellidos, documento, contrasena, rol, estado, correo)
                VALUES (@nombres, @apellidos, @documento, @contrasena, 1, 1, @correo)
            `);

        res.json({ success: true, message: 'Usuario registrado correctamente.' });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ success: false, message: 'Error interno al registrar usuario.' });
    }
}

module.exports = { registrarUsuario };