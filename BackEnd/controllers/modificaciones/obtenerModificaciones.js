const { sistemasPoolPromise } = require('../../db/conexion');

const obtenerModificaciones = async (req, res) => {
    try {
        const { query } = req.query; // Obtiene el valor de búsqueda desde la URL

        if (!query) {
            return res.status(400).json({ error: 'Debe proporcionar un término de búsqueda.' });
        }

        const pool = await sistemasPoolPromise;

        const searchQuery = `
            SELECT idmodificacion, nombre, tamaño, url, fecha, fechasubida 
            FROM modificaciones 
            WHERE nombre LIKE @query
        `;

        const result = await pool.request()
            .input('query', `%${query}%`) // Búsqueda con LIKE
            .query(searchQuery);

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error al buscar modificaciones:', error);
        res.status(500).json({ error: 'Ocurrió uan error en el servidor' });
    }
};

module.exports = { obtenerModificaciones };
