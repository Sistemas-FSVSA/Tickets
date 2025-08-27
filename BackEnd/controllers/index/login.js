const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs'); // Importa bcrypt

const login = async (req, res) => {
    try {
        const { identificacion, password } = req.body;

        if (!identificacion || !password) {
            return res.status(400).json({ estado: 'error', mensaje: 'Documento y contraseña son obligatorios.' });
        }

        const pool = await sistemasPoolPromise;

        // Consulta para obtener la información del usuario
        const query = `
            SELECT nombres, apellidos, correo, documento, estado, idresponsable as idusuario, contrasena
            FROM responsable 
            WHERE documento = @identificacion
        `;
        const result = await pool.request()
            .input('identificacion', identificacion)
            .query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ estado: 'no_registrado', mensaje: 'Usuario no registrado.' });
        }

        const usuario = result.recordset[0];

        if (usuario.estado === false) {
            return res.status(403).json({ estado: 'desactivado', mensaje: 'Usuario desactivado.' });
        }

        // Comparar la contraseña encriptada
        const passwordMatch = await bcrypt.compare(password, usuario.contrasena);
        if (!passwordMatch) {
            return res.status(401).json({ estado: 'credenciales_incorrectas', mensaje: 'Contraseña incorrecta.' });
        }

        // Generar el token JWT
        const token = jwt.sign(
            { identificacion: usuario.documento, correo: usuario.correo },
            process.env.JWT_SECRET, // Llama la variable desde .env
            { expiresIn: '12h' } // El token expira en 12 horas
        );

        // Configuración de la cookie
        res.cookie('authToken', token, {
            httpOnly: true, // Solo accesible desde el backend
            secure: false, // Cambiar a `true` si usas HTTPS
            sameSite: 'strict',
            maxAge: 12 * 60 * 60 * 1000, // 12 horas en milisegundos
            path: '/'
        });

        res.status(200).json({
            estado: 'ok',
            mensaje: 'Autenticación exitosa.',
            usuario: {
                nombres: usuario.nombres,
                apellidos: usuario.apellidos,
                correo: usuario.correo,
                identificacion: usuario.documento,
                idusuario: usuario.idusuario,
            },
            token: token
        });
    } catch (error) {
        console.error('Error durante el login:', error);
        res.status(500).json({ estado: 'error', mensaje: 'Ocurrió un error en el servidor.' });
    }
};

module.exports = { login };
