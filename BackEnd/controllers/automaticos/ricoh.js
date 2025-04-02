const snmp = require("net-snmp");
const axios = require("axios");

// Configuración de SNMP
const printerIP = "192.168.1.60";
const community = "public";

// OIDs
const tonerOID = "1.3.6.1.2.1.43.11.1.1.9.1.1"; // Nivel de tóner
const printerStatusOID = "1.3.6.1.2.1.25.3.2.1.5.1"; // Estado de la impresora

// Variables para evitar notificaciones repetidas
let ticketEnviado15 = false;
let ticketEnviado5 = false;

// Función para consultar SNMP
function snmpGet(oid) {
    return new Promise((resolve, reject) => {
        const session = snmp.createSession(printerIP, community);
        session.get([oid], (error, varbinds) => {
            session.close();
            if (error) {
                console.error(`Error SNMP (${oid}):`, error);
                return reject(null);
            }
            resolve(varbinds[0].value);
        });
    });
}

// Función para generar un ticket
async function generarTicket(nivel) {
    const ticketData = {
        email: "soporte.funerariasanvicente@gmail.com",
        username: "Sistema Automático TONER",
        extension: "",
        dependencia: "3",
        tema: "1",
        descripcion: `El nivel de tóner ha bajado al ${nivel}%. Se requiere reposición.`,
        ipticket: printerIP,
        images: [] // Enviar un array vacío para evitar errores
    };

    try {
        const response = await axios.post("http://localhost:3101/api/tickets/guardarTickets", ticketData);
        console.log(`✅ Ticket generado con éxito para nivel de tóner: ${nivel}%`);
    } catch (error) {
        console.error("❌ Error al generar el ticket:", error.response ? error.response.data : error.message);
    }
}

// Controlador para obtener datos de la impresora
const ricoh = async (req, res) => {
    console.log("Verificando Ricoh")
    try {
        // Obtener nivel de tóner
        const tonerLevel = await snmpGet(tonerOID);

        // Obtener estado de la impresora
        const statusCode = await snmpGet(printerStatusOID);
        let statusText = "Desconocido";

        if (statusCode !== null) {
            switch (statusCode) {
                case 3:
                    statusText = "Inactiva (Idle)";
                    break;
                case 4:
                    statusText = "Imprimiendo";
                    break;
                case 5:
                    statusText = "Error o atascada";
                    break;
            }
        }

        // 📌 Lógica para enviar tickets
        if (tonerLevel <= 15 && !ticketEnviado15) {
            await generarTicket(15);
            ticketEnviado15 = true; // Marcar que ya se envió el ticket de 15%
        }

        if (tonerLevel <= 5 && !ticketEnviado5) {
            await generarTicket(5);
            ticketEnviado5 = true; // Marcar que ya se envió el ticket de 5%
        }

        // Si el tóner se ha cambiado (nivel mayor a 15%), reiniciar los flags
        if (tonerLevel > 15) {
            ticketEnviado15 = false;
            ticketEnviado5 = false;
        }

        // Responder con JSON
        res.json({
            nivel_toner: tonerLevel,
            estado_impresora: statusText
        });

    } catch (error) {
        res.status(500).json({ error: "Error al obtener datos de la impresora" });
    }
};

module.exports = { ricoh };
