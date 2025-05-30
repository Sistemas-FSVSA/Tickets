document.addEventListener('DOMContentLoaded', () => {
    InicializarFestivos();
});

async function InicializarFestivos() {
    renderizarSelectAnios();

    // Cargar festivos del año seleccionado si existen en sessionStorage
    const anioSeleccionado = sessionStorage.getItem('anioSeleccionado');
    const festivosGuardados = JSON.parse(sessionStorage.getItem('festivosColombia')) || [];

    if (anioSeleccionado && festivosGuardados.length > 0) {
        mostrarFestivosColombia();
    }

    await cargarFestivos();
    configurarEventosFestivos();
}

async function cargarFestivos() {
    try {
        const response = await fetch(`${url}/api/configuraciones/obtenerFestivos`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const result = await response.json();
        const festivos = result.festivos || [];
        renderizarTablaFestivos(festivos);
    } catch (error) {
        $('#festivosTable tbody').html(`
            <tr>
                <td colspan="3" class="text-center text-danger">Error al cargar los festivos</td>
            </tr>
        `);
    }
}

function renderizarTablaFestivos(festivos) {
    const tabla = $("#festivosTable").DataTable();
    let paginaActual = tabla.page();
    tabla.clear();

    if (!festivos.length) {
        tabla.row.add([
            'No hay festivos registrados', '', ''
        ]).draw(false);

        // Unir las celdas y centrar el mensaje
        const row = $('#festivosTable tbody tr').last();
        row.find('td').eq(0).attr('colspan', 3).addClass('text-center');
        row.find('td:gt(0)').remove();
        return;
    }

    festivos.forEach(festivo => {
        // Formatea la fecha a YYYY-MM-DD
        let fechaFormateada = festivo.fecha;
        if (fechaFormateada && fechaFormateada.length >= 10) {
            fechaFormateada = fechaFormateada.substring(0, 10);
        }

        const botonEditar = `
        <button class="btn btn-warning btn-sm editar-festivo" data-fecha="${festivo.fecha}" data-motivo="${festivo.motivo}">
            <i class="fas fa-edit"></i> Editar
        </button>
    `;
        tabla.row.add([
            fechaFormateada,
            festivo.motivo,
            botonEditar
        ]);
    });

    tabla.draw(false);
    tabla.page(paginaActual).draw(false);
}

// Inicializar DataTable si aún no está inicializado
$(document).ready(function () {
    if (!$.fn.DataTable.isDataTable('#festivosTable')) {
        $("#festivosTable").DataTable({
            language: {
                url: "https://cdn.datatables.net/plug-ins/1.10.16/i18n/Spanish.json"
            },
            order: [[0, "asc"]],
            pageLength: 10
        });
    }
});

// Evento para abrir el modal de edición y llenar los campos
$("#festivosTable tbody").on("click", ".editar-festivo", function () {
    const fecha = $(this).data("fecha");
    const motivo = $(this).data("motivo");
    $("#editFestivoId").val(fecha); // Guarda la fecha original como id
    $("#editFestivoId").val(fecha.substring(0, 10)); // Solo YYYY-MM-DD
    $("#editMotivo").val(motivo);
    $("#modalEditarFestivo").modal("show");
});

// Evento para guardar los cambios del festivo
document.getElementById('guardarCambiosFestivo').addEventListener('click', async function (event) {
    event.preventDefault();
    let form = document.getElementById('formEditarFestivo');
    if (form.checkValidity() === false) {
        form.classList.add('was-validated');
        return;
    }

    const fechaOriginal = document.getElementById('editFestivoId').value;
    const nuevaFecha = document.getElementById('editFecha').value;
    const motivo = document.getElementById('editMotivo').value;

    try {
        const response = await fetch(`${url}/api/configuraciones/actualizarFestivo/${fechaOriginal}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ nuevaFecha, motivo })
        });
        const result = await response.json();

        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: 'Festivo actualizado',
                text: result.message || 'Los cambios se guardaron correctamente.',
                timer: 1500,
                showConfirmButton: false
            });
            $('#modalEditarFestivo').modal('hide');
            form.reset();
            form.classList.remove('was-validated');
            await cargarFestivos();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.message || 'No se pudo actualizar el festivo.'
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

// Limpia el formulario al cerrar el modal de edición
$('#modalEditarFestivo').on('hidden.bs.modal', function () {
    let form = document.getElementById('formEditarFestivo');
    form.reset();
    form.classList.remove('was-validated');
});

function renderizarSelectAnios(opciones = {}) {
    const {
        aniosPrevios = 0,
        aniosFuturos = 5,
        anioDefault = sessionStorage.getItem('anioSeleccionado') || new Date().getFullYear()
    } = opciones;

    const selectAnio = document.getElementById('selectAnioFestivos');
    const anioActual = new Date().getFullYear();
    const anios = [];

    for (let i = -aniosPrevios; i <= aniosFuturos; i++) {
        anios.push(anioActual + i);
    }

    selectAnio.innerHTML = '';

    anios.forEach(anio => {
        const option = document.createElement('option');
        option.value = anio;
        option.textContent = anio;
        if (anio == anioDefault) {
            option.selected = true;
        }
        selectAnio.appendChild(option);
    });

    // Guardar el año seleccionado cuando cambie
    selectAnio.addEventListener('change', function () {
        sessionStorage.setItem('anioSeleccionado', this.value);
    });
}

function configurarEventosFestivos() {
    // Botón para cargar festivos de Colombia
    document.getElementById('btnCargarFestivosCO').addEventListener('click', cargarFestivosColombia);

    // Botón para registrar festivos seleccionados
    document.getElementById('btnRegistrarFestivos').addEventListener('click', registrarFestivosSeleccionados);
}

async function cargarFestivosColombia() {
    try {
        const year = document.getElementById('selectAnioFestivos').value || new Date().getFullYear();
        const response = await fetch(`${url}/api/configuraciones/festivosColombia/${year}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            // Guarda los festivos en sessionStorage
            sessionStorage.setItem('festivosColombia', JSON.stringify(result.festivos));
            sessionStorage.setItem('anioSeleccionado', year);
            mostrarFestivosColombia();
        } else {
            throw new Error(result.message || 'Error al obtener festivos');
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message
        });
    }
}

function mostrarFestivosColombia() {
    const contenedor = document.getElementById('festivosColombiaContainer');
    contenedor.innerHTML = '';

    // Obtiene los festivos desde sessionStorage
    const festivos = JSON.parse(sessionStorage.getItem('festivosColombia')) || [];
    const anioSeleccionado = document.getElementById('selectAnioFestivos').value;

    // Guardar el año y festivos en sessionStorage
    sessionStorage.setItem('anioSeleccionado', anioSeleccionado);
    sessionStorage.setItem('festivosColombia', JSON.stringify(festivos));

    if (!festivos.length) {
        contenedor.innerHTML = '<p>No se encontraron festivos para este año</p>';
        document.getElementById('btnRegistrarFestivos').disabled = true;
        return;
    }

    const tabla = document.createElement('table');
    tabla.className = 'table table-striped table-hover';
    tabla.innerHTML = `
        <thead>
            <tr>
                <th><input type="checkbox" id="selectAllFestivos" checked></th>
                <th>Fecha</th>
                <th>Motivo</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = tabla.querySelector('tbody');

    festivos.forEach(festivo => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="festivo-check" data-fecha="${festivo.fecha}" data-motivo="${festivo.motivo}" checked></td>
            <td>${festivo.fecha}</td>
            <td>${festivo.motivo}</td>
        `;
        tbody.appendChild(tr);
    });

    contenedor.appendChild(tabla);
    document.getElementById('btnRegistrarFestivos').disabled = false;

    // Actualizar el estado del botón de registrar
    actualizarEstadoBotonRegistrar();

    // Guardar los checks seleccionados
    guardarChecksSeleccionados();

    // Configurar los eventos de la tabla
    configurarEventosTablaFestivos();
}

