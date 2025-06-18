const { sistemasPoolPromise } = require("../../db/conexion"); // Conexión a BD

const obtenerCategorias = async (req, res) => {
  try {
    const pool = await sistemasPoolPromise;

    const query = `
      SELECT idcategoria, categoria
      FROM [sistemas].[dbo].[categorias]
      ORDER BY categoria ASC;
    `;

    const result = await pool.request().query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron categorías",
      });
    }

    return res.status(200).json({
      success: true,
      categorias: result.recordset,
      total: result.recordset.length,
    });

  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener las categorías",
    });
  }
};

module.exports = { obtenerCategorias };