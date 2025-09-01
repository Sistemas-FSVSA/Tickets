document.addEventListener('DOMContentLoaded', () => {
    inicializarTickets();
});

async function inicializarTickets() {
    cargarTickets();
    setInterval(cargarTickets, 30000);

    // Evento de click en el body
    document.body.addEventListener('click', (event) => {
        if (event.target.classList.contains('ticket-modal-btn')) {
            event.preventDefault();
            const ticketId = event.target.dataset.id;
            buscarTicketPorId(ticketId);
        }
    });

    document.getElementById('falsaAlarma').addEventListener('change', function () {
        const label = document.getElementById('switchLabel');
        if (this.checked) {
            label.textContent = 'Si';
        } else {
            label.textContent = 'No';
        }
    });

    document.getElementById("guardarGestion").addEventListener("click", function (event) {
        event.preventDefault();
        let form = document.getElementById("formGestionarTicket");

        if (form.checkValidity() === false) {
            event.stopPropagation();
        } else {
            gestionarTicket();
        }

        form.classList.add("was-validated");
    });

    $("#modalEditarUsuario").on("hidden.bs.modal", function () {
        limpiarModal();
    });
}

async function cargarTickets() {
    try {
        const response = await fetch(`${url}/api/tickets/obtenerTickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ filtro: '!=', estado: 'CERRADO' })
        });

        const result = await response.json();
        let ticketsAbiertos = result.tickets || [];

        // Ordenar por idticket ascendente (menor idticket primero)
        ticketsAbiertos.sort((a, b) => a.idticket - b.idticket);

        mostrarTickets(ticketsAbiertos);
    } catch (error) {
        console.error('Error al cargar los tickets:', error);
    }
}

function mostrarTickets(tickets) {
    const bandeja = document.querySelector('.inbox-scroll');
    if (!bandeja) return;

    bandeja.innerHTML = '';

    if (tickets.length > 0) {
        tickets.forEach(ticket => {
            const ticketElement = crearTicketElemento(ticket);

            if (ticket.estado === "CREADO") {
                ticketElement.style.backgroundColor = "#e3f2fd";
            } else if (ticket.estado === "LEIDO") {
                ticketElement.style.backgroundColor = "#f5f5f5";
            }

            bandeja.appendChild(ticketElement);
        });
    } else {
        const mensaje = document.createElement('p');
        mensaje.className = 'text-center text-muted';
        mensaje.textContent = 'Sin tickets pendientes';
        bandeja.appendChild(mensaje);
    }
}

function crearTicketElemento(ticket) {
    const usuario = ticket.usuario || 'Usuario no encontrado';
    const tema = ticket.nombreTema || 'Tema no disponible';
    const detalle = ticket.detalle || 'Sin detalles';
    const hora = formatoHora(ticket.fechainicio);

    const ticketElement = document.createElement('a');
    ticketElement.href = '#';
    ticketElement.className = 'list-group-item list-group-item-action';
    ticketElement.dataset.id = ticket.idticket;
    ticketElement.innerHTML = `
        <div class="ticket-content">
            <div class="ticket-main">
                <small class="font-weight-bold text-ellipsis">${usuario}</small>
                <p class="mb-0 text-muted text-ellipsis">${tema}</p>
                <p class="mb-0 text-muted text-ellipsis">${detalle}</p>
            </div>
            <div class="ticket-side">
                <span class="ticket-id">#${ticket.idticket}</span>
                <small class="ticket-time">${hora}</small>
            </div>
        </div>
    `;
    ticketElement.addEventListener('click', () => buscarTicketPorId(ticket.idticket));
    return ticketElement;
}

async function buscarTicketPorId(idticket) {
    try {
        const response = await fetch(`${url}/api/tickets/obtenerTickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ idticket, estado: "LEIDO" }),
        });
        const result = await response.json();
        mostrarTicketInfo(result);
        await cargarTickets();
    } catch (error) {
        console.error('Error al buscar el ticket:', error);
        Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al cargar el ticket.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
        });
    }
}