function configurarEventosTablaFestivos() {
    const selectAll = document.getElementById('selectAllFestivos');

    // Evento para seleccionar/deseleccionar todos
    selectAll.addEventListener('change', function () {
        const checks = document.querySelectorAll('.festivo-check');
        checks.forEach(check => check.checked = this.checked);
        actualizarEstadoBotonRegistrar();
        guardarChecksSeleccionados();
    });

    // Evento delegado para checkboxes individuales
    document.getElementById('festivosColombiaContainer').addEventListener('change', function (e) {
        if (e.target.classList.contains('festivo-check')) {
            actualizarSelectAllCheckbox();
            actualizarEstadoBotonRegistrar();
            guardarChecksSeleccionados();
        }
    });

    // Inicializar el estado del checkbox "Seleccionar todos"
    actualizarSelectAllCheckbox();
}

// Nueva función para actualizar el checkbox "Seleccionar todos"
function actualizarSelectAllCheckbox() {
    const checks = document.querySelectorAll('.festivo-check');
    const checkedChecks = document.querySelectorAll('.festivo-check:checked').length;
    const selectAll = document.getElementById('selectAllFestivos');

    if (checks.length === 0) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
    } else if (checkedChecks === checks.length) {
        selectAll.checked = true;
        selectAll.indeterminate = false;
    } else if (checkedChecks > 0) {
        selectAll.checked = false;
        selectAll.indeterminate = true;
    } else {
        selectAll.checked = false;
        selectAll.indeterminate = false;
    }
}

