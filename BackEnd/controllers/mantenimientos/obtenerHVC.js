const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const sql = require("mssql");

const obtenerHVC = async (req, res) => {
    try {
        const { idinventario } = req.body;

        // Validar que idinventario sea un número válido
        if (!idinventario || isNaN(idinventario)) {
            return res.status(400).json({ error: "El idinventario es requerido y debe ser un número válido." });
        }

        const pool = await sistemasPoolPromise;

        // 🔹 PRIMERA CONSULTA: Obtener información del equipo
        const equipoResult = await pool.request()
            .input('idinventario', sql.Int, idinventario)
            .query(`
                SELECT 
                    i.idinventario,
                    i.sn, 
                    i.iddependencia, 
                    dep.nombre AS nombre_dependencia,
                    i.idmarca, 
                    mar.marca AS nombre_marca,
                    i.idformato, 
                    form.formato AS nombre_formato,
                    i.nombreequipo, 
                    i.ipequipo, 
                    i.estado,
                    deq.responsable, 
                    deq.cargousuario, 
                    deq.mac, 
                    deq.puertodatos, 
                    deq.procesador, 
                    deq.idram, 
                    ram.ram AS nombre_tiporam,
                    deq.cantidadram, 
                    deq.idalmacenamiento, 
                    alm.almacenamiento AS nombre_tipoalmacenamiento,
                    deq.cantidadalmacenamiento, 
                    deq.so, 
                    deq.nombreusuario,  
                    deq.usuariosistemas, 
                    deq.observacion
                FROM inventario i
                LEFT JOIN detalleequipo deq ON i.idinventario = deq.idinventario
                LEFT JOIN dependencia dep ON i.iddependencia = dep.iddependencia
                LEFT JOIN marca mar ON i.idmarca = mar.idmarca
                LEFT JOIN formatoequipo form ON i.idformato = form.idformato
                LEFT JOIN tiporam ram ON deq.idram = ram.idram
                LEFT JOIN tipoalmacenamiento alm ON deq.idalmacenamiento = alm.idalmacenamiento
                WHERE i.idinventario = @idinventario;
            `);

        if (equipoResult.recordset.length === 0) {
            return res.status(404).json({ error: "No se encontró información para el idinventario proporcionado." });
        }

        // Extraer información única del equipo
        const equipo = equipoResult.recordset[0];

        // 🔹 SEGUNDA CONSULTA: Obtener historial de mantenimientos
        const mantenimientoResult = await pool.request()
            .input('idinventario', sql.Int, idinventario)
            .query(`
                SELECT 
                    hvc.idactividad, 
                    act.nombre AS nombre_actividad,
                    hvc.fechamantenimiento, 
                    hvc.observacion AS observacion_hvc, 
                    hvc.idresponsable,
                    res.nombres AS nombre_responsable
                FROM hvc
                LEFT JOIN actividad act ON hvc.idactividad = act.idactividad
                LEFT JOIN responsable res ON hvc.idresponsable = res.idresponsable
                WHERE hvc.idinventario = @idinventario;
            `);

        // Lista de mantenimientos (puede estar vacía si el equipo no ha tenido mantenimientos)
        const mantenimientos = mantenimientoResult.recordset;

        // Responder con ambas estructuras separadas
        res.json({ equipo, mantenimientos });

    } catch (err) {
        console.error('Error al obtener la hoja de vida:', err);
        res.status(500).json({ error: 'Hubo un error al obtener la hoja de vida.' });
    }
};

module.exports = { obtenerHVC };
