document.addEventListener('DOMContentLoaded', () => {
    inicializarTickets();
});
async function inicializarTickets() {
    cargarTickets()
    setInterval(cargarTickets, 30000); 

    // Evento de click en el body
    document.body.addEventListener('click', (event) => {
        if (event.target.classList.contains('ticket-modal-btn')) {
            event.preventDefault(); // Evita que la URL cambie
            const ticketId = event.target.dataset.id;
            buscarTicketPorId(ticketId); // Llamar directamente a buscarTicketPorId
        }
    });

    document.getElementById('falsaAlarma').addEventListener('change', function () {
        const label = document.getElementById('switchLabel');
        if (this.checked) {
            label.textContent = 'Si'; // Estado activado
        } else {
            label.textContent = 'No'; // Estado desactivado
        }
    });

    document.getElementById("guardarGestion").addEventListener("click", function (event) {
        event.preventDefault(); // Evita que la URL cambie
        let form = document.getElementById("formGestionarTicket");

        if (form.checkValidity() === false) {
            event.stopPropagation();
        } else {
            gestionarTicket(); // Llama a la función sin enviar el formulario
        }

        form.classList.add("was-validated");
    });


    // Detectar cuando el modal se cierra para limpiar el formulario
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
        const ticketsAbiertos = result.tickets || [];

        mostrarTickets(ticketsAbiertos);
    } catch (error) {
        console.error('Error al cargar los tickets:', error);
    }
}

function mostrarTickets(tickets) {
    const bandeja = document.querySelector('.inbox-scroll');
    if (!bandeja) return;

    bandeja.innerHTML = ''; // Limpiar la bandeja

    if (tickets.length > 0) {
        tickets.forEach(ticket => {
            const ticketElement = crearTicketElemento(ticket);

            // Aplicar colores según el estado
            if (ticket.estado === "CREADO") {
                ticketElement.style.backgroundColor = "#e3f2fd"; // Azul claro (más llamativo)
            } else if (ticket.estado === "LEIDO") {
                ticketElement.style.backgroundColor = "#f5f5f5"; // Gris opaco
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
            method: 'POST', // Cambiar a POST
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ idticket, estado: "LEIDO" }),
        });
        const result = await response.json();
        mostrarTicketInfo(result); // Mostrar la información del ticket seleccionado

        // Refrescar la lista de tickets después de seleccionar uno
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
    const idusuario = sessionStorage.getItem('idusuario');

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
            // Llamar a la función buscarTicketPorId para obtener la información más reciente del ticket
            buscarTicketPorId(idticket); // Esto refrescará los detalles del ticket en la UI
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
        // Configurar el contenido de emailTitle
        emailTitle.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span>Ticket ID: ${result.ticket.idticket}</span>
                <span>
                    ${result.ticket.idusuario
                ? `<span class="text">Encargado: ${result.ticket.nombresUsuario} ${result.ticket.apellidosUsuario}</span>`
                : `<button type="button" id="asignarBtn" class="btn btn-primary btn-sm">Asignar</button>`}
                </span>
            </div>
        `;

        // Mostrar el ID del ticket en el modal
        if (idticketInput) {
            idticketInput.value = result.ticket.idticket;
        }

        // Contenido del cuerpo del ticket
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
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Extensión:</label>
                                <input type="text" class="form-control" value="${result.ticket.ext || 'N/A'}" readonly />
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Estado:</label>
                                <input type="text" class="form-control" value="${result.ticket.estado || 'N/A'}" readonly />
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Fecha de Inicio:</label>
                                <input type="text" class="form-control" value="${formatearFecha(result.ticket.fechainicio)}" readonly />
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Tema:</label>
                                <input type="text" class="form-control" value="${result.ticket.nombreTema || 'N/A'}" readonly />
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

        // Crear contenedor para los adjuntos
        const adjuntosContainer = document.createElement('div');
        adjuntosContainer.className = 'adjuntos-container mt-4';
        emailContent.appendChild(adjuntosContainer);

        // Mostrar los adjuntos
        if (Array.isArray(result.adjuntos)) {
            result.adjuntos.forEach((adjunto) => {
                const adjuntoUrl = `${url}/${adjunto.url}`;
                if (adjunto.tipo === 'imagen') {
                    const imgElement = document.createElement('img');
                    imgElement.src = adjuntoUrl;
                    imgElement.alt = 'Adjunto';
                    imgElement.className = 'adjunto-imagen img-thumbnail';
                    imgElement.style.cursor = 'pointer'; // Cambiar cursor para indicar que la imagen es clickeable

                    // Evento para abrir la imagen en un modal
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

        // Crear el contenedor del botón "Gestionar", pero solo mostrarlo si el ticket tiene un usuario asignado
        if (result.ticket.idusuario) {
            const gestionarBtnContainer = document.createElement('div');
            gestionarBtnContainer.className = 'ticket-gestionar-btn-container text-right';
            gestionarBtnContainer.innerHTML = `
                <button type="button" id="gestionarBtn" class="btn btn-primary">
                    Gestionar
                </button>
            `;
            emailContent.appendChild(gestionarBtnContainer);
        }

        // Agregar evento al botón "Asignar"
        const asignarBtn = document.getElementById('asignarBtn');
        if (asignarBtn) {
            asignarBtn.addEventListener('click', () => {
                asignarTicket(result.ticket.idticket);
            });
        }

        // Agregar evento al botón "Gestionar"
        const gestionarBtn = document.getElementById('gestionarBtn');
        if (gestionarBtn) {
            gestionarBtn.addEventListener('click', () => {
                // Mostrar el modal de gestión
                $('#gestionarModal').modal('show');
                cargarTiposSoporte();
            });
        }
    }
}

// Función para abrir la imagen en grande con un fondo oscuro y una X para cerrar
function abrirImagenGrande(imagenUrl) {
    // Crear el contenedor de la imagen con el fondo oscuro
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

    // Crear la imagen a tamaño grande
    const imgElement = document.createElement('img');
    imgElement.src = imagenUrl;
    imgElement.style.maxWidth = '90%';
    imgElement.style.maxHeight = '90%';
    imgElement.style.objectFit = 'contain';

    // Crear la X para cerrar
    const closeButton = document.createElement('div');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '20px';
    closeButton.style.fontSize = '40px';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontWeight = 'bold';

    // Agregar la imagen y la X al contenedor
    imageViewer.appendChild(imgElement);
    imageViewer.appendChild(closeButton);

    // Agregar el contenedor al cuerpo del documento
    document.body.appendChild(imageViewer);

    // Evento para cerrar la imagen cuando se hace clic en la X
    closeButton.addEventListener('click', () => {
        if (document.body.contains(imageViewer)) {
            document.body.removeChild(imageViewer);
        }
    });

    // También cerramos la imagen cuando se haga clic en cualquier parte del fondo oscuro
    imageViewer.addEventListener('click', () => {
        document.body.removeChild(imageViewer);
    });
}



function gestionarTicket() {
    if (enProceso) return; // Si ya está en proceso, salir
    enProceso = true; // Marcar como en ejecución

    const idticket = document.getElementById("idticket").value;
    const selectSoporte = document.getElementById("soporte").value;
    const observacion = document.getElementById("observacion").value.trim();
    const falsaAlarma = document.getElementById("falsaAlarma").checked;
    const snEquipo = document.getElementById("snEquipo").value.trim();

    const data = {
        idticket,
        idsoporte: selectSoporte,
        observacion,
        falsaalarma: falsaAlarma,
        SN: snEquipo
    };

    fetch(`${url}/api/tickets/gestionarTickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
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
            Swal.fire({
                title: "¡Error!",
                text: `Hubo un problema al gestionar el ticket: ${error.message}`,
                icon: "error",
                confirmButtonText: "Aceptar"
            });
        })
        .finally(() => {
            enProceso = false; // Resetear la variable al finalizar
        });
}

