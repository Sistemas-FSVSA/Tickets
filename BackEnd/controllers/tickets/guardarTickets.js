const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const { DateTime } = require('luxon');

// Ruta de la plantilla HTML
const templateClientePath = path.join(__dirname, '../../templates/cliente.html');
const templateSoportePath = path.join(__dirname, '../../templates/soporte.html');

// Función para obtener la configuración del correo desde la BD
async function getEmailConfig() {
    try {
        const pool = await sistemasPoolPromise;
        const result = await pool.request()
            .query("SELECT TOP 1 proveedor, correo, password FROM configemail WHERE estado = 1");

        if (result.recordset.length === 0) {
            console.log("⚠️ No hay configuración de correo activa.");
            return null;
        }

        const { proveedor, correo, password } = result.recordset[0];

        let config;
        if (proveedor.toLowerCase() === "google") {
            config = {
                service: 'gmail',
                auth: { user: correo, pass: password }
            };
        } else if (proveedor.toLowerCase() === "outlook") {
            config = {
                host: "smtp.office365.com",
                port: 587,
                secure: false,
                auth: { user: correo, pass: password }
            };
        } else {
            console.log("⚠️ Proveedor de correo no soportado:", proveedor);
            return null;
        }

        return { transporter: nodemailer.createTransport(config), correo };
    } catch (error) {
        console.error("❌ Error obteniendo la configuración de correo:", error);
        return null;
    }
}


const guardarTickets = async (req, res) => {
    let ipticket = req.ip || req.headers['x-forwarded-for'] || 'Desconocida';
    if (ipticket.includes("::ffff:")) {
        ipticket = ipticket.split("::ffff:")[1];
    }

    const data = req.body;

    try {
        const pool = await ticketsPoolPromise;

        const insertTicketQuery = `
            INSERT INTO ticket (correo, usuario, ext, iddependencia, idtema, resumen, detalle, estado, fechainicio, ipticket)
            OUTPUT INSERTED.idticket
            VALUES (@correo, @usuario, @ext, @iddependencia, @idtema, @resumen, @detalle, @estado, GETDATE(), @ipticket)
        `;

        const values = {
            correo: data.email,
            usuario: data.username,
            ext: data.extension,
            iddependencia: data.dependencia,
            idtema: data.tema,
            resumen: data.resumen,
            detalle: data.descripcion,
            estado: 'CREADO',
            ipticket: ipticket
        };

        const result = await pool.request()
            .input('correo', values.correo)
            .input('usuario', values.usuario)
            .input('ext', values.ext)
            .input('iddependencia', values.iddependencia)
            .input('idtema', values.idtema)
            .input('resumen', values.resumen)
            .input('detalle', values.detalle)
            .input('estado', values.estado)
            .input('ipticket', values.ipticket)
            .query(insertTicketQuery);

        const idTicket = result.recordset[0].idticket;

        // Archivos adjuntos (imágenes y otros archivos)
        const images = req.files && req.files['images[]'] ?
            (Array.isArray(req.files['images[]']) ? req.files['images[]'] : [req.files['images[]']]) : [];

        const filesUploaded = req.files && req.files['files[]'] ?
            (Array.isArray(req.files['files[]']) ? req.files['files[]'] : [req.files['files[]']]) : [];

        // Consulta para insertar archivos en la tabla adjuntos
        const insertFileQuery = `
            INSERT INTO adjuntos (idticket, url, fecha, tipo) 
            VALUES (@idticket, @url, GETDATE(), @tipo)
        `;

        // Función para guardar archivos adjuntos
        const insertFiles = async (files) => {
            for (let file of files) {
                const fileUrl = file.path; // Ruta del archivo
                const fileType = path.extname(file.path).substring(1).toLowerCase(); // Extensión del archivo

                let tipo = 'otro'; // Valor predeterminado para el tipo
                if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType)) tipo = 'imagen'; // Tipo imagen
                else if (fileType === 'pdf') tipo = 'pdf'; // Tipo pdf
                else if (fileType === 'xlsx' || fileType === 'xls') tipo = 'excel'; // Tipo excel
                else if (fileType === 'docx' || fileType === 'doc') tipo = 'word'; // Tipo word

                // Insertar en la base de datos
                await pool.request()
                    .input('idticket', idTicket)
                    .input('url', fileUrl)
                    .input('tipo', tipo)
                    .query(insertFileQuery);
            }
        };

        // Guardar imágenes y archivos
        await insertFiles(images);
        await insertFiles(filesUploaded);

        // Leer la plantilla HTML correspondiente
        const templateSourceCliente = fs.readFileSync(templateClientePath, 'utf-8');
        const templateSourceSoporte = fs.readFileSync(templateSoportePath, 'utf-8');

        // Compilar la plantilla con Handlebars
        const templateCliente = handlebars.compile(templateSourceCliente);
        const templateSoporte = handlebars.compile(templateSourceSoporte);

        const htmlContentCliente = templateCliente({
            username: data.username,
            idTicket: idTicket
        });

        const htmlContentSoporte = templateSoporte({
            username: data.username,
            idTicket: idTicket,
            descripcion: data.descripcion,
            fecha: DateTime.now().setZone('America/Bogota').toFormat('yyyy-MM-dd hh:mm:ss a'),
            dependencia: data.dependenciaNombre,
            tema: data.temaNombre,
        });

        // Función para enviar correos
        const sendEmails = async () => {
            const emailConfig = await getEmailConfig();
            if (!emailConfig) {
                console.log("⚠️ No se enviará el correo porque no hay configuración activa.");
                await pool.request()
                    .input('idticket', idTicket)
                    .input('notemail', 'FALLIDO')
                    .query('UPDATE ticket SET notemail = @notemail WHERE idticket = @idticket');
                return;
            }

            const { transporter, correo } = emailConfig;

            try {
                // Enviar correo al cliente
                const mailOptionsUser = {
                    from: correo,
                    to: data.email,
                    subject: 'Ticket generado Exitosamente',
                    html: htmlContentCliente,
                };
                await transporter.sendMail(mailOptionsUser);

                // Enviar correo a soporte
                const mailOptionsSupport = {
                    from: correo,
                    to: 'soporte.funerariasanvicente@gmail.com',
                    subject: `Nuevo ticket generado ID: ${idTicket}`,
                    html: htmlContentSoporte,
                };
                await transporter.sendMail(mailOptionsSupport);

                // Actualizar estado de notificación en la BD
                await pool.request()
                    .input('idticket', idTicket)
                    .input('notemail', 'EXITOSO')
                    .query('UPDATE ticket SET notemail = @notemail WHERE idticket = @idticket');

            } catch (error) {
                console.error('❌ Error al enviar correos:', error);
                await pool.request()
                    .input('idticket', idTicket)
                    .input('notemail', 'FALLIDO')
                    .query('UPDATE ticket SET notemail = @notemail WHERE idticket = @idticket');
            }
        };

        // Enviar correos de forma asíncrona sin bloquear la respuesta
        sendEmails();

        res.status(200).json({
            message: `Ticket generado exitosamente con el ID: ${idTicket}`
        });


    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Ocurrió un error en el servidor' });
    }
};

module.exports = { guardarTickets };