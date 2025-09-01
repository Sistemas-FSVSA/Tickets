const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const { DateTime } = require('luxon');

const templateClientePath = path.join(__dirname, '../../templates/cliente.html');
const templateSoportePath = path.join(__dirname, '../../templates/soporte.html');

async function getEmailConfig() {
    try {
        const pool = await sistemasPoolPromise;
        const result = await pool.request()
            .query("SELECT TOP 1 proveedor, correo, password FROM configemail WHERE estado = 1");

        if (result.recordset.length === 0) return null;

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
            INSERT INTO ticket (correo, usuario, ext, iddependencia, idtema, resumen, detalle, estado, fechainicio, ipticket, idsubtema)
            OUTPUT INSERTED.idticket
            VALUES (@correo, @usuario, @ext, @iddependencia, @idtema, @resumen, @detalle, @estado, GETDATE(), @ipticket, @idsubtema)
        `;

        const values = {
            correo: data.email,
            usuario: data.username,
            ext: data.extension,
            iddependencia: data.dependencia,
            idtema: data.tema,
            resumen: data.temaCompleto,
            detalle: data.descripcion,
            estado: 'CREADO',
            ipticket: ipticket,
            idsubtema: data.idsubtema
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
            .input('idsubtema', values.idsubtema)
            .query(insertTicketQuery);

        const idTicket = result.recordset[0].idticket;

        // Archivos adjuntos
        const images = req.files?.['images[]'] ? (Array.isArray(req.files['images[]']) ? req.files['images[]'] : [req.files['images[]']]) : [];
        const filesUploaded = req.files?.['files[]'] ? (Array.isArray(req.files['files[]']) ? req.files['files[]'] : [req.files['files[]']]) : [];

        const insertFileQuery = `
            INSERT INTO adjuntos (idticket, url, fecha, tipo) 
            VALUES (@idticket, @url, GETDATE(), @tipo)
        `;

        const insertFiles = async (files) => {
            for (let file of files) {
                // 🔧 FIX: Extraer solo el nombre del archivo y crear la ruta relativa
                const fileName = path.basename(file.path); // Solo el nombre: "1756760888777.png"
                const relativePath = `uploads\\${fileName}`; // Ruta relativa: "uploads\1756760888777.png"
                
                const fileType = path.extname(file.path).substring(1).toLowerCase();

                let tipo = 'otro';
                if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType)) tipo = 'imagen';
                else if (fileType === 'pdf') tipo = 'pdf';
                else if (['xlsx', 'xls'].includes(fileType)) tipo = 'excel';
                else if (['doc', 'docx'].includes(fileType)) tipo = 'word';

                await pool.request()
                    .input('idticket', idTicket)
                    .input('url', relativePath) // 🔧 Guardar solo "uploads\archivo.png"
                    .input('tipo', tipo)
                    .query(insertFileQuery);
            }
        };

        await insertFiles(images);
        await insertFiles(filesUploaded);

        const templateSourceCliente = fs.readFileSync(templateClientePath, 'utf-8');
        const templateSourceSoporte = fs.readFileSync(templateSoportePath, 'utf-8');

        const templateCliente = handlebars.compile(templateSourceCliente);
        const templateSoporte = handlebars.compile(templateSourceSoporte);

        const htmlContentCliente = templateCliente({
            username: data.username,
            idTicket: idTicket,
            tema: data.temaNombre,
            subtema: data.subtemaNombre,
            detalle: data.descripcion,
            observacion: data.observacion || data.observaciones || "Sin observaciones"
        });

        const htmlContentSoporte = templateSoporte({
            username: data.username,
            idTicket: idTicket,
            descripcion: data.descripcion,
            fecha: DateTime.now().setZone('America/Bogota').toFormat('yyyy-MM-dd hh:mm:ss a'),
            dependencia: data.dependenciaNombre,
            tema: data.temaNombre,
            subtema: data.subtemaNombre,
        });

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
                await transporter.sendMail({
                    from: correo,
                    to: data.email,
                    subject: 'Ticket generado Exitosamente',
                    html: htmlContentCliente,
                });

                await transporter.sendMail({
                    from: correo,
                    to: 'soporte.funerariasanvicente@gmail.com',
                    subject: `Nuevo ticket generado ID: ${idTicket}`,
                    html: htmlContentSoporte,
                });

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