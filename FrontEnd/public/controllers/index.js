// --- Autenticación y Permisos ---
const url = window.env.API_URL;

document.addEventListener('DOMContentLoaded', async function () {
    await verificarHorario(); // Cargar horarios al iniciar
    setInterval(verificarHorario, 30000); // Verificar cada minuto
});

async function verificarHorario() {
    try {
        const ahora = new Date();

        // Convertir a la zona horaria local correctamente
        const fechaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);

        const response = await fetch(`${url}/api/index/horario`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fechaHora: fechaLocal.toISOString() }), // Enviar en ISO pero con la hora correcta
            credentials: "include",
        });

        const data = await response.json();

        if (data.estado === "false") {
            Mensaje ("warning", data.mensaje, false)
            deshabilitarBoton(data.mensaje);
            return;
        }

        if (data.estado === "true") {
            habilitarBoton();
        } else {
            deshabilitarBoton();
        }
    } catch (error) {
        console.error("Error en la verificación del horario:", error);
    }
}



function habilitarBoton() {
    const btn = document.getElementById('btnCrearTicket');
    btn.classList.remove('disabled');
    btn.removeAttribute('style'); // Eliminar estilos inline que lo deshabilitan

    // Redirigir al hacer clic cuando está habilitado
    btn.onclick = () => {
        window.location.href = "/nuevoticket"; // Redirige correctamente
    };
}

function deshabilitarBoton(mensaje) {
    const btn = document.getElementById('btnCrearTicket');
    btn.style.opacity = "0.5"; // Visualmente deshabilitado

    // Mostrar mensaje cuando el botón está deshabilitado
    btn.onclick = (e) => {
        e.preventDefault(); // Evita cualquier acción por defecto
        Mensaje("warning", mensaje, false); // Muestra el mensaje correcto
    };
}

function Mensaje(icono, mensaje, autoCerrar = true) {
    Swal.fire({
        icon: icono, // 'success', 'error', 'warning', 'info'
        text: mensaje,
        showConfirmButton: !autoCerrar, // Si autoCerrar es true, no muestra el botón
        timer: autoCerrar ? 3000 : null, // Si autoCerrar es true, cierra en 3 segundos
    });
}

