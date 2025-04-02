const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');

const obtenerActividades = async (req, res) => {
    try {
        const pool = await sistemasPoolPromise; 
        const actividadResult = await pool.request().query("SELECT * FROM actividad");
        const actividad = actividadResult.recordset;
        res.json({ actividad });
    } catch (err) {
        console.error("Error obteniendo los datos: ", err);
        res.status(500).json({ error: "Hubo un error en el servidor, inténtalo de nuevo." });
    }
};

module.exports = { obtenerActividades };
