const { ticketsPoolPromise } = require('../../db/conexion');

const obtenerEquiposActivos = async (req, res) => {
  try {
    const pool = await ticketsPoolPromise;

    const result = await pool.request()
      .query(`
        SELECT 
          COUNT(*) AS totalEquiposActivos
        FROM [sistemas].[dbo].[inventario]
        WHERE estado = 1
      `);

    const totalActivos = result.recordset[0].totalEquiposActivos;

    return res.status(200).json({
      success: true,
      data: {
        totalEquiposActivos: totalActivos
      },
      message: 'Conteo de equipos activos obtenido correctamente'
    });
  } catch (error) {
    console.error('Error al obtener equipos activos:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error del servidor al obtener equipos activos' 
    });
  }
};

module.exports = { obtenerEquiposActivos };