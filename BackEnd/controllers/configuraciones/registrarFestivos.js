const { ticketsPoolPromise } = require('../../db/conexion');
const Holidays = require('date-holidays');
const hd = new Holidays('CO');
const sql = require('mssql');

const obtenerFestivosColombia = async (req, res) => {
    try {
        const { year } = req.params;
        const festivos = hd.getHolidays(Number(year) || new Date().getFullYear())
            .map(f => ({
                fecha: f.date.substring(0, 10),
                motivo: f.name
            }));

        return res.status(200).json({
            success: true,
            festivos
        });
    } catch (error) {
        console.error('Error al obtener festivos de Colombia:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los festivos de Colombia'
        });
    }
};

const registrarFestivosColombia = async (req, res) => {
    const festivos = req.body.festivos;
    if (!Array.isArray(festivos) || festivos.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No se recibieron festivos para registrar'
        });
    }

    try {
        const pool = await ticketsPoolPromise;
        let insertados = 0;
        const existentes = [];
        
        // Usar una transacción para mayor seguridad
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            for (const festivo of festivos) {
                const result = await transaction.request()
                    .input('fecha', festivo.fecha)
                    .query('SELECT COUNT(*) as count FROM [tickets].[dbo].[festivos] WHERE fecha = @fecha');
                
                if (result.recordset[0].count > 0) {
                    existentes.push(festivo.fecha);
                } else {
                    await transaction.request()
                        .input('fecha', festivo.fecha)
                        .input('motivo', festivo.motivo)
                        .query('INSERT INTO [tickets].[dbo].[festivos] (fecha, motivo) VALUES (@fecha, @motivo)');
                    insertados++;
                }
            }
            
            await transaction.commit();
            
            return res.status(200).json({
                success: true,
                message: `Festivos procesados correctamente`,
                data: {
                    insertados,
                    existentes,
                    totalProcesados: festivos.length
                }
            });
            
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
        
    } catch (error) {
        console.error('Error al registrar festivos:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al registrar los festivos'
        });
    }
};

module.exports = { obtenerFestivosColombia, registrarFestivosColombia };