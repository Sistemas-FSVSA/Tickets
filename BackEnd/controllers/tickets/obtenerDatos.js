const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const sql = require("mssql");

const obtenerDatos = async (req, res) => {
    try {
        const pool = await ticketsPoolPromise;

        // Consultas para obtener los datos de cada tabla
        const dependenciasResult = await pool.request().query("SELECT * FROM dependencias");
        //const festivosResult = await pool.request().query("SELECT * FROM festivos");
        const soporteResult = await pool.request().query("SELECT * FROM soporte");
        const temasResult = await pool.request().query("SELECT * FROM temas");

        // Almacenar los datos en variables
        const dependencias = dependenciasResult.recordset;
        //const festivos = festivosResult.recordset;
        const soporte = soporteResult.recordset;
        const temas = temasResult.recordset;

        // Enviar los datos como respuesta JSON
        res.json({ dependencias, soporte, temas });
    } catch (err) {
        console.log("Error obteniendo los datos: ", err);
        res.status(500).send("Hubo un error en el servidor, inténtalo de nuevo.");
    }
};

module.exports = { obtenerDatos };