// Guarda los checks seleccionados en sessionStorage
function guardarChecksSeleccionados() {
    const checks = document.querySelectorAll('.festivo-check');
    const seleccionados = Array.from(checks)
        .filter(check => check.checked)
        .map(check => ({
            fecha: check.dataset.fecha,
            motivo: check.dataset.motivo
        }));

    // Solo guardar si hay selecciones, de lo contrario limpiar
    if (seleccionados.length > 0) {
        sessionStorage.setItem('festivosSeleccionados', JSON.stringify(seleccionados));
    } else {
        sessionStorage.removeItem('festivosSeleccionados');
    }
}

// Restaura los checks seleccionados desde sessionStorage
function restaurarChecksSeleccionados() {
    const seleccionados = JSON.parse(sessionStorage.getItem('festivosSeleccionados')) || [];
    const checks = document.querySelectorAll('.festivo-check');
    checks.forEach(check => {
        check.checked = seleccionados.some(sel => sel.fecha === check.dataset.fecha && sel.motivo === check.dataset.motivo);
    });
    actualizarEstadoBotonRegistrar();
}

function actualizarEstadoBotonRegistrar() {
    const checks = document.querySelectorAll('.festivo-check:checked');
    const btnRegistrar = document.getElementById('btnRegistrarFestivos');
    btnRegistrar.disabled = checks.length === 0;

    // Cambia el estilo visual del botón según el estado
    if (checks.length > 0) {
        btnRegistrar.classList.remove('btn-secondary');
        btnRegistrar.classList.add('btn-success');
    } else {
        btnRegistrar.classList.remove('btn-success');
        btnRegistrar.classList.add('btn-secondary');
    }
}

async function registrarFestivosSeleccionados() {
    try {
        // Obtener los festivos seleccionados desde sessionStorage
        const seleccionados = JSON.parse(sessionStorage.getItem('festivosSeleccionados')) || [];

        if (seleccionados.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Nada que registrar',
                text: 'Por favor selecciona al menos un festivo'
            });
            return;
        }

        // Registrar solo los festivos que están en sessionStorage
        const response = await fetch(`${url}/api/configuraciones/registrarFestivosColombia`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ festivos: seleccionados })
        });

        const result = await response.json();

        if (result.success) {
            let mensaje = `Se registraron ${result.data.insertados} nuevos festivos.`;

            if (result.data.existentes.length > 0) {
                mensaje += `<br><br>Las siguientes fechas ya estaban registradas:<br>`;
                mensaje += `<table border="1" style="width:100%; text-align:center;">`;

                result.data.existentes.forEach((fecha, index) => {
                    if (index % 3 === 0) mensaje += `<tr>`; // Inicia una nueva fila cada 3 elementos
                    mensaje += `<td>${fecha}</td>`;
                    if ((index + 1) % 3 === 0) mensaje += `</tr>`; // Cierra la fila cada 3 elementos
                });

                mensaje += `</table>`;
            }

            Swal.fire({
                icon: 'success',
                title: 'Proceso completado',
                html: mensaje,
                showConfirmButton: true,
                confirmButtonText: 'Entendido'
            });

            // Limpiar los seleccionados después de registrar
            sessionStorage.removeItem('festivosSeleccionados');

            // Actualizar la interfaz
            document.getElementById('selectAllFestivos').checked = false;
            document.querySelectorAll('.festivo-check').forEach(check => check.checked = false);
            actualizarEstadoBotonRegistrar();

            await cargarFestivos(); // Recargar la lista de festivos registrados
        } else {
            throw new Error(result.message || 'Error al registrar festivos');
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message
        });
    }
}