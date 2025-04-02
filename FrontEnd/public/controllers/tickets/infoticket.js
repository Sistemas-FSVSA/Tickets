document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('followform');
    const ticketInfoDiv = document.getElementById('ticket-info');
    const anotherTicketContainer = document.getElementById('another-ticket-container');
    const ticketInput = document.getElementById('ticket');
    const emailInput = document.getElementById('email');

    // Función para dar formato a la fecha en formato 12 horas (AM/PM) sin conversión de zona horaria
    function formatearFecha(fecha) {
        const dateObj = new Date(fecha); // Convertimos la fecha a un objeto Date

        const year = dateObj.getUTCFullYear(); // Obtenemos el año en formato UTC
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0'); // Mes en formato 2 dígitos (UTC)
        const day = String(dateObj.getUTCDate()).padStart(2, '0'); // Día en formato 2 dígitos (UTC)

        let hours = dateObj.getUTCHours(); // Usamos la hora en formato UTC
        const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0'); // Minutos en formato 2 dígitos (UTC)
        const isPM = hours >= 12; // Verificar si es PM o AM

        hours = hours % 12; // Convertir hora a formato 12 horas
        hours = hours ? String(hours).padStart(2, '0') : '12'; // Si la hora es 0 (medianoche), mostramos 12
        const period = isPM ? 'PM' : 'AM'; // Determinamos AM o PM

        // Retornamos la fecha en el formato deseado
        return `${year}-${month}-${day} ${hours}:${minutes} ${period}`;
    }

    // Validar que solo se permitan números en el input de ticket
    if (ticketInput) {
        ticketInput.addEventListener('keydown', function (e) {
            if (
                (e.key >= '0' && e.key <= '9') || // Números
                e.key === 'Backspace' ||         // Retroceso
                e.key === 'Tab' ||              // Tabulación
                e.key === 'ArrowLeft' ||        // Flecha izquierda
                e.key === 'ArrowRight' ||       // Flecha derecha
                e.key === 'Delete' ||           // Suprimir
                e.key === 'Enter'               // Enter
            ) {
                return; // Permitir estas teclas
            } else {
                e.preventDefault(); // Bloquear cualquier otra tecla
            }
        });
    }

    // Evento submit del formulario
    form.onsubmit = function (e) {
        e.preventDefault();
        const idticket = ticketInput.value.trim();
        const email = emailInput.value.trim();

        // Validar el correo
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            Swal.fire({
                title: 'Error',
                text: 'Por favor, ingresa un correo válido.',
                icon: 'error',
            });
            return;
        }

        // Realizar solicitud fetch
        fetch(`${url}/api/tickets/obtenerInfoTickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idticket, email }),
        })
            .then((response) => response.json())
            .then((result) => {
                if (result.estado === 'ok') {
                    form.querySelector('button[type="submit"]').style.display = 'none'; // Ocultar el botón de enviar
                    ticketInfoDiv.style.display = 'flex';
                    const fechaFormateada = formatearFecha(result.ticket.fechainicio);
                    ticketInfoDiv.innerHTML = `
                        <div class="col">
                            <p><strong>Correo:</strong> ${result.ticket.correo}</p>
                            <p><strong>Usuario:</strong> ${result.ticket.usuario}</p>
                            <p><strong>Dependencia:</strong> ${result.ticket.dependencia}</p>
                            <p><strong>Extensión:</strong> ${result.ticket.ext}</p>
                        </div>
                        <div class="col">
                            <p><strong>Estado:</strong> ${result.ticket.estado}</p>
                            <p><strong>Fecha de Inicio:</strong> ${fechaFormateada}</p>
                            <p><strong>Tema:</strong> ${result.ticket.tema}</p>
                            <p><strong>Detalle:</strong> ${result.ticket.detalle}</p>
                        </div>
                    `;
                    anotherTicketContainer.style.display = 'block'; // Mostrar botón de nuevo ticket
                    ticketInput.disabled = true; // Deshabilitar el input del ticket
                    emailInput.disabled = true; // Deshabilitar el input del correo
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: result.mensaje || 'No se encontró el ticket.',
                        icon: 'error',
                    });
                }
            })
            .catch((error) => {
                console.error('Error:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Hubo un error al procesar la solicitud.',
                    icon: 'error',
                });
            });
    };
        // Función para resetear el formulario
        function resetForm() {
            form.reset(); // Reiniciar los valores del formulario
    
            // Habilitar los campos
            ticketInput.disabled = false;
            emailInput.disabled = false;
    
            // Ocultar la información del ticket y el botón de "otro ticket"
            ticketInfoDiv.style.display = 'none';
            ticketInfoDiv.innerHTML = ''; // Limpiar el contenido
            anotherTicketContainer.style.display = 'none';
    
            // Mostrar nuevamente el botón de enviar
            form.querySelector('button[type="submit"]').style.display = 'block';
        }
    
        window.resetForm = resetForm;
    
        // Asignar la función resetForm al botón "Ingresar otro ticket"
        const resetButton = anotherTicketContainer.querySelector('button');
        if (resetButton) {
            resetButton.addEventListener('click', resetForm);
        }
});