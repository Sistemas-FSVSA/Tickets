const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const sql = require("mssql");

const guardarEquipo = async (req, res) => {
    try {
        const equipoData = req.body;
        const {
            sn, ip, mac, datos, procesador, tiporam, cantidadram, tipoalmacenamiento, cantidadalmacenamiento,
            formatoequipo, marcaequipo, so, nombreequipo, sistemas, dependenciaequipo, responsable, usuario, cargousuario,
            mantenimiento, observaciones, idusuario
        } = equipoData;

        const pool = await sistemasPoolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Verificar si el SN ya existe
            const queryCheckSN = "SELECT COUNT(*) AS count FROM inventario WHERE sn = @sn AND estado = 1";
            const checkResult = await transaction.request()
                .input("sn", sql.VarChar, sn)
                .query(queryCheckSN);

            if (checkResult.recordset[0].count > 0) {
                await transaction.rollback();
                return res.status(400).send("El número de serie (SN) ya existe en la base de datos.");
            }

            // Insertar equipo en inventario
            const queryInventario = `
            INSERT INTO inventario (sn, iddependencia, idmarca, idformato, nombreequipo, ipequipo, estado, mantenimiento)
            VALUES (@sn, @dependencia, @marca, @formatoequipo, @nombreequipo, @ip, 1, @mantenimiento);
            SELECT SCOPE_IDENTITY() AS idinventario;`;

            const inventarioResult = await transaction.request()
                .input("sn", sql.VarChar, sn)
                .input("dependencia", sql.Int, dependenciaequipo)
                .input("marca", sql.Int, marcaequipo)
                .input("formatoequipo", sql.Int, formatoequipo)
                .input("nombreequipo", sql.VarChar, nombreequipo)
                .input("ip", sql.VarChar, ip)
                .input("mantenimiento", sql.Int, mantenimiento)
                .query(queryInventario);

            const idinventario = inventarioResult.recordset[0].idinventario;

            // Insertar detalles del equipo
            const queryDetalle = `
            INSERT INTO detalleequipo (idinventario, idformato, idmarca, iddependencia, responsable, cargousuario, ipequipo, mac, 
            puertodatos, procesador, idram, cantidadram, idalmacenamiento, cantidadalmacenamiento, so, nombreusuario, nombreequipo, 
            usuariosistemas, observacion)
            VALUES (@idinventario, @formatoequipo, @marca, @dependencia, @responsable, @cargousuario, @ip, @mac, @datos, 
            @procesador, @tiporam, @cantidadram, @tipoalmacenamiento, @cantidadalmacenamiento, @so, @usuario, 
            @nombreequipo, @sistemas, @observaciones);`;

            await transaction.request()
                .input("idinventario", sql.Int, idinventario)
                .input("formatoequipo", sql.Int, formatoequipo)
                .input("marca", sql.Int, marcaequipo)
                .input("dependencia", sql.Int, dependenciaequipo)
                .input("responsable", sql.VarChar, responsable)
                .input("cargousuario", sql.VarChar, cargousuario)
                .input("ip", sql.VarChar, ip)
                .input("mac", sql.VarChar, mac)
                .input("datos", sql.VarChar, datos)
                .input("procesador", sql.VarChar, procesador)
                .input("tiporam", sql.Int, tiporam)
                .input("cantidadram", sql.VarChar, cantidadram)
                .input("tipoalmacenamiento", sql.Int, tipoalmacenamiento)
                .input("cantidadalmacenamiento", sql.VarChar, cantidadalmacenamiento)
                .input("so", sql.VarChar, so)
                .input("usuario", sql.VarChar, usuario)
                .input("nombreequipo", sql.VarChar, nombreequipo)
                .input("sistemas", sql.Int, sistemas)
                .input("observaciones", sql.VarChar, observaciones)
                .query(queryDetalle);

            // Programar mantenimiento
            const fechaActual = new Date();
            const fechaProxima = new Date(fechaActual);
            fechaProxima.setFullYear(fechaProxima.getFullYear() + 1);

            const queryMantenimiento = `
            INSERT INTO mantenimiento (idinventario, iddependencia, observacion, fechaactual, fechaproximo, idresponsable)
            VALUES (@idinventario, @iddependencia, @observacion, @fechaactual, @fechaproximo, @idresponsable);`;

            await transaction.request()
                .input("idinventario", sql.Int, idinventario)
                .input("iddependencia", sql.Int, dependenciaequipo)
                .input("observacion", sql.VarChar, "Registrado en la Base de Datos, programado el mantenimiento para dentro de un año")
                .input("fechaactual", sql.Date, fechaActual)
                .input("fechaproximo", sql.Date, fechaProxima)
                .input("idresponsable", sql.Int, idusuario)
                .query(queryMantenimiento);

            // Insertar imágenes si existen
            if (req.files && req.files['archivos[]']) {
                for (const file of req.files['archivos[]']) {
                    const queryImagen = `
                    INSERT INTO imagenes (idinventario, url)
                    VALUES (@idinventario, @URL);`;

                    await transaction.request()
                        .input("idinventario", sql.Int, idinventario)
                        .input("URL", sql.VarChar, `uploads/${file.filename}`)
                        .query(queryImagen);
                }
            }

            await transaction.commit();
            res.status(200).send("Registro exitoso");

        } catch (err) {
            console.error("Error al registrar el equipo:", err.message);
            await transaction.rollback();
            res.status(500).send("Error al registrar el equipo");
        }
    } catch (err) {
        console.error("Error de conexión:", err.message);
        res.status(500).send("Error de conexión a la base de datos");
    }
};

module.exports = { guardarEquipo };
