const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const sql = require("mssql");

const guardarDatos = async (req, res) => {
    const { tipo, valor } = req.body;

    const tablasSistemas = {
        dependencia: { tabla: "dependencia", campo: "nombre", param: "@valor" },
        formato: { tabla: "formatoequipo", campo: "formato", param: "@valor" },
        actividad: { tabla: "actividad", campo: "nombre", param: "@valor" },
        ram: { tabla: "tiporam", campo: "ram", param: "@valor" },
        marca: { tabla: "marca", campo: "marca", param: "@valor" },
        almacenamiento: { tabla: "tipoalmacenamiento", campo: "almacenamiento", param: "@valor" },
    };

    const tablasTickets = {
        dependencia: { tabla: "dependencias", campo: "nombre", param: "@valor" }, // Diferente nombre en tickets
    };

    if (!tablasSistemas[tipo]) {
        return res.status(400).send("Tipo de dato no válido");
    }

    let sistemasPool, ticketsPool;
    let sistemasTransaction, ticketsTransaction;

    try {
        sistemasPool = await sistemasPoolPromise;
        sistemasTransaction = new sql.Transaction(sistemasPool);
        await sistemasTransaction.begin();

        const insertQuerySistemas = `INSERT INTO ${tablasSistemas[tipo].tabla} (${tablasSistemas[tipo].campo}, estado) VALUES (${tablasSistemas[tipo].param}, @estado)`;

        // Inserción en sistemas
        const sistemasRequest = new sql.Request(sistemasTransaction);
        sistemasRequest.input("valor", sql.VarChar, valor);
        sistemasRequest.input("estado", sql.Bit, true);
        await sistemasRequest.query(insertQuerySistemas);

        // Si el tipo es "dependencia", también se inserta en tickets con diferente tabla
        if (tipo === "dependencia") {
            ticketsPool = await ticketsPoolPromise;
            ticketsTransaction = new sql.Transaction(ticketsPool);
            await ticketsTransaction.begin();

            const insertQueryTickets = `INSERT INTO ${tablasTickets[tipo].tabla} (${tablasTickets[tipo].campo}, estado) VALUES (${tablasTickets[tipo].param}, @estado)`;

            const ticketsRequest = new sql.Request(ticketsTransaction);
            ticketsRequest.input("valor", sql.VarChar, valor);
            ticketsRequest.input("estado", sql.Bit, true);
            await ticketsRequest.query(insertQueryTickets);

            // Commit en ambas bases de datos
            await ticketsTransaction.commit();
        }

        await sistemasTransaction.commit();

        const mensaje = `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrada exitosamente${tipo === "dependencia" ? " en ambas bases de datos" : ""}`;
        return res.status(200).json({ message: mensaje });

    } catch (err) {
        // Rollback en caso de error
        if (sistemasTransaction) await sistemasTransaction.rollback();
        if (ticketsTransaction) await ticketsTransaction.rollback();

        console.error(`Error al registrar ${tipo}:`, err.message);
        return res.status(500).json({ error: `Error al registrar ${tipo}` });
    }
};

module.exports = { guardarDatos };
