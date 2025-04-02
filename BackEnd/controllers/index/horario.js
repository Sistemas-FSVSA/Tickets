const { ticketsPoolPromise } = require('../../db/conexion');

const horario = async (req, res) => {
    try {
        const pool = await ticketsPoolPromise;
        const { fechaHora } = req.body;
        const fechaSinHora = fechaHora.split("T")[0];

        // 📌 Verificar si la fecha es festivo
        const festivoQuery = `
            SELECT fecha, motivo 
            FROM festivos 
            WHERE CONVERT(DATE, fecha) = @fecha
        `;
        const festivoResult = await pool.request()
            .input("fecha", fechaSinHora)
            .query(festivoQuery);

        if (festivoResult.recordset.length > 0) {
            const fechaFestivo = festivoResult.recordset[0].fecha;
            const motivoFestivo = festivoResult.recordset[0].motivo;

            try {
                if (!fechaFestivo) throw new Error("La fecha festiva es nula o no está definida.");

                console.log("📅 Fecha original desde la BD:", fechaFestivo);

                // Convertir la fecha a un objeto Date asegurando que no haya problemas de zona horaria
                const fechaLocal = new Date(fechaFestivo);

                if (isNaN(fechaLocal.getTime())) throw new Error("Fecha inválida después de conversión");

                console.log("✅ Fecha procesada correctamente:", fechaLocal);

                // Ajustar la fecha al huso horario local (opcional si sigue mostrando el día anterior)
                fechaLocal.setMinutes(fechaLocal.getMinutes() + fechaLocal.getTimezoneOffset());

                // Formatear la fecha en español sin cambiar la zona horaria
                const fechaFormateada = fechaLocal.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long"
                });

                return res.json({
                    estado: "false",
                    mensaje: `Horario no Disponible: Festivo ${fechaFormateada} - ${motivoFestivo}`
                });
            } catch (error) {
                console.error("❌ Error al procesar la fecha:", error.message);
                return res.status(500).json({ estado: "error", mensaje: "Error al procesar la fecha" });
            }
        }


        // 📌 Obtener el día de la semana
        const fechaObj = new Date(fechaHora);
        const diaSemana = fechaObj.getDay();

        // 📌 Verificar si el día tiene un estado activo
        const estadoDiaQuery = `
            SELECT estado 
            FROM horario 
            WHERE dia = @dia
        `;
        const estadoDiaResult = await pool.request()
            .input("dia", diaSemana)
            .query(estadoDiaQuery);

        if (estadoDiaResult.recordset.length === 0 || !estadoDiaResult.recordset[0].estado) {
            return res.json({
                estado: "false",
                mensaje: "Horario no disponible"
            });
        }

        // 📌 Obtener horario del día
        const horarioQuery = `
            SELECT 
                CONVERT(VARCHAR, inicia, 108) AS inicia, 
                CONVERT(VARCHAR, fin, 108) AS fin 
            FROM horario 
            WHERE dia = @dia
        `;
        const horarioResult = await pool.request()
            .input("dia", diaSemana)
            .query(horarioQuery);

        if (horarioResult.recordset.length === 0) {
            return res.json({
                estado: "false",
                mensaje: `Tickets fuera de horario. No hay horarios configurados para este día (${diaSemana}).`
            });
        }

        const inicia = horarioResult.recordset[0].inicia;
        const fin = horarioResult.recordset[0].fin;

        if (!inicia || !fin) {
            return res.json({
                estado: "false",
                mensaje: `Error al obtener horario para el día ${diaSemana}.`
            });
        }

        const horaRecibida = fechaHora.split("T")[1].split(".")[0];

        if (horaRecibida >= inicia && horaRecibida <= fin) {
            return res.json({ estado: "true", mensaje: "Tickets habilitado." });
        } else {
            const horaInicioAMPM = convertirAMPM(inicia);
            const horaFinAMPM = convertirAMPM(fin);
            return res.json({
                estado: "false",
                mensaje: `Fuera de Horario: ${horaInicioAMPM} a ${horaFinAMPM}`
            });
        }

    } catch (error) {
        console.error("Error en la verificación del horario:", error);
        res.status(500).json({ estado: "error", mensaje: "Ocurrió un error en el servidor." });
    }
};

// 📌 Función para convertir de 24h a 12h AM/PM
const convertirAMPM = (hora24) => {
    const [hora, minutos] = hora24.split(":");
    const horaNum = parseInt(hora);
    const periodo = horaNum >= 12 ? "PM" : "AM";
    const hora12 = horaNum % 12 || 12; // Convierte 0 a 12 para formato AM/PM
    return `${hora12}:${minutos} ${periodo}`;
};

module.exports = { horario };
