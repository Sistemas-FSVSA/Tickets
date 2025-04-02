const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const sql = require("mssql");

const programarMantenimientos = async (req, res) => {
    const { fechaProgramacion, idinventario } = req.body;

    if (!fechaProgramacion || !Array.isArray(idinventario) || idinventario.length === 0) {
        return res.status(400).json({ message: 'Datos inválidos' });
    }

    const pool = await sistemasPoolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin(); // Inicia la transacción

        for (const id of idinventario) {
            const request = new sql.Request(transaction);

            const result = await request
                .input('fechaProgramacion', sql.Date, fechaProgramacion)
                .input('idinventario', sql.Int, id)
                .query(`
                    UPDATE mantenimiento 
                    SET fechaproximo = @fechaProgramacion 
                    WHERE idinventario = @idinventario;

                    SELECT @@ROWCOUNT AS filasAfectadas;
                `);

            // Validar si se actualizó al menos una fila
            const filasAfectadas = result.recordset[0].filasAfectadas;
            if (filasAfectadas === 0) {
                throw new Error(`El idinventario ${id} no existe en la base de datos.`);
            }
        }

        await transaction.commit(); // Confirma la transacción si todo está bien

        res.json({ message: 'Mantenimiento programado exitosamente' });

    } catch (err) {
        await transaction.rollback(); // Revierte la transacción si hay error
        console.error("Error al programar mantenimiento:", err);
        res.status(500).json({ message: err.message || 'Error al programar mantenimiento' });
    }
};

module.exports = { programarMantenimientos };
