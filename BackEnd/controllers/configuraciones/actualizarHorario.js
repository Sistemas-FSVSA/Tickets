const { ticketsPoolPromise } = require('../../db/conexion');

const actualizarHorario = async (req, res) => {
    try {
        const { id } = req.params;
        const { horaInicio, horaFin, estado } = req.body;
        
        const pool = await ticketsPoolPromise;
        const request = pool.request()
            .input('id', id);
        
        let updateQuery = 'UPDATE [tickets].[dbo].[horario] SET ';
        const updates = [];
        
        if (horaInicio !== undefined) {
            request.input('inicia', horaInicio);
            updates.push('inicia = @inicia');
        }
        
        if (horaFin !== undefined) {
            request.input('fin', horaFin);
            updates.push('fin = @fin');
        }
        
        if (estado !== undefined) {
            request.input('estado', estado);
            updates.push('estado = @estado');
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No se proporcionaron campos para actualizar' 
            });
        }
        
        updateQuery += updates.join(', ') + ' WHERE id = @id';
        
        await request.query(updateQuery);
            
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error al actualizar horario:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error al actualizar horario' 
        });
    }
};

module.exports = { actualizarHorario };