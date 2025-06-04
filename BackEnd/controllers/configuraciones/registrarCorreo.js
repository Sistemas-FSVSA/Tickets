const { sistemasPoolPromise } = require('../../db/conexion');

const registrarCorreo = async (req, res) => {
    let { proveedor, correo, password } = req.body;
    const estado = 1; // Siempre activo

    // Validaciones básicas
    if (!proveedor || !correo || !password) {
        return res.status(400).json({ 
            success: false,
            message: 'Todos los campos son requeridos' 
        });
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
        return res.status(400).json({
            success: false,
            message: 'El formato del correo electrónico no es válido'
        });
    }

    try {
        const pool = await sistemasPoolPromise;

        // Verificar si el correo ya existe
        const checkQuery = `
            SELECT COUNT(*) as count 
            FROM configemail 
            WHERE correo = @correo
        `;

        const checkResult = await pool.request()
            .input('correo', correo)
            .query(checkQuery);

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico ya está registrado'
            });
        }

        // Insertar nuevo correo
        const insertQuery = `
        INSERT INTO configemail (proveedor, correo, password, estado)
        VALUES (@proveedor, @correo, @password, @estado)
    `;

        await pool.request()
            .input('proveedor', proveedor)
            .input('correo', correo)
            .input('password', password)
            .input('estado', estado) // Siempre 1
            .query(insertQuery);

        return res.status(201).json({
            success: true,
            message: 'Configuración de correo registrada exitosamente'
        });

    } catch (error) {
        console.error('Error al registrar correo:', error);
        return res.status(500).json({
            success: false,
            message: 'Error del servidor al registrar el correo'
        });
    }
};

module.exports = { registrarCorreo };