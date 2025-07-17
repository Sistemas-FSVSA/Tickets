document.addEventListener('DOMContentLoaded', () => {
    InicializarConsultaTickets();
});

async function InicializarConsultaTickets() {
    await cargarSubtemas(); // Cargar subtemas al iniciar
    await cargarTickets();
}

async function cargarSubtemas() {
    try {
        const response = await fetch(`${url}/api/tickets/obtenerSubtemas`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const result = await response.json();
        if (result.estado === 'ok') {
            const selectSubtema = document.getElementById('subtema');
            selectSubtema.innerHTML = '<option value="">Seleccione un subtema</option>';
            result.subtemas.forEach(subtema => {
                const option = document.createElement('option');
                option.value = subtema.idsubtema;
                option.textContent = subtema.descripcion;
                selectSubtema.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar los subtemas:', error);
    }
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

function renderizarTickets(tickets) {
    const tbody = document.getElementById("tbodytickets");
    let html = "";
    for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        html += `
            <tr>
                <td>${ticket.idticket}</td>
                <td>${ticket.usuario}</td>
                <td>${ticket.nombreDependencia}</td>
                <td>${ticket.nombreTema}</td>
                <td>${ticket.nombreSubtema || 'No hay subtema asignado'}</td>
                <td class="truncar-texto" title="${ticket.detalle}">${ticket.detalle}</td>
                <td>
                    <button class="btn btn-fsvsaon ver-ticket" data-id="${ticket.idticket}">
                        <i class="far fa-eye mr-1"></i>Ver
                    </button>
                </td>
            </tr>
        `;
    }
    tbody.innerHTML = html;

    if ($.fn.dataTable.isDataTable('#tickets')) {
        $('#tickets').DataTable().clear().destroy();
    }

    $('#tickets').DataTable({
        autoWidth: false,
        scrollX: false,
        pageLength: 10,
        lengthMenu: 
        [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, "Todos"]
        ],
        deferRender: true,
        ordering: true,
        searching: true,
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.10.16/i18n/Spanish.json"
        },
        columnDefs: [ // Tamaños de las columnas
            { targets: 0, width: "6%" },   // ID
            { targets: 1, width: "12%" },  // Usuario
            { targets: 2, width: "15%" },  // Dependencia
            { targets: 3, width: "15%" },  // Tema
            { targets: 4, width: "17%" },  // Subtema
            { targets: 5, width: "25%" },  // Detalle
            { targets: 6, width: "10%" }   // Acción
        ]
    });
}

$(document).on('click', '.cerrar-modal', function () {
    $('#ticketModal').modal('hide');
});

$(document).off('click', '.ver-ticket').on('click', '.ver-ticket', function () {
    const ticketId = $(this).data('id');
    mostrarTicketInfo(ticketId);
});

function formatearFecha(fecha) {
    if (!fecha) return 'Sin registro';
    
    const date = new Date(fecha);
    
    // Ajuste manual: restar 5 horas (si viene en UTC y tú estás en UTC-5)
    date.setHours(date.getHours() + 5);

    return date.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}


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
                const ticket = result.ticket || {};
                const gestion = result.gestiones?.[0] || {};

                // 🔧 Cargar campos del ticket
                document.getElementById('idticket').value = ticket.idticket || '';
                document.getElementById('usuario').value = ticket.usuario || '';
                document.getElementById('correo').value = ticket.correo || '';
                document.getElementById('nombreDependencia').value = ticket.nombreDependencia || '';
                document.getElementById('ext').value = ticket.ext || '';
                document.getElementById('idtema').value = ticket.nombreTema || '';
                document.getElementById('subtema').value = ticket.nombreSubtema || '';
                document.getElementById('detalle').value = ticket.detalle || '';
                document.getElementById('estado').value = ticket.estado || '';
                document.getElementById('ipticket').value = ticket.ipticket || '';
                document.getElementById('notemail').value = ticket.notemail ? 'Sí' : 'No';

                // ✅ Limpiar y volver a asignar evento de fechas
                const fechasBtn = document.getElementById('toggleFechas');
                fechasBtn.replaceWith(fechasBtn.cloneNode(true)); // Clona para quitar eventos previos
                document.getElementById('toggleFechas').addEventListener('click', () => {
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
                        customClass: { popup: 'swal-wide' }
                    });
                });


                // ✅ Gestiones
                const gestionesBtn = document.getElementById('gestionesBtn');
                gestionesBtn.replaceWith(gestionesBtn.cloneNode(true));
                document.getElementById('gestionesBtn').addEventListener('click', () => {
                    Swal.fire({
                        title: 'Gestión del Ticket',
                        html: `
                        <p><strong>Fecha de gestión:</strong> ${formatearFecha(gestion.fechagestion)}</p>
                        <p><strong>Soporte:</strong> ${ticket.nombreTema} - ${ticket.nombreSubtema}</p>
                        <p><strong>Observación:</strong> ${gestion.observacion}</p>
                        <p><strong>Falsa Alarma:</strong> ${gestion.falsaalarma ? 'Sí' : 'No'}</p>
                    `,
                        icon: 'info',
                        confirmButtonText: 'Cerrar',
                        customClass: { popup: 'swal-wide' }
                    });
                });

                // ✅ Archivos adjuntos
                const adjuntosContainer = document.querySelector('.adjuntos-container');
                adjuntosContainer.innerHTML = '';
                if (Array.isArray(result.adjuntos) && result.adjuntos.length > 0) {
                    result.adjuntos.forEach(adjunto => {
                        const adjuntoUrl = `${url}/${adjunto.url}`;
                        if (adjunto.tipo === 'imagen') {
                            const img = document.createElement('img');
                            img.src = adjuntoUrl;
                            img.alt = 'Adjunto';
                            img.className = 'adjunto-imagen img-thumbnail';
                            img.style.cursor = 'pointer';
                            img.addEventListener('click', () => abrirImagenGrande(adjuntoUrl));
                            adjuntosContainer.appendChild(img);
                        } else {
                            const btn = document.createElement('button');
                            btn.textContent = adjunto.tipo === 'pdf' ? 'Abrir PDF' : `Descargar ${adjunto.tipo}`;
                            btn.className = 'btn btn-success';
                            btn.style.margin = '5px';
                            btn.addEventListener('click', () => window.open(adjuntoUrl, '_blank'));
                            adjuntosContainer.appendChild(btn);
                        }
                    });
                } else {
                    const p = document.createElement('p');
                    p.textContent = 'No hay archivos adjuntos.';
                    p.className = 'text-muted';
                    adjuntosContainer.appendChild(p);
                }

                const modal = new bootstrap.Modal(document.getElementById('ticketModal'));
                modal.show();
            }
        })
        .catch(error => console.error('Error al cargar la información del ticket:', error));
}


function abrirImagenGrande(url) {
    const modalContent = document.getElementById('imagenModalContent');
    modalContent.innerHTML = `<img src="${url}" class="img-fluid" alt="Adjunto Grande">`;
    const modal = new bootstrap.Modal(document.getElementById('imagenModal'));
    modal.show();
}

$(document).ready(function () {
    $("#imagenModal").off("click", ".close").on("click", ".close", function () {
        $("#imagenModal").modal("hide");
    });
});