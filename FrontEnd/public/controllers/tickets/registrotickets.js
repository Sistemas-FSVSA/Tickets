// Verificar si la variable ya existe antes de declararla
// Con var no hay Temporal Dead Zone
if (typeof isUpdating === 'undefined') {
    var isUpdating = false;
}

if (typeof lastRow === 'undefined') {
    var lastRow = null;
}

// Obtener datos al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
    await obtenerDatosTickets();

    // 1. Prevención total de submits en formularios de modales
    $(document).on('submit', '.modal form', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
    });
    
    // 2. Control absoluto del evento Enter - VERSIÓN MEJORADA
    const handleGlobalEnter = function(e) {
        // Actuar en cualquier input dentro de modales
        if (e.key === 'Enter' && e.target.matches('.modal input')) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Bloquear completamente cualquier acción posterior
            setTimeout(() => {
                if (e.defaultPrevented) return;
                e.preventDefault();
            }, 0);
            
            return false;
        }
    };
    
    // Registrar el event listener con captura en fase de burbuja también
    document.addEventListener('keydown', handleGlobalEnter, true); // Captura
    document.addEventListener('keydown', handleGlobalEnter, false); // Burbuja
    
    // Limpieza de handlers anteriores
    if (window._enterHandlers) {
        window._enterHandlers.forEach(handler => {
            document.removeEventListener('keydown', handler, true);
            document.removeEventListener('keydown', handler, false);
        });
    }
    window._enterHandlers = [handleGlobalEnter];
});

