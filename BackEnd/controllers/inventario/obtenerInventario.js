const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const sql = require("mssql");

const obtenerInventario = async (req, res) => {
    try {
        const { idinventario } = req.body;
        const sistemasPool = await sistemasPoolPromise;

        if (idinventario) {
            const inventarioQuery = `
                SELECT 
                    i.estado,
                    i.sn,
                    i.mantenimiento,
                    de.idinventario,
                    de.idformato,
                    de.idmarca,
                    de.iddependencia,
                    de.responsable,
                    de.cargousuario,
                    de.ipequipo,
                    de.mac,
                    de.puertodatos,
                    de.procesador,
                    de.idram,
                    de.cantidadram,
                    de.idalmacenamiento,
                    de.cantidadalmacenamiento,
                    de.so,
                    de.nombreusuario,
                    de.nombreequipo,
                    de.usuariosistemas,
                    de.observacion,
                    mto.fechaactual,
                    mto.fechaproximo,
                    mto.observacion AS observacion_mantenimiento,
                    d.nombre AS dependencia_nombre,
                    m.marca AS marca_nombre,
                    f.formato AS formato_nombre,
                    t.almacenamiento AS tipoalmacenamiento_nombre,
                    tr.ram AS tiporam_nombre,
                    msg.mensaje AS motivoDesactivacion,
                    msg.fecha AS fechaDesactivacion,
                    img.url
                FROM 
                    inventario i
                    LEFT JOIN detalleequipo de ON i.idinventario = de.idinventario
                    LEFT JOIN mantenimiento mto ON de.idinventario = mto.idinventario
                    LEFT JOIN dependencia d ON de.iddependencia = d.iddependencia
                    LEFT JOIN marca m ON de.idmarca = m.idmarca
                    LEFT JOIN formatoequipo f ON de.idformato = f.idformato
                    LEFT JOIN tipoalmacenamiento t ON de.idalmacenamiento = t.idalmacenamiento
                    LEFT JOIN tiporam tr ON de.idram = tr.idram
                    LEFT JOIN mensaje msg ON de.idinventario = msg.idinventario AND i.estado = 0
                    LEFT JOIN imagenes img ON i.idinventario = img.idinventario
                WHERE 
                    i.idinventario = @idinventario;
            `;

            const inventarioResult = await sistemasPool.request()
                .input('idinventario', idinventario)
                .query(inventarioQuery);

            if (inventarioResult.recordset.length === 0) {
                return res.status(404).json({ error: 'Inventario no encontrado' });
            }

            // Procesar datos del inventario
            const inventarioBase = inventarioResult.recordset[0];
            const inventario = {
                estado: inventarioBase.estado,
                sn: inventarioBase.sn,
                mantenimiento: inventarioBase.mantenimiento,
                idinventario: inventarioBase.idinventario,
                idformato: inventarioBase.idformato,
                idmarca: inventarioBase.idmarca,
                iddependencia: inventarioBase.iddependencia,
                responsable: inventarioBase.responsable,
                cargousuario: inventarioBase.cargousuario,
                ipequipo: inventarioBase.ipequipo,
                mac: inventarioBase.mac,
                puertodatos: inventarioBase.puertodatos,
                procesador: inventarioBase.procesador,
                idram: inventarioBase.idram,
                cantidadram: inventarioBase.cantidadram,
                idalmacenamiento: inventarioBase.idalmacenamiento,
                cantidadalmacenamiento: inventarioBase.cantidadalmacenamiento,
                so: inventarioBase.so,
                nombreusuario: inventarioBase.nombreusuario,
                nombreequipo: inventarioBase.nombreequipo,
                usuariosistemas: inventarioBase.usuariosistemas,
                observacion: inventarioBase.observacion,
                fechaactual: inventarioBase.fechaactual,
                fechaproximo: inventarioBase.fechaproximo,
                observacion_mantenimiento: inventarioBase.observacion_mantenimiento,
                dependencia_nombre: inventarioBase.dependencia_nombre,
                marca_nombre: inventarioBase.marca_nombre,
                formato_nombre: inventarioBase.formato_nombre,
                tipoalmacenamiento_nombre: inventarioBase.tipoalmacenamiento_nombre,
                tiporam_nombre: inventarioBase.tiporam_nombre,
                motivoDesactivacion: inventarioBase.motivoDesactivacion,
                fechaDesactivacion: inventarioBase.fechaDesactivacion,
            };

            // Consolidar imágenes en un array
            const imagenes = inventarioResult.recordset
                .filter(row => row.url) // Filtrar filas con imágenes
                .map(row => `/${row.url}`);

            // Obtener opciones de los selects
            const dependenciasResult = await sistemasPool.request().query('SELECT * FROM dependencia');
            const marcasResult = await sistemasPool.request().query('SELECT * FROM marca');
            const formatosResult = await sistemasPool.request().query('SELECT * FROM formatoequipo');
            const almacenamientoResult = await sistemasPool.request().query('SELECT * FROM tipoalmacenamiento');
            const ramResult = await sistemasPool.request().query('SELECT * FROM tiporam');

            res.status(200).json({
                inventario,
                imagenes,
                opciones: {
                    dependencia: dependenciasResult.recordset,
                    marca: marcasResult.recordset,
                    formato: formatosResult.recordset,
                    almacenamiento: almacenamientoResult.recordset,
                    ram: ramResult.recordset
                }
            });
        } else {
            // Consulta para obtener el resumen de todos los registros
            const inventariosQuery = `
                SELECT i.idinventario, i.sn, d.nombre, m.marca, f.formato, i.nombreequipo, i.ipequipo, i.estado, de.nombreusuario 
                FROM inventario i 
                JOIN dependencia d ON i.iddependencia = d.iddependencia 
                JOIN marca m ON i.idmarca = m.idmarca 
                JOIN formatoequipo f ON i.idformato = f.idformato 
                LEFT JOIN detalleequipo de ON i.idinventario = de.idinventario
            `;

            const allInventariosResult = await sistemasPool.request().query(inventariosQuery);
            const inventarios = allInventariosResult.recordset;

            return res.status(200).json({
                inventarios,
            });
        }
    } catch (error) {
        console.error('Error al obtener el inventario:', error);
        res.status(500).json({ error: 'Error del servidor al obtener el inventario' });
    }
};

module.exports = { obtenerInventario };