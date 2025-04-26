// Verificar si la variable ya existe antes de declararla
// Solo declarar las variables si no existen
if (typeof isUpdatingInventario === 'undefined') {
    var isUpdatingInventario = false;
}
if (typeof lastRow === 'undefined') {
    var lastRow = null;
}

// El resto de tu código actual permanece exactamente igual...
// (todas las funciones y event listeners que ya tienes)

// Obtener datos al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
    await obtenerDatosInventario();

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
    if (window._enterHandlersInventario) {
        window._enterHandlersInventario.forEach(handler => {
            document.removeEventListener('keydown', handler, true);
            document.removeEventListener('keydown', handler, false);
        });
    }
    window._enterHandlersInventario = [handleGlobalEnter];
});

// Función para obtener datos del servidor (Inventario)
async function obtenerDatosInventario() {
    try {
        const response = await fetch(`${url}/api/inventario/obtenerDatos`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            cache: 'no-store'
        });

        if (response.ok) {
            datosInventario = await response.json(); // Guardamos los datos en la variable global
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
    if (!table) return; // Evitar errores si la tabla no existe en la vista actual

    const tableBody = table.getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ''; // Limpiar el contenido previo

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
    configurarSwitchesInventario()
}

// Función para mostrar datos en el modal abierto
function mostrarDatosEnModal(modalId) {
    if (!datosInventario) {
        console.warn("⚠️ Los datos del inventario aún no han sido cargados.");
        return;
    }

    switch (modalId) {
        case "nuevaDependenciaModal":
            agregarDatosATabla('dependenciaTable', datosInventario.dependencia, 'nombre', 'estado', 'iddependencia');
            break;
        case "nuevaMarcaModal":
            agregarDatosATabla('marcaTable', datosInventario.marca, 'marca', 'estado', 'idmarca');
            break;
        case "nuevoFormatoModal":
            agregarDatosATabla('formatoTable', datosInventario.formato, 'formato', 'estado', 'idformato');
            break;
        case "nuevoActividadModal":
            agregarDatosATabla('actividadTable', datosInventario.actividad, 'nombre', 'estado', 'idactividad');
            break;
        case "nuevaRamModal":
            agregarDatosATabla('ramTable', datosInventario.ram, 'ram', 'estado', 'idram');
            break;
        case "nuevoAlmacenamientoModal":
            agregarDatosATabla('almacenamientoTable', datosInventario.almacenamiento, 'almacenamiento', 'estado', 'idalmacenamiento');
            break;
        default:
            console.warn(`⚠️ No hay datos configurados para el modal '${modalId}'`);
            break;
    }
}

// Evento para cargar datos en el modal sin hacer otra petición al servidor
$(document).on('shown.bs.modal', function (event) {
    const modalId = $(event.target).attr('id');

    // Lista de modales que este script debe manejar
    const modalesPermitidos = [
        "nuevaDependenciaModal",
        "nuevaMarcaModal",
        "nuevoFormatoModal",
        "nuevoActividadModal",
        "nuevaRamModal",
        "nuevoAlmacenamientoModal"
    ];

    if (modalesPermitidos.includes(modalId)) {
        mostrarDatosEnModal(modalId);
        // Configurar los switches después de cargar los datos
        configurarSwitchesInventario();
    }
});

$(document).on('click', '#abrirModalDependencia', function () {
    $('#nuevaDependenciaModal').modal('show');
});

$(document).on('click', '#abrirModalActividad', function () {
    $('#nuevoActividadModal').modal('show');
});

$(document).on('click', '#abrirModalRam', function () {
    $('#nuevaRamModal').modal('show');
});

$(document).on('click', '#abrirModalAlmacenamiento', function () {
    $('#nuevoAlmacenamientoModal').modal('show');
});

$(document).on('click', '#abrirModalFormato', function () {
    $('#nuevoFormatoModal').modal('show');
});

$(document).on('click', '#abrirModalMarca', function () {
    $('#nuevaMarcaModal').modal('show');
});

// Función para configurar los eventos de los switches (Inventario)
function configurarSwitchesInventario() {
    document.querySelectorAll('.switch-estado').forEach(switchElement => {
        switchElement.removeEventListener('change', handleEstadoChangeInventario);
        switchElement.addEventListener('change', handleEstadoChangeInventario);
    });
}

// Función principal para manejar el cambio de estado (Inventario)
async function handleEstadoChangeInventario(event) {
    if (isUpdatingInventario) return;
    isUpdatingInventario = true;

    const switchInput = event.target;
    if (!switchInput.classList.contains("switch-estado")) {
        isUpdatingInventario = false;
        return;
    }

    // Obtener datos del switch
    const id = parseInt(switchInput.getAttribute("data-id"));
    const tipo = switchInput.getAttribute("data-tipo");
    const nuevoEstado = switchInput.checked;
    
    // Validar tipo permitido
    const tiposPermitidos = [
        'dependencia', 'marca', 'formato', 
        'actividad', 'ram', 'almacenamiento'
    ];
    
    if (!tiposPermitidos.includes(tipo)) {
        console.error('Tipo no permitido:', tipo);
        switchInput.checked = !nuevoEstado;
        isUpdatingInventario = false;
        return;
    }

    try {
        // Confirmación con SweetAlert
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
            switchInput.checked = !nuevoEstado;
            isUpdatingInventario = false;
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
        const response = await fetch(`${url}/api/inventario/actualizarDatos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo: tipo,
                id: id,
                estado: nuevoEstado ? 1 : 0
            }),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        // Actualizar datos y mostrar éxito
        await obtenerDatosInventario();
        Swal.fire('¡Éxito!', 'Estado actualizado correctamente', 'success');

    } catch (error) {
        console.error('Error al actualizar estado:', error);
        switchInput.checked = !nuevoEstado;
        Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
    } finally {
        isUpdatingInventario = false;
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
            const response = await fetch(`${url}/api/inventario/guardarDatos`, {
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
            await obtenerDatosInventario();

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