const { ticketsPoolPromise } = require('../../db/conexion');

const actualizarFestivo = async (req, res) => {
    const { fecha } = req.params; // La fecha original del festivo (clave primaria)
    const { nuevaFecha, motivo } = req.body;

    if (!nuevaFecha || !motivo) {
        return res.status(400).json({
            success: false,
            message: 'La fecha y el motivo son requeridos'
        });
    }

    try {
        const pool = await ticketsPoolPromise;
        const result = await pool.request()
            .input('fecha', fecha)
            .input('nuevaFecha', nuevaFecha)
            .input('motivo', motivo)
            .query(`
                UPDATE [tickets].[dbo].[festivos]
                SET [fecha] = @nuevaFecha, [motivo] = @motivo
                WHERE [fecha] = @fecha
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Festivo no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Festivo actualizado correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar festivo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el festivo'
        });
    }
};

module.exports = { actualizarFestivo };