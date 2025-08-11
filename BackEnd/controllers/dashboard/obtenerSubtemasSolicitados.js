const { ticketsPoolPromise } = require('../../db/conexion');

const obtenerSubtemasSolicitados = async (req, res) => {
    try {
        const pool = await ticketsPoolPromise;

        // Consulta sin filtro de fechas
        const query = `
              SELECT 
    t.idsubtema,
    st.descripcion AS nombreSubtema,
    COUNT(*) AS cantidad
FROM [tickets].[dbo].[ticket] t
LEFT JOIN [tickets].[dbo].[subtema] st 
    ON t.idsubtema = st.idsubtema
WHERE CAST(t.fechainicio AS date) BETWEEN '2025-07-17 11:26:53.597' AND CAST(GETDATE() AS date)
GROUP BY t.idsubtema, st.descripcion
ORDER BY cantidad DESC;
        `;

        console.log('Consulta SQL generada:', query);

        const result = await pool.request().query(query);
        console.log('Resultados de la consulta:', result.recordset);

        return res.status(200).json({
            data: result.recordset,
            total: result.recordset.length
        });

    } catch (error) {
        console.error('Error al obtener subtemas más solicitados:', error);
        return res.status(500).json({ message: 'Error del servidor' });
    }
};

module.exports = { obtenerSubtemasSolicitados };
