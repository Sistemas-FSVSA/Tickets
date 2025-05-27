const { sistemasPoolPromise } = require('../../db/conexion');

const obtenerCorreo = async (req, res) => {
    try {
        const pool = await sistemasPoolPromise;

        const result = await pool.request()
            .query(`
                SELECT 
                    idconfigemail,
                    proveedor,
                    correo,
                    password,
                    estado
                FROM configemail
            `);

        const correos = result.recordset;

        return res.status(200).json({
            data: correos,
            total: correos.length
        });
    } catch (error) {
        console.error('Error al obtener correos:', error);
        return res.status(500).json({ message: 'Error del servidor' });
    }
};

module.exports = { obtenerCorreo };