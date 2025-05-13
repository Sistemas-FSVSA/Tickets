const { ticketsPoolPromise } = require('../../db/conexion');

const obtenerSoportes = async (req, res) => {
  try {
    const { fechainicio, fechafin } = req.body;

    if (!fechainicio || !fechafin) {
      return res.status(400).json({ message: 'fechainicio y fechafin son requeridos' });
    }

    const pool = await ticketsPoolPromise;

    const result = await pool.request()
      .input('fechaInicio', fechainicio)
      .input('fechaFin', fechafin)
      .query(`
        SELECT 
          t.idticket,
          g.idsoporte,
          s.nombre AS nombreSoporte
        FROM ticket t
        INNER JOIN gestion g ON t.idticket = g.idticket
        INNER JOIN soporte s ON g.idsoporte = s.idsoporte
        WHERE 
          CONVERT(DATE, t.fechainicio) BETWEEN CONVERT(DATE, @fechaInicio) AND CONVERT(DATE, @fechaFin)
      `);

    const tickets = result.recordset;

    return res.status(200).json({
      data: tickets,
      total: tickets.length
    });
  } catch (error) {
    console.error('Error al obtener soportes:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = { obtenerSoportes };