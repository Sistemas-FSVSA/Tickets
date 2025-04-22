document.addEventListener('DOMContentLoaded', () => {
    InicializarMantenimiento();
});
async function InicializarMantenimiento() {
    await cargarMantenimiento();

    actualizarProgreso();
    setInterval(actualizarProgreso, 30000); // Refresca la barra cada 30 segundos
}

async function obtenerMantenimientos() {
    try {
        const response = await fetch(`${url}/api/mantenimientos/obtenerMantenimientos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error("Error al obtener mantenimientos");
        }

        return await response.json();
    } catch (error) {
        console.error("Error al obtener mantenimientos:", error);
        throw error; // Propaga el error para manejarlo en las funciones que la llamen
    }
}

// funcion para cargar la informacion del estado de mantenimiento de los equipos
async function cargarMantenimiento() {
    try {
        const result = await obtenerMantenimientos();
        Mantenimiento = result.mantenimiento;
        renderizarMantenimiento();
        actualizarProgreso(result.progreso); // Pasar el progreso directamente
    } catch (error) {
        console.error("Error al cargar mantenimiento:", error);
    }
}

// funcion para renderizar mantenimiento
function renderizarMantenimiento() {
    const tabla = $("#mantenimiento").DataTable();

    // 🔹 Guardar la página actual antes de actualizar
    let paginaActual = tabla.page();

    // 🔹 Limpiar la tabla sin destruirla
    tabla.clear();

    // 🔹 Agregar los nuevos datos
    Mantenimiento.forEach((mantenimiento) => {
        const snFormateado = mantenimiento.sn.toString().padStart(3, "0");

        let semaforoHTML = "";
        switch (mantenimiento.estadoSemaforo) {
            case "verde":
                semaforoHTML = `<i class="fas fa-circle text-success"></i>`;
                break;
            case "naranja":
                semaforoHTML = `<i class="fas fa-circle text-warning"></i>`;
                break;
            case "rojo":
                semaforoHTML = `<i class="fas fa-circle text-danger"></i>`;
                break;
            default:
                semaforoHTML = `<i class="fas fa-circle text-secondary"></i>`;
        }

        tabla.row.add([
            snFormateado,
            formatearFecha(mantenimiento.fechaactual).split(" ")[0],
            mantenimiento.nombreequipo,
            mantenimiento.nombre_dependencia,
            mantenimiento.observacion,
            formatearFecha(mantenimiento.fechaproximo).split(" ")[0],
            mantenimiento.nombre_responsable,
            semaforoHTML,
            `<button class="btn btn-primary" data-id="${mantenimiento.idinventario}">
                <i class="fas fa-file-medical-alt"></i>
            </button>`
        ]);
    });

    // 🔹 Dibujar la tabla con los nuevos datos y mantener la página actual
    tabla.draw(false);
    tabla.page(paginaActual).draw(false);
}

// 🔹 Inicializar la tabla si aún no lo está
$(document).ready(function () {
    $("#mantenimiento").DataTable({
        autoWidth: false,
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.10.16/i18n/Spanish.json"
        },
        order: [[5, "asc"]],
        pageLength: 10
    });

    // 🔹 Cargar inventario por primera vez
    cargarMantenimiento();
});

// funcion para la redireccion a hvc
$(document).off("click", ".btn.btn-primary").on("click", ".btn.btn-primary", async function (event) {
    event.preventDefault();

    const idinventario = $(this).data("id");
    if (!idinventario) return;

    const url = `hvc?idinventario=${idinventario}`;
    const prevUrl = window.location.pathname + window.location.search;

    try {
        const response = await fetch(url, { method: "GET", headers: { "X-Requested-With": "XMLHttpRequest" } });

        if (!response.ok) throw new Error("Error al cargar la vista");

        const html = await response.text();
        document.getElementById("contenido").innerHTML = html;

        window.history.pushState({ prevUrl: prevUrl }, "", url);
        reinitializeScripts();
    } catch (error) {
        console.error("Error en la navegación:", error);
    }
});

// 🔹 Manejo del botón "Atrás" en el historial del navegador
window.addEventListener("popstate", function (event) {
    const urlAnterior = event.state?.prevUrl || "/dashboard";
    cargarVista(urlAnterior);
});

// 🔹 Función para actualizar la barra de progreso
async function actualizarProgreso(progresoData = null) {
    try {
        // Si no se pasa progresoData, obtenerlo desde el servidor
        const progreso = progresoData || (await obtenerMantenimientos()).progreso;

        const progresoBarra = document.getElementById("progresoBarra");
        if (progresoBarra) {
            const progresoNumerico = parseInt(progreso.replace("%", ""), 10);
            progresoBarra.style.width = `${progresoNumerico}%`;
            progresoBarra.setAttribute("aria-valuenow", progresoNumerico);
            progresoBarra.textContent = `${progresoNumerico}%`;
        }
    } catch (error) {
        console.error("Error al actualizar la barra de progreso:", error);
    }
}

// funcion para abrir el modal
window.abrirModalMantenimiento = function () {
    const modalElement = document.getElementById("modalProgramarMantenimiento");

    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } else {
        console.error("❌ No se encontró el modal con ID 'modalProgramarMantenimiento'");
    }
};

// buscar el equipo por el serial
window.buscarPorSerial = async function () {
    const inputBusquedaSN = document.getElementById("serialInput");
    const sn = inputBusquedaSN.value.trim();

    if (sn.length >= 3) { // Evitar consultas innecesarias
        await buscarEquipo(sn);
    }
};


// 🔹 Buscar equipo por S/N en la API
async function buscarEquipo(sn) {
    const inputBusquedaSN = document.getElementById("serialInput"); // 🔹 Asegurar que se obtiene el input correctamente

    try {

        const response = await fetch(`${url}/api/mantenimientos/obtenerEquipoSN`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sn }),
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("Error en la consulta");
        }

        const data = await response.json();

        if (data) {
            actualizarTabla(data);
            inputBusquedaSN.value = ""; // 🔹 Limpiar el input después de buscar
        } else {
            console.log("No se encontró información para este SN.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// funcion para actuatlizar la tabla con los equipos que haya en el array
function actualizarTabla(equipo) {
    let tabla = $("#tablaResultados").DataTable();

    // 🔹 Verificar si el equipo ya está en la tabla
    let existe = tabla.rows().data().toArray().some(row => row[0] == equipo.sn);

    if (!existe) {
        tabla.row.add([
            equipo.sn,
            equipo.nombreequipo,
            equipo.nombre_dependencia,
            `<button class="btn btn-danger btn-sm eliminar-equipo" 
                data-idinventario="${equipo.idinventario}" 
                data-sn="${equipo.sn}">
                <i class="fas fa-trash"></i> Eliminar
            </button>`
        ]).draw();
    } else {
        console.warn("⚠️ El equipo ya está en la lista.");
    }
}

// inicializar la tabla del modal de programar mantenimiento
$(document).ready(function () {
    if (!$.fn.DataTable.isDataTable("#tablaResultados")) {
        $("#tablaResultados").DataTable({
            paging: false,
            searching: false,
            info: false,
            ordering: false,
            language: {
                url: "https://cdn.datatables.net/plug-ins/1.10.16/i18n/Spanish.json"
            },
            autoWidth: false
        });
    }
});

// 🔹 Agregar equipo al array y mostrar en la tabla
function agregarEquipo(idinventario, sn, nombreequipo, nombre_dependencia) {
    if (!EquiposSeleccionados.some(e => e.idinventario === idinventario)) {
        EquiposSeleccionados.push({ sn, nombreequipo, nombre_dependencia });
        actualizarTablaSeleccionados();
    }
}

// 🔹 Mostrar los equipos seleccionados en la tabla
function actualizarTablaSeleccionados() {
    let tabla = $("#tablaResultados").DataTable();
    tabla.clear().draw(); // Limpiar tabla antes de actualizar

    EquiposSeleccionados.forEach((equipo) => {
        tabla.row.add([
            equipo.sn,
            equipo.nombreequipo,
            equipo.nombre_dependencia,
            `<button class="btn btn-danger btn-sm eliminar-equipo" 
                data-idinventario="${equipo.idinventario}" 
                data-sn="${equipo.sn}">
                <i class="fas fa-trash"></i> Eliminar
            </button>`
        ]).draw();
    });
   
}

// Asignar eventos de eliminación a los botones
$(document).on("click", ".eliminar-equipo", function () {
    const sn = $(this).data("sn"); // Obtener el SN del equipo
    eliminarEquipoPorSN(sn); // Llamar a la función de eliminación
}); 

// 🔹 Eliminar equipo del array
function eliminarEquipoPorSN(sn) {
    let tabla = $("#tablaResultados").DataTable();

    // 🔹 Remover equipo de la tabla
    tabla.rows((idx, data) => data[0] == sn).remove().draw();

    // 🔹 Remover equipo del array EquiposSeleccionados
    EquiposSeleccionados = EquiposSeleccionados.filter(e => e.sn !== sn);
}

// boton para programar el mantenimiento
document.addEventListener("click", function (event) {
    if (event.target && event.target.id === "btnGuardarProgramacion") {
        programarMantenimiento();
    }
});

// funcion para programar el manteniemiento
async function programarMantenimiento() {
    const fechaProgramacion = document.getElementById("fechaProximoMantenimiento").value.trim();
    let idinventario = [];

    // 🔹 Capturar los idinventario de los botones
    document.querySelectorAll(".eliminar-equipo").forEach((button) => {
        const id = button.getAttribute("data-idinventario");
        if (id) {
            idinventario.push(parseInt(id));
        }
    });

    // 🔹 Validaciones
    if (!fechaProgramacion || idinventario.length === 0) {
        alert("Debe seleccionar una fecha y al menos un equipo.");
        return;
    }

    // 🔹 Enviar datos al backend
    try {
        const response = await fetch(`${url}/api/mantenimientos/programarMantenimientos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                fechaProgramacion,
                idinventario
            })
        });

        const result = await response.json();
        
        if (response.ok) {
            $("#tablaResultados").DataTable().clear().draw();
            await cargarMantenimiento();
            cerrarModalProgramacion();
            
            // ✅ Mostrar mensaje de éxito
            await Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Mantenimiento programado correctamente',
                showConfirmButton: true,
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#28a745',
                timer: 3000,
                timerProgressBar: true
            });
        } else {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.message || 'Ocurrió un error al programar el mantenimiento',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#d33'
            });
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión con el servidor.");
    }
}

function cerrarModalProgramacion() {
    $("#modalProgramarMantenimiento").modal("hide");
}