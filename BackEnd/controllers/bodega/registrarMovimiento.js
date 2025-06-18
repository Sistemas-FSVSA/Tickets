const { sistemasPoolPromise } = require("../../db/conexion");

const registrarMovimiento = async (req, res) => {
  try {
    const { iditem, cantidad, idresponsable, tipomovimiento } = req.body;

    if (!iditem || !cantidad || !idresponsable || !tipomovimiento) {
      return res.status(400).json({ success: false, message: "Faltan datos obligatorios" });
    }

    const pool = await sistemasPoolPromise;

    // Obtener stock anterior
    const resultItem = await pool.request()
      .input('iditem', iditem)
      .query('SELECT cantidad FROM [sistemas].[dbo].[items] WHERE iditem = @iditem');
    const stockAnterior = resultItem.recordset[0]?.cantidad ?? 0;

    let stockNuevo;
    if (tipomovimiento.toLowerCase() === 'entrada') {
      stockNuevo = stockAnterior + Number(cantidad);
    } else if (tipomovimiento.toLowerCase() === 'salida') {
      stockNuevo = stockAnterior - Number(cantidad);
      if (stockNuevo < 0) {
        return res.status(400).json({ success: false, message: "No hay suficiente stock para la salida" });
      }
    } else {
      return res.status(400).json({ success: false, message: "Tipo de movimiento inválido" });
    }

    // Registrar en bitacora
    await pool.request()
      .input('iditem', iditem)
      .input('tipomovimiento', tipomovimiento)
      .input('cantidad', cantidad)
      .input('valor_anterior', stockAnterior)
      .input('valor_nuevo', stockNuevo)
      .input('idresponsable', idresponsable)
      .query(`
        INSERT INTO [sistemas].[dbo].[bitacorabodega]
        (iditem, tipomovimiento, cantidad, valor_anterior, valor_nuevo, fecha, idresponsable)
        VALUES (@iditem, @tipomovimiento, @cantidad, @valor_anterior, @valor_nuevo, GETDATE(), @idresponsable)
      `);

    // Actualizar stock en items
    await pool.request()
      .input('iditem', iditem)
      .input('cantidad', stockNuevo)
      .query('UPDATE [sistemas].[dbo].[items] SET cantidad = @cantidad WHERE iditem = @iditem');

    return res.status(200).json({ success: true, message: "Movimiento registrado correctamente" });
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    return res.status(500).json({ success: false, message: "Error al registrar el movimiento" });
  }
};

module.exports = { registrarMovimiento };