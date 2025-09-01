// controllers/bodega/obtenerItems.js
const { sistemasPoolPromise } = require("../../db/conexion");

const obtenerItems = async (req, res) => {
  try {
    const pool = await sistemasPoolPromise;
    const result = await pool.request().query(`
      SELECT i.iditem, i.item, i.cantidad, i.idcategoria
      FROM [sistemas].[dbo].[items] i
      ORDER BY i.item ASC
    `);

    return res.status(200).json({
      success: true,
      items: result.recordset,
      total: result.recordset.length,
    });
  } catch (error) {
    console.error("Error al obtener items:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener los items",
    });
  }
};

module.exports = { obtenerItems };