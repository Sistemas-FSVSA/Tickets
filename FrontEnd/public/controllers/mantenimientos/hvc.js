
document.addEventListener('DOMContentLoaded', () => {
    InicializarHVC();
});
async function InicializarHVC() {
    const idInventario = new URLSearchParams(window.location.search).get("idinventario");
    if (!idInventario) return alert("ID de inventario no proporcionado");
    cargarHVC(idInventario)
    document.getElementById("abrirMantenimiento")?.addEventListener("click", abrirModal);
    document.getElementById("registrarMantenimiento")?.addEventListener("click", (e) => registrarMantenimiento(e, idInventario));
}

async function cargarHVC(id) {
    try {
        const res = await fetch(`${url}/api/mantenimientos/obtenerHVC`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idinventario: id }),
            credentials: "include",
        });

        const data = await res.json();
        if (!res.ok) throw new Error("Error al cargar datos del equipo");

        llenarFormulario(data.equipo);
        renderizarMantenimientos(data.mantenimientos || []);
    } catch (err) {
        console.error(err);
        mostrarErrorTabla();
    }
}

// funcion para llenar los campos de la hoja de vida del computo
function llenarFormulario(equipo) {
    const campos = {
        sn: "sn",
        ip: "ipequipo",  // Nuevo: para coincidir con el HTML
        mac: "mac",
        datos: "puertodatos",  // Cambiado para coincidir con HTML
        procesador: "procesador",
        tiporam: "nombre_tiporam",
        cantidadram: "cantidadram",
        tipoalmacenamiento: "nombre_tipoalmacenamiento",
        cantidadalmacenamiento: "cantidadalmacenamiento",
        formatoEquipo: "nombre_formato",  // Cambiado para coincidir con HTML
        marca: "nombre_marca",
        so: "so",
        nombreequipo: "nombreequipo",
        dependencia: "nombre_dependencia",
        responsable: "responsable",
        usuario: "nombreusuario",  // Cambiado para coincidir con HTML
        cargousuario: "cargousuario",
        observaciones: "observacion"
    };

    document.getElementById("idInventario").value = equipo.idinventario;

    Object.keys(campos).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = equipo[campos[id]] || "";
    });
}

// funcion para cargar actividades
async function cargarActividades(actividadesCargadas) {
    if (actividadesCargadas.length > 0) {
        return;
    }

    try {
        const response = await fetch(`${url}/api/mantenimientos/obtenerActividades`, {
            credentials: "include"
        });
        if (!response.ok) throw new Error("Error al obtener actividades");

        const data = await response.json();
        const actividades = data.actividad;

        if (!Array.isArray(actividades)) {
            console.error("Error: La respuesta no es un array", actividades);
            return;
        }

        // Guardar en la variable local
        actividadesCargadas.push(...actividades);

    } catch (error) {
        console.error("Error al cargar actividades:", error);
    }
}

function renderizarActividades(actividadesCargadas) {
    const selectActividad = document.getElementById("tipoMantenimiento");
    if (!selectActividad) return;

    selectActividad.innerHTML = '<option value="">Seleccione una actividad</option>';

    actividadesCargadas
        .filter(a => a.estado === true || a.estado === 1)
        .forEach(a => {
            const option = document.createElement("option");
            option.value = a.idactividad;
            option.textContent = a.nombre;
            selectActividad.appendChild(option);
        });
}

// funcion para renderizar los mantenimiento del equipo
function renderizarMantenimientos(lista) {
    const tbody = document.getElementById("tbodymantenimientos");
    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay mantenimientos registrados</td></tr>';
        inicializarDataTable([]);
        return;
    }

    const datos = lista.map(m => {
        const fecha = m.fechamantenimiento?.split("T")[0]?.split("-") || [];
        const fechaMostrar = fecha.length === 3 ? `${fecha[2]}-${fecha[1]}-${fecha[0]}` : "No disponible";
        return { ...m, fechaMostrar, fechaOrdenable: new Date(...fecha).getTime() || 0 };
    }).sort((a, b) => b.fechaOrdenable - a.fechaOrdenable);

    inicializarDataTable(datos);
}

function inicializarDataTable(data) {
    if ($.fn.DataTable.isDataTable("#tablaMantenimientos")) {
        $("#tablaMantenimientos").DataTable().clear().rows.add(data).draw();
        return;
    }

    $("#tablaMantenimientos").DataTable({
        language: { url: "https://cdn.datatables.net/plug-ins/1.10.16/i18n/Spanish.json" },
        data,
        columns: [
            { data: 'nombre_actividad', title: 'Actividad' },
            { data: 'fechaMostrar', title: 'Fecha' },
            { data: 'observacion_hvc', title: 'Observaciones' },
            { data: 'nombre_responsable', title: 'Responsable' },
            { data: 'fechaOrdenable', visible: false }
        ],
        order: [[4, 'desc']],
        pageLength: 10
    });
}

