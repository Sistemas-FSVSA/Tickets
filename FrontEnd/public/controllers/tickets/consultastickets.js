document.addEventListener('DOMContentLoaded', () => {
    InicializarConsultaTickets();
});
async function InicializarConsultaTickets() {
    await cargarTickets();
}

async function cargarTickets() {
    try {
        const response = await fetch(`${url}/api/tickets/obtenerTickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ filtro: '=', estado: 'CERRADO' })
        });

        const result = await response.json();
        const ticketsCerrados = result.tickets || [];

        if (ticketsCerrados.length > 0) {
            renderizarTickets(ticketsCerrados);
        }
    } catch (error) {
        console.error('Error al cargar los tickets:', error);
    }
}


// Renderizar tickets en la tabla
function renderizarTickets(tickets) {
    const tbody = document.getElementById("tbodytickets");

    // Limpiar el contenido actual
    tbody.innerHTML = "";

    // Recorrer los tickets y agregarlos a la tabla
    tickets.forEach(ticket => {
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${ticket.idticket}</td>
            <td>${ticket.usuario}</td>
            <td>${ticket.nombreDependencia}</td>
            <td>${ticket.nombreTema}</td>
            <td>${ticket.detalle}</td>
            <td>
                <button class="btn btn-info btn-sm ver-ticket" data-id="${ticket.idticket}">
                    <i class="fas fa-eye"></i> Ver
                </button>
            </td>
        `;

        tbody.appendChild(fila);
    });

    // Inicializar DataTable
    if ($.fn.dataTable.isDataTable('#tickets')) {
        $('#tickets').DataTable().clear().destroy();
    }

    $('#tickets').DataTable({
        destroy: true,  // Esto permite que se reemplace la instancia anterior
        "language": {
            "url": "https://cdn.datatables.net/plug-ins/1.10.16/i18n/Spanish.json"
        },
        pageLength: 10
    });
}



$(document).on('click', '.cerrar-modal', function () {
    $('#ticketModal').modal('hide');   // Cierra el modal
});

// Capturar el clic en el botón "Ver" para abrir el modal
$(document).off('click', '.ver-ticket').on('click', '.ver-ticket', function () {
    const ticketId = $(this).data('id');
    mostrarTicketInfo(ticketId);
});