// Función para obtener datos del servidor (Tickets)
async function obtenerDatosTickets() {
    try {
        const response = await fetch(`${url}/api/tickets/obtenerDatos`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (response.ok) {
            datosTickets = await response.json(); // Guardamos los datos en la variable global
        } else {
            console.error("❌ Error al obtener los datos del inventario");
            alert("Error al obtener los datos");
        }
    } catch (error) {
        console.error("❌ Error de conexión con el servidor:", error);
        alert("Error de conexión con el servidor");
    }
}

// Función para agregar datos a una tabla específica
function agregarDatosATabla(tablaId, datos, claveNombre, claveEstado, claveId) {
    const table = document.getElementById(tablaId);
    if (!table) return;

    const tableBody = table.getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';

    datos.forEach(item => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = item[claveNombre];

        const estadoCell = row.insertCell(1);
        const tipo = tablaId.replace('Table', '').toLowerCase();
        estadoCell.innerHTML = `
            <div class="custom-control custom-switch">
                <input type="checkbox" class="custom-control-input switch-estado" 
                    id="switch-${tipo}-${item[claveId]}" 
                    ${item[claveEstado] ? "checked" : ""} 
                    data-id="${item[claveId]}"
                    data-tipo="${tipo}">
                <label class="custom-control-label" for="switch-${tipo}-${item[claveId]}"></label>
            </div>
        `;

        lastRow = row; // Guardamos la referencia de la última fila
    });

    // Hacer scroll hacia la última fila insertada
    if (lastRow) {
        setTimeout(() => {
            lastRow.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 200);
    }

    // Configurar los eventos para los nuevos switches
    configurarSwitches();
}

// Actualizar el evento shown.bs.modal para configurar los switches
$(document).on('shown.bs.modal', function (event) {
    const modalId = $(event.target).attr('id');
    const modalesPermitidos = [
        "nuevaDependenciaModal",
        "nuevoSoporteModal",
        "nuevoTemasModal"
    ];

    if (modalesPermitidos.includes(modalId)) {
        mostrarDatosEnModal(modalId);
        // Configurar los switches después de cargar los datos
        configurarSwitches();
    }
});

// Función para mostrar datos en el modal abierto
function mostrarDatosEnModal(modalId) {
    if (!datosTickets) {
        console.warn("⚠️ Los datos del inventario aún no han sido cargados.");
        return;
    }

    switch (modalId) {
        case "nuevaDependenciaModal":
            agregarDatosATabla('dependenciaTable', datosTickets.dependencias, 'nombre', 'estado', 'iddependencia');
            break;
        case "nuevoSoporteModal":
            agregarDatosATabla('soporteTable', datosTickets.soporte, 'nombre', 'estado', 'idsoporte');
            break;
        case "nuevoTemasModal":
            agregarDatosATabla('temasTable', datosTickets.temas, 'nombre', 'estado', 'idtema');
            break;
    }
}

// Función para configurar los eventos de los switches
function configurarSwitches() {
    document.querySelectorAll('.switch-estado').forEach(switchElement => {
        switchElement.removeEventListener('change', handleEstadoChange);
        switchElement.addEventListener('change', handleEstadoChange);
    });
}

// Función principal para manejar el cambio de estado
async function handleEstadoChange(event) {
    if (isUpdating) return;
    isUpdating = true;

    const switchInput = event.target;
    if (!switchInput.classList.contains("switch-estado")) {
        isUpdating = false;
        return;
    }

    // Obtener datos del switch
    const id = parseInt(switchInput.getAttribute("data-id"));
    const tipo = switchInput.getAttribute("data-tipo");
    const nuevoEstado = switchInput.checked; // Usamos el nuevo estado directamente

    // Validar tipo permitido
    const tiposPermitidos = ['dependencia', 'soporte', 'temas'];
    if (!tiposPermitidos.includes(tipo)) {
        console.error('Tipo no permitido:', tipo);
        switchInput.checked = !nuevoEstado; // Revertir el cambio
        isUpdating = false;
        return;
    }

    try {
        // Confirmación con SweetAlert (usamos el nuevo estado directamente)
        const confirmacion = await Swal.fire({
            title: '¿Confirmar cambio?',
            text: `¿Deseas ${nuevoEstado ? 'activar' : 'desactivar'} este ${tipo}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, cambiar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) {
            switchInput.checked = !nuevoEstado; // Revertir si cancela
            isUpdating = false;
            return;
        }

        // Mostrar loader durante la actualización
        Swal.fire({
            title: 'Actualizando...',
            html: 'Por favor espera',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        // Enviar solicitud al backend
        const response = await fetch(`${url}/api/tickets/actualizarDatos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo: tipo,
                id: id,
                estado: nuevoEstado ? 1 : 0 // Convertir a 1/0 para SQL
            }),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        // Actualizar datos y mostrar éxito
        await obtenerDatosTickets();
        Swal.fire('¡Éxito!', 'Estado actualizado correctamente', 'success');

    } catch (error) {
        console.error('Error al actualizar estado:', error);
        switchInput.checked = !nuevoEstado; // Revertir en caso de error
        Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
    } finally {
        isUpdating = false;
    }
}

// Función para registrar un nuevo dato
async function registrarEvento() {
    const tipo = this.getAttribute("data-tipo");
    const form = $(this).closest('form')[0];
    const input = form ? form.querySelector(`input[id="${tipo}"]`) : null;

    if (input && input.value.trim() !== "") {
        const data = {
            tipo: tipo,
            valor: input.value.trim()
        };

        try {
            const response = await fetch(`${url}/api/tickets/guardarDatos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include"
            });

            if (!response.ok) {
                console.error("❌ Error en la solicitud. Estado HTTP:", response.status);
                Swal.fire("Error", `No se pudo registrar el dato. Código: ${response.status}`, "error");
                return;
            }

            Swal.fire({
                title: "¡Éxito!",
                text: "Registro exitoso",
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });

            input.value = "";

            // Obtener los datos actualizados
            await obtenerDatosTickets();

            // Mostrar los datos en el modal abierto
            const modalAbierto = document.querySelector('.modal.show');
            if (modalAbierto) {
                mostrarDatosEnModal(modalAbierto.id);
            }

        } catch (error) {
            console.error("❌ Error en la solicitud:", error);
            Swal.fire("Error", "Ocurrió un problema al conectar con el servidor.", "error");
        }
    } else {
        Swal.fire("Atención", "Debe ingresar un nombre válido antes de registrar.", "warning");
    }
}

// Asignar eventos a los botones de registro
document.querySelectorAll("[id^=registrar]").forEach((button) => {
    button.removeEventListener("click", registrarEvento);
    button.addEventListener("click", registrarEvento);
});