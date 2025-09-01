const { sistemasPoolPromise } = require("../../db/conexion");

const registrarItem = async (req, res) => {
  try {
    const { item, cantidad, idcategoria } = req.body;

    if (!item || !idcategoria || cantidad === undefined) {
      return res.status(400).json({ success: false, message: "Faltan datos obligatorios" });
    }

    const pool = await sistemasPoolPromise;

    await pool.request()
      .input('item', item)
      .input('cantidad', cantidad)
      .input('idcategoria', idcategoria)
      .query(`
        INSERT INTO [sistemas].[dbo].[items] (item, cantidad, idcategoria)
        VALUES (@item, @cantidad, @idcategoria)
      `);

    return res.status(200).json({ success: true, message: "Item registrado correctamente" });
  } catch (error) {
    console.error("Error al registrar item:", error);
    return res.status(500).json({ success: false, message: "Error al registrar el item" });
  }
};

module.exports = { registrarItem };