function limpiarModal() {
    // Obtener el formulario
    const form = document.getElementById("formGestionarTicket");
    if (form) {
        form.reset(); // Reiniciar todos los campos del formulario
        form.classList.remove("was-validated"); // Quitar las validaciones previas
    }
    const emailTitle = document.getElementById("emailTitle");
    if (emailTitle) emailTitle.innerHTML = `<span>No hay ticket seleccionado</span>`;
    const emailContent = document.getElementById("emailContent");
    if (emailContent) emailContent.innerHTML = `<p>Seleccione un ticket para ver su información.</p>`;
    $("#gestionarModal").modal("hide");
    cargarTickets();
}



function cargarTiposSoporte() {
    // Realiza la solicitud al servidor con credenciales
    fetch(`${url}/api/tickets/obtenerSoportes`, {
        method: 'GET',
        credentials: 'include', // Incluir credenciales para enviar cookies
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al cargar los tipos de soporte: ${response.status}`);
            }
            return response.json(); // Convertir la respuesta a JSON
        })
        .then(data => {
            const select = document.getElementById('soporte'); // Seleccionar el elemento del DOM
            const soportes = data.soportes || []; // Obtener el arreglo desde la clave "soportes"

            // Limpiar opciones existentes
            select.innerHTML = '';

            // Agregar la opción por defecto
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Otros';
            select.appendChild(defaultOption);

            // Agregar las opciones dinámicas
            soportes
                .filter(soporte => soporte.estado === true) // Solo incluir las opciones activas
                .sort((a, b) => a.nombre.localeCompare(b.nombre)) // Ordenar alfabéticamente por nombre
                .forEach(soporte => {
                    const option = document.createElement('option');
                    option.value = soporte.idsoporte; // Usar el idsoporte como valor
                    option.textContent = soporte.nombre;
                    select.appendChild(option);
                });
        })
        .catch(error => {
            console.error('Error al cargar los tipos de soporte:', error);
        });
}
