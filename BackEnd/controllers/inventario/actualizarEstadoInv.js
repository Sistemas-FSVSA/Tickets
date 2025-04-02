const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const sql = require("mssql");

const actualizarEstadoInv = async (req, res) => {
    const { idinventario, estado, motivoDesactivacion } = req.body;

    try {
        const sistemasPool = await sistemasPoolPromise;

        // Comienza una transacción
        const transaction = new sql.Transaction(sistemasPool);
        await transaction.begin();

        try {
            // Consulta para actualizar el estado del equipo en inventario
            const queryUpdateEstado = `
          UPDATE inventario
          SET estado = @estado
          WHERE idinventario = @idinventario;`;

            await transaction
                .request()
                .input("idinventario", sql.Int, idinventario)
                .input("estado", sql.Int, estado)
                .query(queryUpdateEstado);

            // Si el estado es desactivado (0), guardamos el motivo de desactivación en la tabla mensajes
            if (estado === 0) {
                const queryInsertMensaje = `
            INSERT INTO mensaje (idinventario, mensaje, fecha)
            VALUES (@idinventario, @motivoDesactivacion, GETDATE());`;

                await transaction
                    .request()
                    .input("idinventario", sql.Int, idinventario)
                    .input("motivoDesactivacion", sql.VarChar, motivoDesactivacion)
                    .query(queryInsertMensaje);
            }

            // Si el equipo está siendo activado, eliminamos el registro de mensajes anterior (si lo hubiera)
            if (estado === 1) {
                const queryDeleteMensaje = `
            DELETE FROM mensaje 
            WHERE idinventario = @idinventario;`;

                await transaction
                    .request()
                    .input("idinventario", sql.Int, idinventario)
                    .query(queryDeleteMensaje);
            }

            // Confirma la transacción
            await transaction.commit();

            res.status(200).send({
                success: true,
                message: "Estado del equipo actualizado correctamente"
            });
        } catch (err) {
            // Revertir la transacción en caso de error
            await transaction.rollback();
            console.error("Error al actualizar el estado del equipo:", err.message);
            res.status(500).send({
                success: false,
                message: "Error al actualizar el estado del equipo"
            });
        }
    } catch (err) {
        console.error("Error al iniciar la transacción:", err.message);
        res.status(500).send({
            success: false,
            message: "Error al actualizar el equipo"
        });
    }
};


module.exports = { actualizarEstadoInv };