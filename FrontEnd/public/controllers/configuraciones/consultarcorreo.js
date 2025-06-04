document.addEventListener('DOMContentLoaded', () => {
    InicializarConsultarCorreo();
});

async function InicializarConsultarCorreo() {
    cargarConfiguracionesCorreo();

    document.getElementById("guardarCambiosCorreo").addEventListener("click", function (event) {
        let form = document.getElementById("formEditarCorreo");

        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        } else {
            guardarCambiosCorreo();
        }

        form.classList.add("was-validated");
    });

    // Detectar cuando el modal se cierra para limpiar el formulario
    $("#modalEditarCorreo").on("hidden.bs.modal", function () {
        limpiarModalCorreo();
    });
}

// Función para limpiar el modal
function limpiarModalCorreo() {
    let form = document.getElementById("formEditarCorreo");
    form.reset();
    form.classList.remove("was-validated");
}

async function cargarConfiguracionesCorreo() {
    try {
        const response = await fetch(`${url}/api/configuraciones/obtenerCorreo`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const data = await response.json();
        configuracionesCorreo = data.data || [];
        renderizarTablaCorreo();
    } catch (error) {
        $('#emailConfigTable tbody').html(`
            <tr>
                <td colspan="5" class="text-center text-danger">Error al cargar datos</td>
            </tr>
        `);
    }
}

function renderizarTablaCorreo(datos = configuracionesCorreo) {
    const tabla = $("#emailConfigTable").DataTable();

    // Guardar la página actual antes de actualizar
    let paginaActual = tabla.page();

    // Limpiar la tabla sin destruirla
    tabla.clear();

    if (!datos.length) {
        tabla.row.add([
            'No hay configuraciones de correo registradas', '', '', '', ''
        ]).draw(false);

        // Unir las celdas y centrar el mensaje
        const row = $('#emailConfigTable tbody tr').last();
        row.find('td').eq(0).attr('colspan', 5).addClass('text-center');
        row.find('td:gt(0)').remove();
        return;
    }

    datos.forEach(config => {
        let proveedor = config.proveedor.charAt(0).toUpperCase() + config.proveedor.slice(1).toLowerCase();
        const estado = config.estado ? 'Activo' : 'Inactivo';
        const estadoClass = config.estado ? 'text-success' : 'text-danger';
        const iconoEstado = config.estado
            ? '<i class="fas fa-check-circle"></i>'   // Icono para activo
            : '<i class="fas fa-times-circle"></i>';  // Icono para inactivo

        const botonEditar = `
            <button class="btn btn-warning btn-sm editar-correo" data-id="${config.idconfigemail}">
                <i class="fas fa-edit"></i> Editar
            </button>
        `;

        tabla.row.add([
            proveedor,
            config.correo,
            config.password, // <-- Mostrar la contraseña en texto plano
            `<span class="${estadoClass}">${iconoEstado} ${estado}</span>`,
            botonEditar
        ]);
    });

    // Dibujar la tabla con los nuevos datos y mantener la página actual
    tabla.draw(false);
    tabla.page(paginaActual).draw(false);
}

// Inicializar la tabla DataTable
$(document).ready(function () {
    $("#emailConfigTable").DataTable({
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.10.16/i18n/Spanish.json"
        },
        order: [[0, "asc"]],
        pageLength: 10,
        columnDefs: [
            { targets: [2], searchable: false } // Make password column not searchable
        ]
    });

    // Delegar eventos para los botones "Editar"
    $("#emailConfigTable tbody").on("click", ".editar-correo", function () {
        const idconfig = $(this).data("id");
        editarConfiguracionCorreo(idconfig);
    });

    // Evento para el filtro de estado
    $("#filtroEstadoCorreo").on("change", function () {
        filtrarPorEstado();
    });
});

// function filtrarPorEstado() {
//     const estado = $('#filtroEstadoCorreo').val();
//     let filtrados = configuracionesCorreo;

//     if (estado === 'activo') {
//         filtrados = configuracionesCorreo.filter(c => c.estado === true || c.estado === 1 || c.estado === '1');
//     } else if (estado === 'inactivo') {
//         filtrados = configuracionesCorreo.filter(c => c.estado === false || c.estado === 0 || c.estado === '0');
//     }
//     // Si es "todos", no filtra
//     renderizarTablaCorreo(filtrados);
// }

// // Evento para el select
// $('#filtroEstadoCorreo').on('change', filtrarPorEstado);

function editarConfiguracionCorreo(idconfig) {
    const config = configuracionesCorreo.find(c => c.idconfigemail == idconfig);
    if (!config) return;

    // Normaliza proveedor para el select
    let proveedor = config.proveedor;
    if (proveedor.toLowerCase() === 'gmail' || proveedor.toLowerCase() === 'google') proveedor = 'Gmail';
    if (proveedor.toLowerCase() === 'outlook') proveedor = 'Outlook';

    // Llenar los campos del modal
    $("#editCorreoId").val(config.idconfigemail);
    $("#editProveedor").val(proveedor);
    $("#editCorreo").val(config.correo);
    $("#editPassword").val(config.password);
    $("#editEstado").val(config.estado ? '1' : '0');

    // Mostrar el modal
    $("#modalEditarCorreo").modal("show");
}

async function guardarCambiosCorreo() {
    const data = {
        idconfigemail: $("#editCorreoId").val(),
        proveedor: $("#editProveedor").val(),
        correo: $("#editCorreo").val(),
        password: $("#editPassword").val(),
        estado: $("#editEstado").val()
    };

    try {
        const response = await fetch(`${url}/api/configuraciones/actualizarCorreo/${data.idconfigemail}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
            Swal.fire({
                icon: "success",
                title: "Configuración actualizada",
                text: "Los cambios se guardaron correctamente.",
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                $("#modalEditarCorreo").modal("hide");
                cargarConfiguracionesCorreo();
            });
        } else {
            throw new Error(result.message || "Error al actualizar la configuración");
        }
    } catch (error) {
        console.error("Error al guardar cambios:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo actualizar la configuración.",
            timer: 1500,
            showConfirmButton: false
        });
    }
}

document.getElementById('guardarRegistroCorreo').addEventListener('click', async function (event) {
    event.preventDefault();
    let form = document.getElementById('formRegistrarCorreo');

    if (form.checkValidity() === false) {
        form.classList.add('was-validated');
        return;
    }

    // Obtén los valores del formulario
    const proveedor = document.getElementById('nuevoProveedor').value;
    const correo = document.getElementById('nuevoCorreo').value;
    const password = document.getElementById('crearPassword').value;
    const estado = 1; // Siempre activo

    try {
        const response = await fetch(`${url}/api/configuraciones/registrarCorreo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ proveedor, correo, password, estado })
        });
        const result = await response.json();

        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: '¡Registrado!',
                text: result.message,
                timer: 1500,
                showConfirmButton: false
            });
            $('#modalRegistrarCorreo').modal('hide');
            form.reset();
            form.classList.remove('was-validated');
            cargarConfiguracionesCorreo();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.message || 'No se pudo registrar el correo.'
            });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error de red o del servidor.'
        });
    }
});

// Limpia el formulario al cerrar el modal de registro
$('#modalRegistrarCorreo').on('hidden.bs.modal', function () {
    let form = document.getElementById('formRegistrarCorreo');
    form.reset();
    form.classList.remove('was-validated');
});