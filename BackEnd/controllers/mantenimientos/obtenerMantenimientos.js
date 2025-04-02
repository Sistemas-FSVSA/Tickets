const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const moment = require("moment");

const obtenerMantenimientos = async (req, res) => {
  try {
    const sistemasPool = await sistemasPoolPromise;

    const query = `
      SELECT 
        m.idmantenimiento, m.idinventario, m.iddependencia, m.observacion, 
        m.fechaactual, m.fechaproximo, i.sn, i.nombreequipo, 
        d.nombre AS nombre_dependencia, m.idresponsable, 
        r.nombres AS nombre_responsable 
      FROM mantenimiento m 
      JOIN dependencia d ON m.iddependencia = d.iddependencia 
      JOIN inventario i ON m.idinventario = i.idinventario 
      JOIN responsable r ON m.idresponsable = r.idresponsable 
      WHERE i.estado = 1 AND i.mantenimiento = 1;
    `;

    const result = await sistemasPool.request().query(query);
    const currentYear = new Date().getFullYear();
    const today = moment().startOf("day"); // Día actual sin horas

    const mantenimiento = result.recordset.map((record) => {
      const fechaActual = record.fechaactual;  // Se devuelve tal cual viene de la BD
      const fechaProximo = record.fechaproximo; // Se devuelve tal cual viene de la BD

      // Determinar estado del semáforo
      let estadoSemaforo = "verde"; // Estado por defecto
      if (fechaProximo) {
        const diffDays = moment(fechaProximo).diff(today, "days");

        if (diffDays < -2) {
          estadoSemaforo = "rojo"; // Pasado más de 2 días
        } else if (diffDays >= -2 && diffDays <= 1) {
          estadoSemaforo = "naranja"; // A punto de vencer
        }
      }

      return {
        ...record,
        estadoSemaforo,
      };
    });

    // Ordenamos los mantenimientos por la fecha de 'fechaproximo'
    mantenimiento.sort((a, b) => new Date(a.fechaproximo) - new Date(b.fechaproximo));

    const totalEquipos = mantenimiento.length;
    const equiposConMantenimientoProximoAno = mantenimiento.filter((item) => 
      item.fechaproximo && new Date(item.fechaproximo).getFullYear() > currentYear
    ).length;

    const progreso = totalEquipos > 0 
      ? Math.round((equiposConMantenimientoProximoAno / totalEquipos) * 100)
      : 0;

    res.json({
      mantenimiento,
      progreso: `${progreso}%`
    });

  } catch (err) {
    console.error("Error al obtener los mantenimientos:", err.message);
    res.status(500).json({
      error: "Hubo un error al cargar los mantenimientos.",
    });
  }
};

module.exports = { obtenerMantenimientos };