function asignarTicket(idticket) {
    const idusuario = localStorage.getItem('idusuario');

    if (!idusuario) {
        return;
    }

    const data = {
        idticket: idticket,
        idusuario: idusuario,
    };

    fetch(`${url}/api/tickets/asignarTickets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
    })
        .then((result) => {
            buscarTicketPorId(idticket);
        })
        .catch((error) => {
            console.error("Error al asignar el ticket:", error);
        });
}

function mostrarTicketInfo(result) {
    const emailTitle = document.getElementById('emailTitle');
    const emailContent = document.getElementById('emailContent');
    const idticketInput = document.getElementById('idticket');

    if (emailTitle && emailContent) {
        emailTitle.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span>Ticket ID: ${result.ticket.idticket}</span>
                <span>
                    ${result.ticket.idusuario
                ? `<span class="text">Encargado: ${result.ticket.nombresUsuario} ${result.ticket.apellidosUsuario}</span>`
                : `<button type="button" id="asignarBtn" class="btn btn-fsvsaoff"><i class="fas fa-plus mr-1"></i>Asignar</button>`}
                </span>
            </div>
        `;

        if (idticketInput) {
            idticketInput.value = result.ticket.idticket;
        }

        emailContent.innerHTML = `
            <div class="card mt-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Correo:</label>
                                <input type="text" class="form-control" value="${result.ticket.correo || 'N/A'}" readonly />
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Dependencia:</label>
                                <input type="text" class="form-control" value="${result.ticket.nombreDependencia || 'N/A'}" readonly />
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="form-group">
                                <label>Extensión:</label>
                                <input type="text" class="form-control" value="${result.ticket.ext || 'N/A'}" readonly />
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group">
                                <label>Estado:</label>
                                <input type="text" class="form-control" value="${result.ticket.estado || 'N/A'}" readonly />
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group">
                                <label>Fecha de Inicio:</label>
                                <input type="text" class="form-control" value="${formatearFecha(result.ticket.fechainicio)}" readonly />
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Tema:</label>
                                <input type="text" class="form-control" value="${result.ticket.nombreTema || 'N/A'}" readonly />
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Subtema:</label>
                                <input type="text" class="form-control" value="${result.ticket.nombreSubtema || 'N/A'}" readonly />
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <div class="form-group">
                                <label>Detalle:</label>
                                <textarea class="form-control" rows="4" readonly>${result.ticket.detalle || 'N/A'}</textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const adjuntosContainer = document.createElement('div');
        adjuntosContainer.className = 'adjuntos-container mt-4';
        emailContent.appendChild(adjuntosContainer);

        if (Array.isArray(result.adjuntos)) {
            result.adjuntos.forEach((adjunto) => {
                const adjuntoUrl = `${url}/${adjunto.url}`;
                if (adjunto.tipo === 'imagen') {
                    const imgElement = document.createElement('img');
                    imgElement.src = adjuntoUrl;
                    imgElement.alt = 'Adjunto';
                    imgElement.className = 'adjunto-imagen img-thumbnail';
                    imgElement.style.cursor = 'pointer';
                    imgElement.addEventListener('click', () => abrirImagenGrande(adjuntoUrl));
                    adjuntosContainer.appendChild(imgElement);
                } else if (adjunto.tipo === 'pdf') {
                    const openButton = document.createElement('button');
                    openButton.innerHTML = '<i class="fas fa-paperclip mr-1"></i>Abrir PDF';
                    openButton.className = 'btn btn-fsvsaon adjunto-pdf';
                    openButton.style.margin = '5px';
                    openButton.addEventListener('click', () => window.open(adjuntoUrl, '_blank'));
                    adjuntosContainer.appendChild(openButton);
                } else {
                    const downloadButton = document.createElement('button');
                    downloadButton.innerHTML = `<i class="fas fa-download mr-1"></i>Descargar ${adjunto.tipo}`;
                    downloadButton.className = 'btn btn-fsvsaon adjunto-descarga';
                    downloadButton.style.margin = '5px';
                    downloadButton.addEventListener('click', () => window.open(adjuntoUrl, '_blank'));
                    adjuntosContainer.appendChild(downloadButton);
                }
            });
        } else {
            const noAdjuntos = document.createElement('p');
            noAdjuntos.textContent = 'No hay archivos adjuntos.';
            noAdjuntos.className = 'text-muted';
            adjuntosContainer.appendChild(noAdjuntos);
        }

        if (result.ticket.idusuario) {
            const gestionarBtnContainer = document.createElement('div');
            gestionarBtnContainer.className = 'ticket-gestionar-btn-container text-right';
            gestionarBtnContainer.innerHTML = `
                <button type="button" id="gestionarBtn" class="btn btn-fsvsaon"><i class="fas fa-cog mr-1"></i>Gestionar</button>`;
            emailContent.appendChild(gestionarBtnContainer);
        }

        const asignarBtn = document.getElementById('asignarBtn');
        if (asignarBtn) {
            asignarBtn.addEventListener('click', () => asignarTicket(result.ticket.idticket));
        }

        const gestionarBtn = document.getElementById('gestionarBtn');
        if (gestionarBtn) {
            gestionarBtn.addEventListener('click', () => {
                $('#gestionarModal').modal('show');

                const selectedTemaId = result.ticket.idtema;
                const selectedSubtemaId = result.ticket.idsubtema;

                // Establecer el ID del ticket directamente (ya se hace más arriba, pero por seguridad aquí también)
                document.getElementById('idticket').value = result.ticket.idticket;

                // Cargar temas y subtemas con el valor seleccionado
                cargarTiposSoporte(selectedTemaId, selectedSubtemaId);
            });

        }
    }
}

function abrirImagenGrande(imagenUrl) {
    const imageViewer = document.createElement('div');
    imageViewer.id = 'imageViewer';
    imageViewer.style.position = 'fixed';
    imageViewer.style.top = '0';
    imageViewer.style.left = '0';
    imageViewer.style.width = '100%';
    imageViewer.style.height = '100%';
    imageViewer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    imageViewer.style.display = 'flex';
    imageViewer.style.alignItems = 'center';
    imageViewer.style.justifyContent = 'center';
    imageViewer.style.zIndex = '9999';
    imageViewer.style.cursor = 'pointer';

    const imgElement = document.createElement('img');
    imgElement.src = imagenUrl;
    imgElement.style.maxWidth = '90%';
    imgElement.style.maxHeight = '90%';
    imgElement.style.objectFit = 'contain';

    const closeButton = document.createElement('div');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '20px';
    closeButton.style.fontSize = '40px';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontWeight = 'bold';

    imageViewer.appendChild(imgElement);
    imageViewer.appendChild(closeButton);

    document.body.appendChild(imageViewer);

    closeButton.addEventListener('click', () => {
        if (document.body.contains(imageViewer)) {
            document.body.removeChild(imageViewer);
        }
    });

    imageViewer.addEventListener('click', () => {
        document.body.removeChild(imageViewer);
    });
}

function gestionarTicket() {
    if (enProceso) return;
    enProceso = true;

    const idticket = document.getElementById("idticket")?.value || '';
    const selectSoporte = document.getElementById("soporte")?.value || '';
    const observacion = document.getElementById("observacion")?.value?.trim() || '';
    const falsaAlarma = document.getElementById("falsaAlarma")?.checked || false;
    const snEquipo = document.getElementById("snEquipo")?.value?.trim() || '';
    const idsubtema = document.getElementById("subtema")?.value || ''; // Agregar idsubtema

    console.log('Datos a enviar:', { idticket, idsoporte: selectSoporte, observacion, falsaalarma: falsaAlarma, SN: snEquipo, idsubtema });

    if (!idticket || !observacion || !idsubtema) {
        Swal.fire({
            title: 'Error',
            text: 'Faltan datos requeridos: idticket, observacion o subtema.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        enProceso = false;
        return;
    }

    const data = {
        idticket,
        idsoporte: selectSoporte,
        observacion,
        falsaalarma: falsaAlarma,
        SN: snEquipo,
        idsubtema
    };

    fetch(`${url}/api/tickets/gestionarTickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            return response.json();
        })
        .then(() => {
            Swal.fire({
                title: "¡Éxito!",
                text: "La gestión del ticket se ha realizado correctamente.",
                icon: "success",
                confirmButtonText: "Aceptar"
            }).then(() => {
                limpiarModal();
            });
        })
        .catch(error => {
            console.error('Error al gestionar el ticket:', error);
            Swal.fire({
                title: "¡Error!",
                text: `Hubo un problema al gestionar el ticket: ${error.message}`,
                icon: "error",
                confirmButtonText: "Aceptar"
            });
        })
        .finally(() => {
            enProceso = false;
        });
}

