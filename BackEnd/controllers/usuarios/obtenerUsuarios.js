const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const bcrypt = require('bcrypt'); // Importa bcrypt

const obtenerUsuarios = async (req, res) => {
    try {
        const { idusuario } = req.body; // Obtener idticket y estado desde el body
        const sistemasPool = await sistemasPoolPromise;

        if (idusuario) {
            // Consulta para obtener la información del ticket
            const usuarioQuery = `
                SELECT 
                    *
                FROM 
                    responsable     
                WHERE 
                    idresponsable = @idusuario`;
            const usuarioResult = await sistemasPool.request()
                .input('idusuario', idusuario)
                .query(usuarioQuery);

            if (usuarioResult.recordset.length === 0) {
                return res.status(404).json({ error: 'usuario no encontrado' });
            }

            const usuario = usuarioResult.recordset[0];

            return res.status(200).json({
                usuario,
            });
        } else {
            const usuariosQuery = `
                SELECT 
                    *
                FROM 
                    responsable
            `;

            const allUsuariosResult = await sistemasPool.request().query(usuariosQuery);
            const usuarios = allUsuariosResult.recordset;

            return res.status(200).json({
                usuarios,
            });
        }
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        res.status(500).json({ error: 'Error del servidor al obtener los usuarios' });
    }
};

module.exports = { obtenerUsuarios };