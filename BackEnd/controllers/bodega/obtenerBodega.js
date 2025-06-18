const { sistemasPoolPromise } = require("../../db/conexion"); // Conexión a BD

// Ruta para obtener los registros de bitacora con los datos de items y responsable
const obtenerBodega = async (req, res) => {
  try {
    const pool = await sistemasPoolPromise;
    
    const query = `
      SELECT b.idbitacora, 
        b.iditem, 
        i.item AS item_nombre, 
        b.tipomovimiento, 
        b.cantidad, 
        b.valor_anterior, 
        b.valor_nuevo, 
        b.fecha, 
        b.idresponsable, 
        r.nombres AS responsable_nombres, 
        r.apellidos AS responsable_apellidos
      FROM [sistemas].[dbo].[bitacorabodega] b
      LEFT JOIN [sistemas].[dbo].[items] i ON b.iditem = i.iditem
      LEFT JOIN [sistemas].[dbo].[responsable] r ON b.idresponsable = r.idresponsable
      ORDER BY b.fecha DESC;
    `;

    const result = await pool.request().query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron registros en bitacora",
      });
    }

    return res.status(200).json({
      success: true,
      bodega: result.recordset,
      total: result.recordset.length,
    });

  } catch (error) {
    console.error("Error al obtener bodega:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener los datos de bodega",
    });
  }
};

module.exports = { obtenerBodega };