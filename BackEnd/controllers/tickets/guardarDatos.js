const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const sql = require("mssql");

const guardarDatos = async (req, res) => {
    const { tipo, valor } = req.body;

    const tablasTickets = {
        dependencia: { tabla: "dependencias", campo: "nombre", param: "@valor" }, // En tickets es "dependencias"
        soporte: { tabla: "soporte", campo: "nombre", param: "@valor" },
        temas: { tabla: "temas", campo: "nombre", param: "@valor" },
    };

    const tablasSistemas = {
        dependencia: { tabla: "dependencia", campo: "nombre", param: "@valor" }, // En sistemas es "dependencia"
    };

    if (!tablasTickets[tipo]) {
        return res.status(400).send("Tipo de dato no válido");
    }

    let ticketsPool, sistemasPool;
    let ticketsTransaction, sistemasTransaction;

    try {
        ticketsPool = await ticketsPoolPromise;
        ticketsTransaction = new sql.Transaction(ticketsPool);
        await ticketsTransaction.begin();

        const insertQueryTickets = `INSERT INTO ${tablasTickets[tipo].tabla} (${tablasTickets[tipo].campo}, estado) VALUES (${tablasTickets[tipo].param}, @estado)`;

        // Inserción en tickets
        const ticketsRequest = new sql.Request(ticketsTransaction);
        ticketsRequest.input("valor", sql.VarChar, valor);
        ticketsRequest.input("estado", sql.Bit, true);
        await ticketsRequest.query(insertQueryTickets);

        // Si es dependencia, también insertar en sistemas con otro nombre de tabla
        if (tipo === "dependencia") {
            sistemasPool = await sistemasPoolPromise;
            sistemasTransaction = new sql.Transaction(sistemasPool);
            await sistemasTransaction.begin();

            const insertQuerySistemas = `INSERT INTO ${tablasSistemas[tipo].tabla} (${tablasSistemas[tipo].campo}, estado) VALUES (${tablasSistemas[tipo].param}, @estado)`;

            const sistemasRequest = new sql.Request(sistemasTransaction);
            sistemasRequest.input("valor", sql.VarChar, valor);
            sistemasRequest.input("estado", sql.Bit, true);
            await sistemasRequest.query(insertQuerySistemas);

            // Confirmar ambas transacciones
            await sistemasTransaction.commit();
        }

        await ticketsTransaction.commit();

        const mensaje = `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrada exitosamente${tipo === "dependencia" ? " en ambas bases de datos" : ""}`;
        return res.status(200).json({ message: mensaje });

    } catch (err) {
        // Rollback en caso de error
        if (ticketsTransaction) await ticketsTransaction.rollback();
        if (sistemasTransaction) await sistemasTransaction.rollback();

        console.error(`Error al registrar ${tipo}:`, err.message);
        return res.status(500).json({ error: `Error al registrar ${tipo}` });
    }
};

module.exports = { guardarDatos };
