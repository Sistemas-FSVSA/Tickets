const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const sql = require("mssql");

const obtenerDatos = async (req, res) => {
    try {
        const pool = await sistemasPoolPromise;

        // Consultas para obtener los datos de cada tabla
        const dependenciasResult = await pool.request().query("SELECT * FROM dependencia");
        const marcasResult = await pool.request().query("SELECT * FROM marca");
        const actividadResult = await pool.request().query("SELECT * FROM actividad");
        const formatosResult = await pool.request().query("SELECT * FROM formatoequipo");
        const almacenamientoResult = await pool.request().query("SELECT * FROM tipoalmacenamiento");
        const ramResult = await pool.request().query("SELECT * FROM tiporam");
        const ultimoSnResult = await pool.request().query("SELECT TOP 1 sn FROM inventario ORDER BY idinventario DESC");

        // Almacenar los datos en variables
        const dependencia = dependenciasResult.recordset;
        const marca = marcasResult.recordset;
        const formato = formatosResult.recordset;
        const almacenamiento = almacenamientoResult.recordset;
        const ram = ramResult.recordset;
        const actividad = actividadResult.recordset;
        const ultimoSn = ultimoSnResult.recordset.length > 0 ? ultimoSnResult.recordset[0].sn : null;

        // Enviar los datos como respuesta JSON
        res.json({ dependencia, marca, formato, almacenamiento, ram, actividad, ultimoSn });
    } catch (err) {
        console.log("Error obteniendo los datos: ", err);
        res.status(500).send("Hubo un error en el servidor, inténtalo de nuevo.");
    }
};

module.exports = { obtenerDatos };
