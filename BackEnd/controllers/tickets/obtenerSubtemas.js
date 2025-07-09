const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');

const obtenerSubtemas = async (req, res) => {
    try {
        // Puedes filtrar por idtema si lo envías por query o body
        const { idtema } = req.query; // o req.body si usas POST

        let query = `
            SELECT idsubtema, idtema, descripcion, estado
            FROM [tickets].[dbo].[subtema]
            WHERE estado = 1
        `;

        if (idtema) {
            query += ' AND idtema = @idtema';
        }

        const pool = await ticketsPoolPromise;
        const request = pool.request();
        if (idtema) request.input('idtema', idtema);

        const result = await request.query(query);

        res.json({ subtemas: result.recordset });
    } catch (error) {
        console.error('Error al obtener subtemas:', error);
        res.status(500).json({ message: 'Error al obtener subtemas' });
    }
};

module.exports = { obtenerSubtemas };