// Muestra los ticket en el modal
function mostrarTicketInfo(idticket) {
    const bodyData = {
        idticket: idticket,
        estado: 'CERRADO'
    };

    fetch(`${url}/api/tickets/obtenerTickets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(bodyData)
    })
        .then(response => response.json())
        .then(result => {
            if (result) {
                const ticket = result.ticket;
                const gestiones = result.gestiones;

                // Rellenar los campos del formulario
                document.getElementById('idticket').value = ticket.idticket;
                document.getElementById('usuario').value = ticket.usuario;
                document.getElementById('correo').value = ticket.correo;
                document.getElementById('nombreDependencia').value = ticket.nombreDependencia;
                document.getElementById('ext').value = ticket.ext;
                document.getElementById('idtema').value = ticket.nombreTema;
                document.getElementById('detalle').value = ticket.detalle;
                document.getElementById('estado').value = ticket.estado;
                document.getElementById('ipticket').value = ticket.ipticket;
                document.getElementById('notemail').value = ticket.notemail ? 'Sí' : 'No';

                document.getElementById('toggleFechas').addEventListener('click', function () {

                    // Mostrar la información de las fechas en un alert de SweetAlert2
                    Swal.fire({
                        title: 'Fechas del Ticket',
                        html: `
                            <p><strong>Fecha de inicio:</strong> ${formatearFecha(ticket.fechainicio)}</p>
                            <p><strong>Fecha de cierre:</strong> ${formatearFecha(ticket.fechacierre)}</p>
                            <p><strong>Fecha de lectura:</strong> ${formatearFecha(ticket.fechaleido)}</p>
                            <p><strong>Fecha asignada:</strong> ${formatearFecha(ticket.fechaasignado)}</p>
                        `,
                        icon: 'info',
                        confirmButtonText: 'Cerrar',
                        customClass: {
                            popup: 'swal-wide'
                        }
                    });
                });

                document.getElementById('gestionesBtn').addEventListener('click', function () {
                    // Verificar que el array de gestiones no esté vacío
                    const gestion = gestiones[0];  // Acceder al primer elemento del array
                    // Mostrar la información de la primera gestión en un SweetAlert2
                    Swal.fire({
                        title: 'Gestion del Ticket',
                        html: `
                                <p><strong>Fecha de gestión:</strong> ${formatearFecha(gestion.fechagestion)}</p>
                                <p><strong>Soporte:</strong> ${gestion.idsoporte}</p>
                                <p><strong>Observación:</strong> ${gestion.observacion}</p>
                                <p><strong>Falsa Alarma:</strong> ${gestion.falsaalarma ? 'Sí' : 'No'}</p>
                            `,
                        icon: 'info',
                        confirmButtonText: 'Cerrar',
                        customClass: {
                            popup: 'swal-wide'
                        }
                    });
                });

                const adjuntosContainer = document.querySelector('.adjuntos-container');
                adjuntosContainer.innerHTML = ''; // Limpiar contenido anterior

                // Crear una sección para los archivos adjuntos
                if (Array.isArray(result.adjuntos) && result.adjuntos.length > 0) {
                    result.adjuntos.forEach((adjunto) => {
                        const adjuntoUrl = `${url}/${adjunto.url}`;
                        if (adjunto.tipo === 'imagen') {
                            const imgElement = document.createElement('img');
                            imgElement.src = adjuntoUrl;
                            imgElement.alt = 'Adjunto';
                            imgElement.className = 'adjunto-imagen img-thumbnail';
                            imgElement.style.cursor = 'pointer';

                            // Evento para abrir la imagen en un modal grande
                            imgElement.addEventListener('click', () => {
                                abrirImagenGrande(adjuntoUrl);
                            });

                            adjuntosContainer.appendChild(imgElement);
                        } else if (adjunto.tipo === 'pdf') {
                            const openButton = document.createElement('button');
                            openButton.textContent = 'Abrir PDF';
                            openButton.className = 'btn btn-success adjunto-pdf';
                            openButton.style.margin = '5px';
                            openButton.addEventListener('click', () => {
                                window.open(adjuntoUrl, '_blank');
                            });
                            adjuntosContainer.appendChild(openButton);
                        } else {
                            const downloadButton = document.createElement('button');
                            downloadButton.textContent = `Descargar ${adjunto.tipo}`;
                            downloadButton.className = 'btn btn-success adjunto-descarga';
                            downloadButton.style.margin = '5px';
                            downloadButton.addEventListener('click', () => {
                                window.open(adjuntoUrl, '_blank');
                            });
                            adjuntosContainer.appendChild(downloadButton);
                        }
                    });
                } else {
                    const noAdjuntos = document.createElement('p');
                    noAdjuntos.textContent = 'No hay archivos adjuntos.';
                    noAdjuntos.className = 'text-muted';
                    adjuntosContainer.appendChild(noAdjuntos);
                }

                // Mostrar el modal
                const modal = new bootstrap.Modal(document.getElementById('ticketModal'));
                modal.show();
            }
        })
        .catch(error => {
            console.error('Error al cargar la información del ticket:', error);
        });
}

// Función para abrir la imagen en un modal grande
function abrirImagenGrande(url) {
    const modalContent = document.getElementById('imagenModalContent');
    modalContent.innerHTML = `<img src="${url}" class="img-fluid" alt="Adjunto Grande">`;
    const modal = new bootstrap.Modal(document.getElementById('imagenModal'));
    modal.show();
}

$(document).ready(function () {
    // Detectar clic en el botón "X" dentro del modal
    $("#imagenModal").off("click", ".close").on("click", ".close", function () {
        $("#imagenModal").modal("hide");
    });    
});
