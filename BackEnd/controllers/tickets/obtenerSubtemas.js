const { ticketsPoolPromise } = require('../../db/conexion');

const obtenerSubtemas = async (req, res) => {
    try {
        const { idtema } = req.query; // Recibe el idtema (tema seleccionado)

        let query = `
            SELECT idsubtema, idtema, descripcion, estado
            FROM [tickets].[dbo].[subtema]
            WHERE estado = 1
        `;

        const pool = await ticketsPoolPromise;
        const request = pool.request();

        if (idtema) {
            query += ' AND idtema = @idtema';
            request.input('idtema', idtema);
        }

        // Ordenar los subtemas por descripcion (alfabéticamente)
        query += ' ORDER BY descripcion ASC';

        const result = await request.query(query);

        res.json({ subtemas: result.recordset });
    } catch (error) {
        console.error('Error al obtener subtemas:', error);
        res.status(500).json({ message: 'Error al obtener subtemas' });
    }
};

module.exports = { obtenerSubtemas };