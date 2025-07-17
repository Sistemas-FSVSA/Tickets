const { ticketsPoolPromise, sistemasPoolPromise } = require('../../db/conexion');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');

const templateClientePath = path.join(__dirname, '../../templates/ticketEmail.html');

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

async function sendTicketEmail(idticket, observacion) {
    try {
        const pool = await ticketsPoolPromise;

        const resultDatos = await pool.request()
            .input('idticket', idticket)
            .query(`
                SELECT t.correo, t.detalle, tem.nombre AS temaNombre, sub.descripcion AS subtemaNombre, usuario
                FROM ticket t
                INNER JOIN temas tem ON t.idtema = tem.idtema
                INNER JOIN subtema sub ON t.idsubtema = sub.idsubtema
                WHERE t.idticket = @idticket
            `);

        if (resultDatos.recordset.length === 0) {
            console.warn("⚠️ Ticket cerrado, pero no se encontraron datos para el correo.");
            return;
        }

        const datos = resultDatos.recordset[0];

        const source = fs.readFileSync(templateClientePath, 'utf-8');
        const template = handlebars.compile(source);
        const htmlContent = template({
            username: datos.usuario,
            idticket: idticket,
            tema: datos.temaNombre,
            subtema: datos.subtemaNombre,
            detalle: datos.detalle || 'Sin detalle',
            observacion: observacion || 'Sin observaciones'
        });

        const emailConfig = await getEmailConfig();
        if (!emailConfig) {
            await pool.request()
                .input('idticket', idticket)
                .input('notemail', 'FALLIDO')
                .query('UPDATE ticket SET notemail = @notemail WHERE idticket = @idticket');
            return;
        }

        const { transporter, correo } = emailConfig;

        await transporter.sendMail({
            from: correo,
            to: datos.correo,
            subject: `Tu ticket ID ${idticket} ha sido gestionado`,
            html: htmlContent
        });

        await pool.request()
            .input('idticket', idticket)
            .input('notemail', 'EXITOSO')
            .query('UPDATE ticket SET notemail = @notemail WHERE idticket = @idticket');

        console.log(`📧 Correo enviado exitosamente para ticket ${idticket}`);
    } catch (err) {
        console.error(`❌ Error al enviar correo para ticket ${idticket}:`, err);
        try {
            const pool = await ticketsPoolPromise;
            await pool.request()
                .input('idticket', idticket)
                .input('notemail', 'FALLIDO')
                .query('UPDATE ticket SET notemail = @notemail WHERE idticket = @idticket');
        } catch (e) {
            console.error(`❌ Error al actualizar notemail como FALLIDO para ticket ${idticket}:`, e);
        }
    }
}

const gestionarTickets = async (req, res) => {
    const pool = await ticketsPoolPromise;
    const transaction = pool.transaction();
    let transactionStarted = false;

    try {
        const { idticket, observacion, idsoporte, falsaalarma, SN, idsubtema } = req.body;

        if (!idticket || !observacion || typeof falsaalarma === 'undefined' || !idsubtema) {
            return res.status(400).json({
                error: 'Faltan datos requeridos: idticket, observacion, idsoporte o falsaalarma',
            });
        }

        await transaction.begin();
        transactionStarted = true;

        const request = transaction.request();
        request.input('idticket', idticket);
        request.input('observacion', observacion);
        request.input('idsoporte', idsoporte || null);
        request.input('falsaalarma', falsaalarma);
        request.input('SN', SN || null);
        request.input('idsubtema', idsubtema);

        await request.query(`
            INSERT INTO gestion (idticket, observacion, idsoporte, falsaalarma, SN, fechagestion, idsubtema)
            VALUES (@idticket, @observacion, @idsoporte, @falsaalarma, @SN, GETDATE(), @idsubtema)
        `);

        const updateResult = await request.query(`
            UPDATE ticket
            SET estado = 'CERRADO', fechacierre = GETDATE()
            WHERE idticket = @idticket
        `);

        if (updateResult.rowsAffected[0] === 0) {
            throw new Error('No se pudo cerrar el ticket: idticket no encontrado.');
        }

        await transaction.commit();

        // 👇 Responder de inmediato
        res.status(200).json({
            message: 'Gestión creada y ticket cerrado correctamente',
            idticket
        });

        // 🚀 Envío del correo en segundo plano (sin bloquear respuesta)
        sendTicketEmail(idticket, observacion);

    } catch (error) {
        if (transactionStarted) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('❌ Error haciendo rollback:', rollbackError);
            }
        }

        console.error('❌ Error al gestionar el ticket:', error);
        return res.status(500).json({ error: 'Error del servidor al gestionar el ticket' });
    }
};

module.exports = { gestionarTickets };
