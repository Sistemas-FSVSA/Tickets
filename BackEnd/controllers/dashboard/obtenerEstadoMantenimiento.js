const { sistemasPoolPromise } = require('../../db/conexion');
const moment = require('moment');

const obtenerEstadoMantenimientos = async (req, res) => {
  try {
    const sistemasPool = await sistemasPoolPromise;
    const today = moment().startOf('day'); // Día actual sin horas
    const currentYear = new Date().getFullYear();

    const query = `
      SELECT 
        m.idmantenimiento, 
        m.fechaproximo,
        i.nombreequipo,
        i.sn
      FROM mantenimiento m
      JOIN inventario i ON m.idinventario = i.idinventario
      WHERE i.estado = 1 AND i.mantenimiento = 1
    `;

    const result = await sistemasPool.request().query(query);
    
    // Inicializar contadores
    let conteos = {
      alDia: 0,
      proximos: 0,
      atrasados: 0,
      total: result.recordset.length
    };

    // Contador para equipos con mantenimiento próximo año
    let equiposProximoAno = 0;

    // Clasificar cada equipo
    result.recordset.forEach(record => {
      if (!record.fechaproximo) {
        conteos.atrasados++;
        return;
      }

      const diffDays = moment(record.fechaproximo).diff(today, 'days');
      const yearProximo = new Date(record.fechaproximo).getFullYear();

      // Verificar si el mantenimiento está programado para el próximo año
      if (yearProximo > currentYear) {
        equiposProximoAno++;
      }

      if (diffDays < -2) {
        conteos.atrasados++; // Mantenimiento atrasado (más de 2 días)
      } else if (diffDays >= -2 && diffDays <= 7) {
        conteos.proximos++; // Próximo a vencer (en los próximos 7 días o hasta 2 días pasados)
      } else {
        conteos.alDia++; // Al día (más de 7 días restantes)
      }
    });

    // Calcular porcentajes
    const porcentajes = {
      alDia: Math.round((conteos.alDia / conteos.total) * 100) || 0,
      proximos: Math.round((conteos.proximos / conteos.total) * 100) || 0,
      atrasados: Math.round((conteos.atrasados / conteos.total) * 100) || 0
    };

    // Calcular progreso (porcentaje de equipos con mantenimiento programado para el próximo año)
    const progreso = conteos.total > 0 
      ? Math.round((equiposProximoAno / conteos.total) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        conteos,
        porcentajes,
        progreso: `${progreso}%`, // Agregamos el progreso al response
        equiposProximoAno, // Número de equipos con mantenimiento próximo año
        ultimaActualizacion: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error al obtener estado de mantenimientos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el estado de mantenimientos'
    });
  }
};

module.exports = { obtenerEstadoMantenimientos };