// Registrar mantenimiento usando datos del formulario del modal
async function registrarMantenimiento(e, idInventario) {
    e.preventDefault();

    const datos = {
        idinventario: parseInt(idInventario),
        observacion: document.getElementById("observacionesMantenimiento").value.trim(),
        idactividad: parseInt(document.getElementById("tipoMantenimiento").value),
        idusuario: parseInt(localStorage.getItem("idusuario") || "0")
    };

    if (!datos.observacion || !datos.idactividad || !datos.idusuario) {
        return Swal.fire({ icon: 'warning', title: 'Complete todos los campos' });
    }

    try {
        const res = await fetch(`${url}/api/mantenimientos/guardarMantenimientos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos),
            credentials: "include",
        });

        if (!res.ok) throw new Error("Error al registrar mantenimiento");

        $('#modalMantenimiento').modal('hide');
        document.getElementById("formMantenimiento").reset();

        await Swal.fire({ icon: 'success', title: 'Registrado con éxito', timer: 1500, showConfirmButton: false });

        cargarHVC(idInventario);
    } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Error al registrar', text: err.message });
    }
}

function limpiarEventosMantenimiento() {
    $('#tablaMantenimientos').off('click', '.editar-mantenimiento');
    // Limpia otros eventos relacionados con la vista de mantenimiento
}

async function abrirModal() {
    document.getElementById("formMantenimiento").reset();
    try {
        const res = await fetch(`${url}/api/mantenimientos/obtenerActividades`, { credentials: "include" });
        const data = await res.json();

        const select = document.getElementById("tipoMantenimiento");
        select.innerHTML = '<option value="">Seleccione una actividad</option>';
        (data.actividad || []).forEach(act => {
            if (act.estado) {
                select.innerHTML += `<option value="${act.idactividad}">${act.nombre}</option>`;
            }
        });

        $('#modalMantenimiento').modal('show');
    } catch (err) {
        console.error("Error al cargar actividades", err);
    }
}

document.getElementById("volver")?.addEventListener("click", async () => {
    try {
        const response = await fetch("mantenimiento", { method: "GET", headers: { "X-Requested-With": "XMLHttpRequest" } });

        if (!response.ok) throw new Error("Error al cargar la vista de mantenimiento");

        const html = await response.text();
        document.getElementById("contenido").innerHTML = html;

        // Actualizar la URL en el historial del navegador
        window.history.pushState({}, "", "mantenimiento");

        reinitializeScripts(); // Reinicializar scripts específicos de la vista de mantenimiento
    } catch (error) {
        console.error("Error al volver a la vista de mantenimiento:", error);
    }
});

function formatearFechaHora(fechaISO) {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO);
    fecha.setHours(fecha.getHours() + 5);
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    let horas = fecha.getHours();
    const min = String(fecha.getMinutes()).padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12;
    horas = horas ? horas : 12; // el 0 debe ser 12
    const hh = String(horas).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min} ${ampm}`;
}

document.getElementById('verTickets').addEventListener('click', async () => {
    const sn = document.getElementById('sn').value; // O toma el SN de donde corresponda

    try {
        const response = await fetch(`${url}/api/mantenimientos/obtenerTickets/${sn}`, {
            method: 'GET',
            credentials: 'include'
        });
        const data = await response.json();

        if (response.status === 404) {
            Swal.fire('Sin tickets', data.message || 'No hay tickets para este equipo', 'info');
            return;
        }

        // Construir el HTML de las cartas
        let html = `
        <div class="row mb-3">
            <div class="col">
                <input type="text" id="filtroTickets" class="form-control" placeholder="Filtrar tickets...">
            </div>
            <div class="col">
                <input type="date" id="filtroFechaTickets" class="form-control" placeholder="Filtrar por fecha">
            </div>
        </div>
        <div id="contenedorCartasTickets">
        `;

        data.tickets.forEach(ticket => {
            html += `
        <div class="card mb-3 ticket-carta">
            <div class="card-header">
                Ticket #${ticket.idticket} - Estado: ${ticket.estado}
            </div>
            <div class="card-body">
                <p><strong>Detalle:</strong> ${ticket.detalle}</p>
                <p><strong>Observación:</strong> ${ticket.observacion || 'Sin observación'}</p>
                <p><strong>Falsa alarma:</strong> ${ticket.falsaalarma ? 'Sí' : 'No'}</p>
                <p><strong>Fecha gestión:</strong> ${formatearFechaHora(ticket.fechagestion)}</p>
                <p><strong>Usuario:</strong> ${ticket.usuario}</p>
                <p><strong>Fecha inicio:</strong> ${formatearFechaHora(ticket.fechainicio)}</p>
                <p><strong>Fecha cierre:</strong> ${formatearFechaHora(ticket.fechacierre)}</p>
            </div>
        </div>
            `;
        });
        html += `</div>`;

        // Muestra el modal con el contenido
        Swal.fire({
            title: `Tickets del equipo`,
            html: `<div style="max-height:400px;overflow:auto">${html}</div>`,
            width: 700,
            showCloseButton: true,
            showConfirmButton: false
        });

        // Espera a que el DOM del modal esté listo
        setTimeout(() => {
            const inputTexto = document.getElementById('filtroTickets');
            const inputFecha = document.getElementById('filtroFechaTickets');
            const cartas = document.querySelectorAll('.ticket-carta');

            function filtrarCartas() {
                const filtro = inputTexto.value.toLowerCase();
                const fechaFiltro = inputFecha.value; // formato: 'YYYY-MM-DD'

                cartas.forEach(carta => {
                    const texto = carta.textContent.toLowerCase();
                    // Busca la fecha en el texto de la carta (ajusta según tu formato)
                    const fechaEnCarta = (carta.querySelector('.card-body p strong')?.nextSibling?.textContent || '').trim();
                    // O mejor: busca la fecha en el campo correspondiente
                    const fechaGestion = carta.querySelector('p:nth-child(4)')?.textContent.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';

                    const coincideTexto = texto.includes(filtro);
                    const coincideFecha = !fechaFiltro || fechaGestion === fechaFiltro;

                    carta.style.display = (coincideTexto && coincideFecha) ? '' : 'none';
                });
            }

            inputTexto?.addEventListener('input', filtrarCartas);
            inputFecha?.addEventListener('input', filtrarCartas);
        }, 100);

    } catch (error) {
        Swal.fire('Error', 'No se pudieron obtener los tickets', 'error');
        console.error(error);
    }
});