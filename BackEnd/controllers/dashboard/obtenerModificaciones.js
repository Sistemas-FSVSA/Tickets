const { sistemasPoolPromise } = require('../../db/conexion');

const obtenerModificacionesPorMes = async (req, res) => {
    try {
        const { anio } = req.body; // Recibimos el año desde el cuerpo de la solicitud

        if (!anio || isNaN(anio)) {
            return res.status(400).json({
                success: false,
                error: 'Debe proporcionar un año válido'
            });
        }

        const sistemasPool = await sistemasPoolPromise;

        // Consulta SQL ajustada para manejar el formato 'YYYY-MM'
        const query = `
            SELECT 
                MONTH(CAST(fecha + '-01' AS DATE)) as mes, -- Convertir 'YYYY-MM' a una fecha válida
                COUNT(idmodificacion) as cantidad
            FROM [sistemas].[dbo].[modificaciones]
            WHERE YEAR(CAST(fecha + '-01' AS DATE)) = @anio -- Filtrar por el año proporcionado
            GROUP BY MONTH(CAST(fecha + '-01' AS DATE))
            ORDER BY mes;
        `;

        const result = await sistemasPool.request()
            .input('anio', anio) // Enviar el año como parámetro
            .query(query);

        // Formatear respuesta para incluir todos los meses (incluso los que no tienen datos)
        const modificacionesPorMes = Array.from({ length: 12 }, (_, i) => {
            const mes = i + 1;
            const registro = result.recordset.find(r => r.mes === mes);
            return {
                mes,
                nombreMes: new Date(2000, i, 1).toLocaleString('default', { month: 'short' }),
                cantidad: registro ? registro.cantidad : 0
            };
        });

        res.json({
            success: true,
            data: modificacionesPorMes
        });

    } catch (error) {
        console.error('Error al obtener modificaciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los datos'
        });
    }
};

module.exports = { obtenerModificacionesPorMes };