const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const sql = require("mssql");

const guardarMantenimientos = async (req, res) => {
    const { idactividad, observacion, idinventario, idusuario } = req.body;

    try {
        const pool = await sistemasPoolPromise;
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            const idresponsable = idusuario;
            const queryHVC = `
                INSERT INTO hvc (idinventario, idactividad, fechamantenimiento, observacion, idresponsable)
                VALUES (@idinventario, @idactividad, GETDATE(), @observacion, @idresponsable)`;

            await transaction
                .request()
                .input('idinventario', sql.Int, idinventario)
                .input('idactividad', sql.Int, idactividad)
                .input('observacion', sql.VarChar, observacion)
                .input('idresponsable', sql.Int, idresponsable)
                .query(queryHVC);

            if (parseInt(idactividad) === 1) {
                const queryMantenimiento = `
                    UPDATE mantenimiento 
                    SET observacion = @observacion, 
                        fechaactual = GETDATE(), 
                        fechaproximo = DATEADD(YEAR, 1, GETDATE()), 
                        idresponsable = @idresponsable 
                    WHERE idinventario = @idinventario`;

                await transaction
                    .request()
                    .input('observacion', sql.VarChar, observacion)
                    .input('idresponsable', sql.Int, idresponsable)
                    .input('idinventario', sql.Int, idinventario)
                    .query(queryMantenimiento);

            } 

            await transaction.commit();
            res.status(200).json({ message: 'Mantenimiento registrado con éxito' });

        } catch (err) {
            await transaction.rollback();
            console.error(' Error registrando el mantenimiento:', err.message);
            res.status(500).json({ error: 'Error registrando el mantenimiento' });
        }
    } catch (err) {
        console.error(' Error conectando a la base de datos:', err.message);
        res.status(500).json({ error: 'Error conectando a la base de datos' });
    }
};

module.exports = { guardarMantenimientos };

