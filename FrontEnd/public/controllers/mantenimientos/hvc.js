document.addEventListener('DOMContentLoaded', () => {
    InicializarHVC();
});
async function InicializarHVC() {
    cargarActualizarHVC();
    cargarActividades(); // Opcional, según necesites en esta vista.
    document.getElementById("abrirMantenimiento")?.addEventListener("click", abrirModal);
    document.getElementById("registrarMantenimiento")?.addEventListener("click", (e) => registrarMantenimientoModal(e));
}

async function cargarActualizarHVC(idInventario = null, esActualizacion = false) {
    // Obtener ID del inventario de la URL si no se proporcionó
    const id = idInventario || new URLSearchParams(window.location.search).get("idinventario");
    
    if (!id) {
        console.error("ID de inventario no proporcionado");
        return;
    }

    try {
        // Mostrar indicador de carga solo para actualizaciones
        if (esActualizacion) {
            const tablaBody = document.querySelector("#tbodymantenimientos");
            tablaBody.innerHTML = '<tr><td colspan="4" class="text-center py-3"><div class="spinner-border text-primary" role="status"></div></td></tr>';
        }

        // Obtener datos del servidor
        const response = await fetch(`${url}/api/mantenimientos/obtenerHVC`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idinventario: id }),
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error(esActualizacion 
                ? "Error al obtener mantenimientos" 
                : "Error al obtener datos del inventario");
        }

        const data = await response.json();
        
        if (esActualizacion) {
            // Solo actualizar la tabla de mantenimientos
            renderizarMantenimientos(data.mantenimientos || []);
        } else {
            // Carga completa del formulario HVC
            llenarFormularioHVC(data);
        }

    } catch (error) {
        console.error(`Error al ${esActualizacion ? 'actualizar' : 'cargar'} HVC:`, error);
        
        if (esActualizacion) {
            const tablaBody = document.querySelector("#tbodymantenimientos");
            tablaBody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-danger">Error al cargar los mantenimientos</td></tr>';
            inicializarDataTable([]);
        } else {
            // Podrías agregar aquí manejo de errores para la carga inicial
            // Por ejemplo: mostrar un mensaje al usuario
        }
    }
}

// funcion para llenar los campos de la hoja de vida del computo
function llenarFormularioHVC(data) {

    const equipo = data.equipo;

    // Función auxiliar para asignar valores solo si el elemento existe
    function asignarValor(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.value = valor || "";
        } else {
            console.warn(`Elemento con ID "${id}" no encontrado`);
        }
    }

    asignarValor("idInventario", equipo.idinventario);
    asignarValor("sn", equipo.sn);
    asignarValor("ip", equipo.ipequipo);
    asignarValor("mac", equipo.mac);
    asignarValor("datos", equipo.puertodatos);
    asignarValor("procesador", equipo.procesador);
    asignarValor("tiporam", equipo.nombre_tiporam);
    asignarValor("cantidadram", equipo.cantidadram);
    asignarValor("tipoalmacenamiento", equipo.nombre_tipoalmacenamiento);
    asignarValor("cantidadalmacenamiento", equipo.cantidadalmacenamiento);
    asignarValor("formatoEquipo", equipo.nombre_formato);
    asignarValor("marca", equipo.nombre_marca);
    asignarValor("so", equipo.so);
    asignarValor("nombreequipo", equipo.nombreequipo);
    asignarValor("dependencia", equipo.nombre_dependencia);
    asignarValor("responsable", equipo.responsable);
    asignarValor("usuario", equipo.nombreusuario);
    asignarValor("cargousuario", equipo.cargousuario);
    asignarValor("observaciones", equipo.observacion);

    // Renderiza mantenimientos
    renderizarMantenimientos(data.mantenimientos || [], true); 
}

// funcion para cargar actividades
async function cargarActividades() {
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

        // Guardar en la variable global
        actividadesCargadas = actividades;

    } catch (error) {
        console.error("Error al cargar actividades:", error);
    }
}

function renderizarActividades() {
    const selectActividad = document.getElementById("tipoMantenimiento");
    if (!selectActividad) return;

    selectActividad.innerHTML = '<option value="">Seleccione una actividad</option>';

    actividadesCargadas
        .filter(a => a.estado === true || a.estado === 1)  // <- Aquí el cambio
        .forEach(a => {
            const option = document.createElement("option");
            option.value = a.idactividad;
            option.textContent = a.nombre;
            selectActividad.appendChild(option);
        });
}

