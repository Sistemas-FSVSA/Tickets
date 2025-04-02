const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const sql = require("mssql");

const obtenerEquipoSN = async (req, res) => {
    const { sn } = req.body; // Obtener el S/N desde la solicitud
    console.log(req.body)
    try {
        const pool = await sistemasPoolPromise;

        // Consulta que junta la información del inventario y la dependencia
        const result = await pool
            .request()
            .input('sn', sql.VarChar, sn) // Definir el tipo de dato para prevenir inyecciones SQL
            .query(`
                SELECT 
                    i.idinventario, 
                    i.sn, 
                    i.nombreequipo, 
                    d.nombre AS nombre_dependencia
                FROM inventario i
                LEFT JOIN dependencia d ON i.iddependencia = d.iddependencia
                WHERE i.sn = @sn AND i.estado = 1
            `);

        // Si no se encuentra ningún equipo con ese SN
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Equipo no encontrado o inactivo' });
        }

        // Enviar el resultado al frontend
        res.json(result.recordset[0]);
    } catch (err) {
        console.error("Error en la consulta de equipo: ", err);
        res.status(500).json({ message: 'Error en la consulta de equipo' });
    }
};

module.exports = { obtenerEquipoSN };
