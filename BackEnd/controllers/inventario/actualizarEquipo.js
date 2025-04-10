const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const sql = require("mssql");
const fs = require('fs');
const path = require('path');

const actualizarEquipo = async (req, res) => {
    const equipoData = req.body;
    const {
        idinventario, sn, ip, mac, datos, procesador, tiporam, cantidadram,
        tipoalmacenamiento, cantidadalmacenamiento, formatoequipo, marca, so, nombreequipo,
        sistemas, mantenimiento, dependencia, responsable, usuario, cargousuario, observaciones,
        idusuario
    } = equipoData;

    try {
        const pool = await sistemasPoolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            console.log("Obteniendo datos actuales del equipo...");

            // Obtener los datos de ambas tablas
            const queryGetCurrentData = `
                SELECT 
                    i.sn, i.iddependencia, i.idmarca, i.idformato, i.nombreequipo, 
                    i.ipequipo, i.mantenimiento,
                    d.responsable, d.cargousuario, d.ipequipo AS ip_detalle, d.mac, 
                    d.puertodatos, d.procesador, d.idram, d.cantidadram, d.idalmacenamiento, 
                    d.cantidadalmacenamiento, d.so, d.nombreusuario, d.usuariosistemas, d.observacion
                FROM inventario i
                INNER JOIN detalleequipo d ON i.idinventario = d.idinventario
                WHERE i.idinventario = @idinventario;`;

            const currentDataResult = await transaction.request()
                .input("idinventario", sql.Int, idinventario)
                .query(queryGetCurrentData);

            if (currentDataResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).send("Equipo no encontrado");
            }

            const currentData = currentDataResult.recordset[0];

            // Mapeo de campos (deben coincidir con los de la consulta SQL)
            const fieldsToCheck = {
                sn, ip, mac, datos, procesador, tiporam, cantidadram, tipoalmacenamiento,
                cantidadalmacenamiento, formatoequipo, marca, so, nombreequipo, sistemas,
                mantenimiento, dependencia, responsable, usuario, cargousuario, observaciones
            };

            const fieldMapping = {
                sn: "sn",
                ip: "ipequipo",
                mac: "mac",
                datos: "puertodatos",
                procesador: "procesador",
                tiporam: "idram",
                cantidadram: "cantidadram",
                tipoalmacenamiento: "idalmacenamiento",
                cantidadalmacenamiento: "cantidadalmacenamiento",
                formatoequipo: "idformato",
                marca: "idmarca",
                so: "so",
                nombreequipo: "nombreequipo",
                sistemas: "usuariosistemas",
                mantenimiento: "mantenimiento",
                dependencia: "iddependencia",
                responsable: "responsable",
                usuario: "nombreusuario",
                cargousuario: "cargousuario",
                observaciones: "observacion"
            };

            for (const [key, newValue] of Object.entries(fieldsToCheck)) {
                const oldValue = currentData[fieldMapping[key]];

                // Normalizar valores para evitar falsos positivos
                const oldVal = oldValue === null || oldValue === undefined ? "" : oldValue.toString().trim();
                const newVal = newValue === null || newValue === undefined ? "" : newValue.toString().trim();

                if (oldVal !== newVal) {
                    console.log(`Cambio detectado en ${key}: "${oldVal}" -> "${newVal}"`);

                    const queryInsertBitacora = `
                    INSERT INTO bitacoracambioequipo (idusuario, idinventario, campo, valor_anterior, valor_nuevo, fecha)
                    VALUES (@idusuario, @idinventario, @campo, @valor_anterior, @valor_nuevo, GETDATE());`;

                    await transaction.request()
                        .input("idusuario", sql.Int, idusuario)
                        .input("idinventario", sql.Int, idinventario)
                        .input("campo", sql.VarChar, key)
                        .input("valor_anterior", sql.VarChar, oldVal)
                        .input("valor_nuevo", sql.VarChar, newVal)
                        .query(queryInsertBitacora);
                }
            }

            // Actualización de inventario
            console.log("Iniciando actualización del inventario...");
            const queryUpdateInventario = `
            UPDATE inventario
            SET sn = @sn, iddependencia = @dependencia, idmarca = @marca, idformato = @formatoequipo, 
                nombreequipo = @nombreequipo, ipequipo = @ip, mantenimiento = @mantenimiento
            WHERE idinventario = @idinventario;`;

            await transaction
                .request()
                .input("idinventario", sql.Int, idinventario)
                .input("sn", sql.VarChar, sn)
                .input("dependencia", sql.Int, dependencia)
                .input("marca", sql.Int, marca)
                .input("formatoequipo", sql.Int, formatoequipo)
                .input("nombreequipo", sql.VarChar, nombreequipo)
                .input("ip", sql.VarChar, ip)
                .input("mantenimiento", sql.Int, mantenimiento)
                .query(queryUpdateInventario);

            console.log("Inventario actualizado correctamente.");

            // Actualización de detalleequipo
            console.log("Iniciando actualización del detalle del equipo...");
            const queryUpdateDetalleEquipo = `
            UPDATE detalleequipo
            SET idformato = @formatoequipo, idmarca = @marca, iddependencia = @dependencia, 
                responsable = @responsable, cargousuario = @cargousuario, ipequipo = @ip, mac = @mac, 
                puertodatos = @datos, procesador = @procesador, idram = @tiporam, 
                cantidadram = @cantidadram, idalmacenamiento = @tipoalmacenamiento, 
                cantidadalmacenamiento = @cantidadalmacenamiento, so = @so, nombreusuario = @usuario, 
                nombreequipo = @nombreequipo, usuariosistemas = @sistemas, observacion = @observaciones
            WHERE idinventario = @idinventario;`;

            await transaction
                .request()
                .input("idinventario", sql.Int, idinventario)
                .input("formatoequipo", sql.Int, formatoequipo)
                .input("marca", sql.Int, marca)
                .input("dependencia", sql.Int, dependencia)
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
                .input("sistemas", sql.VarChar, sistemas)
                .input("observaciones", sql.VarChar, observaciones)
                .query(queryUpdateDetalleEquipo);

            // ==== Manejo de imágenes (siempre elimina las viejas, agrega nuevas si hay) ====

            // Obtener las imágenes actuales
            const queryGetImages = `
                SELECT url FROM imagenes WHERE idinventario = @idinventario;`;

            const currentImagesResult = await transaction.request()
                .input("idinventario", sql.Int, idinventario)
                .query(queryGetImages);

            const currentImages = currentImagesResult.recordset;

            // Eliminar de la BD
            const queryDeleteImages = `
                DELETE FROM imagenes WHERE idinventario = @idinventario;`;

            await transaction.request()
                .input("idinventario", sql.Int, idinventario)
                .query(queryDeleteImages);

            const uploadsPath = path.join(__dirname, '../../../backend/uploads');

            for (const image of currentImages) {
                const filePath = path.join(uploadsPath, image.url.replace(/^uploads[\\/]/, ''));
                console.log('Intentando eliminar:', filePath);

                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log('Archivo eliminado:', filePath);
                    } else {
                        console.log('Archivo no encontrado:', filePath);
                    }
                } catch (error) {
                    console.error('Error al eliminar archivo:', error);
                }
            }

            // Insertar nuevas si existen
            const archivosNuevos = req.files?.['archivos[]'];
            if (archivosNuevos && archivosNuevos.length > 0) {
                for (const file of archivosNuevos) {
                    const queryInsertImage = `
                        INSERT INTO imagenes (idinventario, url)
                        VALUES (@idinventario, @URL);`;

                    await transaction.request()
                        .input("idinventario", sql.Int, idinventario)
                        .input("URL", sql.VarChar, `uploads/${file.filename}`)
                        .query(queryInsertImage);
                }
            }


            console.log("Detalle del equipo actualizado correctamente.");
            await transaction.commit();
            console.log("Transacción completada con éxito.");
            res.status(200).send({ message: "Equipo actualizado correctamente" });

        } catch (err) {
            await transaction.rollback();
            console.error("Error en la actualización:", err.message);
            res.status(500).send("Error al actualizar el equipo");
        }
    } catch (err) {
        console.error("Error en la conexión:", err.message);
        res.status(500).send("Error de conexión a la base de datos");
    }
};

module.exports = { actualizarEquipo };