function limpiarModal() {
    const form = document.getElementById("formGestionarTicket");
    if (form) {
        form.reset();
        form.classList.remove("was-validated");
    }
    const emailTitle = document.getElementById("emailTitle");
    if (emailTitle) emailTitle.innerHTML = `<span>No hay ticket seleccionado</span>`;
    const emailContent = document.getElementById("emailContent");
    if (emailContent) emailContent.innerHTML = `<p>Seleccione un ticket para ver su información.</p>`;
    $("#gestionarModal").modal("hide");
    cargarTickets();
}

function cargarTiposSoporte(selectedTemaId, selectedSubtemaId) {
    const select = document.getElementById('tema');
    const selectSubtema = document.getElementById('subtema');
    select.innerHTML = '';
    if (selectSubtema) selectSubtema.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Seleccione una opción';
    select.appendChild(defaultOption);

    fetch(`${url}/api/tickets/obtenerTemas`, {
        method: 'GET',
        credentials: 'include',
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al cargar los tipos de soporte: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const temas = data.temas || [];
            temas
                .filter(tema => tema.estado === true)
                .sort((a, b) => a.nombre.localeCompare(b.nombre))
                .forEach(tema => {
                    const option = document.createElement('option');
                    option.value = tema.idtema;
                    option.textContent = tema.nombre;
                    if (tema.idtema == selectedTemaId) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
            if (selectedTemaId) {
                cargarSubtemas(selectedTemaId, selectedSubtemaId);
            }
        })
        .catch(error => {
            console.error('Error al cargar los tipos de soporte:', error);
        });

    select.onchange = function () {
        const idtema = this.value;
        cargarSubtemas(idtema, '');
    };
}

function cargarSubtemas(idtema, selectedSubtemaId = '') {
    const selectSubtema = document.getElementById('subtema');
    if (!selectSubtema) {
        console.warn('No existe el select con id "subtema"');
        return;
    }
    selectSubtema.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Seleccionar subtema';
    selectSubtema.appendChild(defaultOption);

    if (!idtema) {
        console.warn('No se envió idtema a cargarSubtemas');
        return;
    }

    console.log('Solicitando subtemas para idtema:', idtema);
    fetch(`${url}/api/tickets/obtenerSubtemas?idtema=${idtema}`)
        .then(response => response.json())
        .then(data => {
            console.log('Respuesta de subtemas:', data);
            const subtemas = data.subtemas || [];
            subtemas.forEach(subtema => {
                const option = document.createElement('option');
                option.value = subtema.idsubtema;
                option.textContent = subtema.descripcion;
                if (subtema.idsubtema == selectedSubtemaId) {
                    option.selected = true;
                }
                selectSubtema.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error al cargar los subtemas:', error);
        });
}