// funcion para renderizar los mantenimiento del equipo
function renderizarMantenimientos(mantenimientos, esPrimeraCarga = false) {
    // Verificar si hay mantenimientos
    if (!mantenimientos || mantenimientos.length === 0) {
        const tablaBody = document.querySelector("#tbodymantenimientos");
        tablaBody.innerHTML = '<tr><td colspan="4" class="text-center py-3">No hay mantenimientos registrados</td></tr>';
        
        if (esPrimeraCarga) {
            inicializarDataTable([]);
        }
        return;
    }

    // Procesar fechas para mostrar y ordenar
    const mantenimientosProcesados = mantenimientos.map(m => {
        if (!m.fechamantenimiento) {
            return {
                ...m,
                fechaOrdenable: 0,
                fechaMostrar: 'Fecha no disponible'
            };
        }

        // Parsear la fecha ISO del servidor (YYYY-MM-DD)
        const [year, month, day] = m.fechamantenimiento.split('T')[0].split('-');
        
        // Crear fecha en formato local (sin problemas de zona horaria)
        const fechaLocal = new Date(year, month - 1, day);
        
        // Formatear para mostrar (dd-mm-yyyy)
        const fechaMostrar = `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
        
        return {
            ...m,
            fechaOrdenable: fechaLocal.getTime(), // Timestamp para ordenar
            fechaMostrar: fechaMostrar // Formato dd-mm-yyyy para mostrar
        };
    });

    // Ordenar por fecha descendente (más reciente primero)
    mantenimientosProcesados.sort((a, b) => b.fechaOrdenable - a.fechaOrdenable);

    // Inicializar o actualizar DataTable
    if (esPrimeraCarga) {
        inicializarDataTable(mantenimientosProcesados);
    } else {
        const tabla = $("#tablaMantenimientos").DataTable();
        tabla.clear().rows.add(mantenimientosProcesados).draw();
        tabla.order([4, 'desc']).draw(); // Ordenar por columna oculta
    }
}

function inicializarDataTable(mantenimientos) {
    // Destruir instancia previa si existe
    if ($.fn.DataTable.isDataTable("#tablaMantenimientos")) {
        $("#tablaMantenimientos").DataTable().destroy();
    }

    // Configuración del DataTable
    const config = {
        language: { 
            url: "https://cdn.datatables.net/plug-ins/1.10.16/i18n/Spanish.json",
            paginate: {
                first: "Primera",
                last: "Última",
                next: "Siguiente",
                previous: "Anterior"
            }
        },
        order: [[4, "desc"]], // Ordenar por la columna oculta (timestamp)
        pageLength: 10,
        lengthMenu: [5, 10, 15, 20],
        autoWidth: false,
        dom: '<"top"lf>rt<"bottom"ip><"clear">',
        data: mantenimientos,
        columns: [
            { data: 'nombre_actividad', title: 'Actividad' },
            { 
                data: 'fechaMostrar', 
                title: 'Fecha',
                render: function(data) {
                    return data || 'Fecha no disponible';
                }
            },
            { data: 'observacion_hvc', title: 'Observaciones' },
            { data: 'nombre_responsable', title: 'Responsable' },
            {
                data: 'fechaOrdenable',
                visible: false,
                type: 'num'
            }
        ]
    };

    return $("#tablaMantenimientos").DataTable(config);
}

// Registrar mantenimiento usando datos del formulario del modal
async function registrarMantenimientoModal(e) {
    e.preventDefault();

    const idinventario = document.getElementById("idInventario").value;
    const observacion = document.getElementById("observacionesMantenimiento").value.trim();
    const idactividad = document.getElementById("tipoMantenimiento").value;
    const idusuario = parseInt(localStorage.getItem("idusuario") || "0");

    if (!idinventario || !idactividad || !observacion || !idusuario) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos incompletos',
            text: 'Por favor complete todos los campos requeridos.',
        });
        return;
    }

    const datos = {
        idinventario: parseInt(idinventario),
        observacion: observacion,
        idactividad: parseInt(idactividad),
        idusuario: idusuario,
    };

    try {
        const response = await fetch(`${url}/api/mantenimientos/guardarMantenimientos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos),
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al registrar mantenimiento");
        }

        // Cerrar el modal y limpiar el formulario
        $('#modalMantenimiento').modal('hide');
        document.getElementById("formMantenimiento").reset();

        // Mostrar notificación de éxito
        await Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Mantenimiento registrado correctamente',
            timer: 2000,
            showConfirmButton: false
        });

        // Actualizar la tabla de mantenimientos
        await cargarActualizarHVC(idinventario, true);

    } catch (error) {
        console.error("Error al registrar mantenimiento:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Hubo un problema al registrar el mantenimiento',
        });
    }
}

function limpiarEventosMantenimiento() {
    $('#tablaMantenimientos').off('click', '.editar-mantenimiento');
    // Limpia otros eventos relacionados con la vista de mantenimiento
}

// Función para volver a la vista principal de mantenimientos
function volverAMantenimientos() {
    limpiarEventosMantenimiento();
    // Opción 1: Usando el referer (puede no ser confiable en algunos casos)
    const referer = document.referrer;
    
    if (referer.includes('/mantenimientos/mantenimiento')) {
        window.location.href = '/mantenimientos/mantenimiento';
        return;
    }
    
    // Opción 2: Verificar parámetro en URL (más confiable)
    const urlParams = new URLSearchParams(window.location.search);
    const fromMaintenance = urlParams.get('fromMaintenance');
    
    if (fromMaintenance === 'true') {
        window.location.href = '/mantenimientos/mantenimiento';
    } else {
        // Fallback al dashboard si no se puede determinar el origen
        window.location.href = '/dashboard/dashboard';
    }
}

function abrirModal(e) {
    e.preventDefault();

    // ✅ Limpia el formulario antes de mostrar el modal
    document.getElementById("formMantenimiento").reset();

    cargarActividades().then(() => {
        renderizarActividades();
        $('#modalMantenimiento').modal('show'); // Bootstrap 4
    });
}