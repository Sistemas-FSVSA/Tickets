const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const sql = require("mssql");

const actualizarDatos = async (req, res) => {
    const { tipo, id, estado } = req.body;

    const tablasTickets = {
        dependencia: { tabla: "dependencias", idCampo: "iddependencia" }, // En tickets es "dependencias"
        soporte: { tabla: "soporte", idCampo: "idsoporte" },
        temas: { tabla: "temas", idCampo: "idtema" },
    };

    const tablasSistemas = {
        dependencia: { tabla: "dependencia", idCampo: "iddependencia" } // En sistemas es "dependencia"
    };

    if (!tablasTickets[tipo]) {
        return res.status(400).send("Tipo de dato no válido");
    }

    let ticketsPool, sistemasPool;
    let ticketsTransaction, sistemasTransaction;

    try {
        // Conectar a tickets y empezar transacción
        ticketsPool = await ticketsPoolPromise;
        ticketsTransaction = new sql.Transaction(ticketsPool);
        await ticketsTransaction.begin();

        const updateQueryTickets = `UPDATE ${tablasTickets[tipo].tabla} SET estado = @estado WHERE ${tablasTickets[tipo].idCampo} = @id`;

        const ticketsRequest = new sql.Request(ticketsTransaction);
        ticketsRequest.input("id", sql.Int, id);
        ticketsRequest.input("estado", sql.Bit, estado);
        await ticketsRequest.query(updateQueryTickets);

        // Si es dependencia, también actualizar en sistemas
        if (tipo === "dependencia") {
            sistemasPool = await sistemasPoolPromise;
            sistemasTransaction = new sql.Transaction(sistemasPool);
            await sistemasTransaction.begin();

            const updateQuerySistemas = `UPDATE ${tablasSistemas[tipo].tabla} SET estado = @estado WHERE ${tablasSistemas[tipo].idCampo} = @id`;

            const sistemasRequest = new sql.Request(sistemasTransaction);
            sistemasRequest.input("id", sql.Int, id);
            sistemasRequest.input("estado", sql.Bit, estado);
            await sistemasRequest.query(updateQuerySistemas);

            // Confirmar transacción en sistemas
            await sistemasTransaction.commit();
        }

        // Confirmar transacción en tickets
        await ticketsTransaction.commit();

        return res.status(200).json({
            message: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} actualizado exitosamente${tipo === "dependencia" ? " en ambas bases de datos" : ""}`
        });

    } catch (err) {
        // Rollback en caso de error
        if (ticketsTransaction) await ticketsTransaction.rollback();
        if (sistemasTransaction) await sistemasTransaction.rollback();

        console.error(`Error al actualizar ${tipo}:`, err.message);
        return res.status(500).json({ error: `Error al actualizar ${tipo}` });
    }
};

module.exports = { actualizarDatos };
