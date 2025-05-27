document.addEventListener('DOMContentLoaded', () => {
    InicializarConsultarCorreo();
});

async function InicializarConsultarCorreo() {
    // 1. Inicializar variables globales
    reiniciarEstadoCorreo();

    // 2. Cargar los datos iniciales
    await cargarConfiguracionesCorreo();

    // 3. Configurar eventos
    inicializarEventosCorreo();
}

// 1. Función para reiniciar el estado global
function reiniciarEstadoCorreo() {
    window.correoState = {
        configuraciones: [],
        filtroActual: 'todos',
        configuracionEditando: null
    };
}

// 2. Función para cargar los datos
async function cargarConfiguracionesCorreo() {
    const errorMessage = document.getElementById('errorMessage');
    const tableBody = document.getElementById('emailConfigTableBody');

    try {
        errorMessage.style.display = 'none';
        tableBody.innerHTML = '';

        const response = await fetch(`${url}/api/configuraciones/obtenerCorreo`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (data.data && data.data.length > 0) {
            window.correoState.configuraciones = data.data;
            renderizarConfiguracionesCorreo(data.data);
        } else {
            mostrarMensajeSinDatos();
        }
    } catch (error) {
        console.error('Error al cargar configuraciones:', error);
        mostrarErrorCorreo(error.message);
    }
}

// Función auxiliar para renderizar configuraciones
function renderizarConfiguracionesCorreo(configs) {
    const tableBody = document.getElementById('emailConfigTableBody');
    tableBody.innerHTML = '';

    // Aplicar filtro si existe
    const configsFiltradas = aplicarFiltroCorreo(configs);

    if (configsFiltradas.length === 0) {
        mostrarMensajeSinDatos();
        return;
    }

    configsFiltradas.forEach(config => {
        const row = document.createElement('tr');

        const provider = config.proveedor.charAt(0).toUpperCase() +
            config.proveedor.slice(1).toLowerCase();

        const statusClass = config.estado ? 'status-active' : 'status-inactive';
        const statusText = config.estado ? 'Activo' : 'Inactivo';

        row.innerHTML = `
            <td>${provider}</td>
            <td>${config.correo}</td>
            <td>${config.password}</td>
            <td class="${statusClass}">
                <i class="fas ${config.estado ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                ${statusText}
            </td>
            <td>
                <button class="btn btn-sm btn-primary action-btn edit-btn" 
                        data-id="${config.idconfigemail}">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// 3. Función para inicializar eventos
function inicializarEventosCorreo() {
    // Evento para el botón de refrescar
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        await cargarConfiguracionesCorreo();
    });

    // Evento para el filtro de estado (si tienes uno)
    $(document).on('change', '#filtroEstadoCorreo', function () {
        const estadoSeleccionado = $(this).val();
        window.correoState.filtroActual = estadoSeleccionado;
        renderizarConfiguracionesCorreo(window.correoState.configuraciones);
    });

    // Eventos para botones de editar (para implementación futura)
    $(document).on('click', '.edit-btn', function () {
        const configId = $(this).data('id');
        const config = window.correoState.configuraciones.find(c => c.idconfigemail == configId);
        if (!config) return;

        // Limpiar validaciones previas y resetear el formulario
        $('#formEditarCorreo')[0].reset();
        $('#formEditarCorreo .is-invalid').removeClass('is-invalid');

        // Rellenar los campos del modal
        $('#editCorreoId').val(config.idconfigemail);

        // Normalizar proveedor para el select
        let proveedor = config.proveedor;
        if (proveedor.toLowerCase() === 'gmail' || proveedor.toLowerCase() === 'google') proveedor = 'Gmail';
        if (proveedor.toLowerCase() === 'outlook') proveedor = 'Outlook';
        $('#editProveedor').val(proveedor);

        $('#editCorreo').val(config.correo);
        $('#editPassword').val(config.password);
        $('#editEstado').val(config.estado ? '1' : '0');

        $('#modalEditarCorreo').modal('show');
    });
}

// Funciones auxiliares
function aplicarFiltroCorreo(configs) {
    if (window.correoState.filtroActual === 'todos') {
        return configs;
    }
    if (window.correoState.filtroActual === 'activo') {
        return configs.filter(config => config.estado === true || config.estado === 1 || config.estado === '1');
    }
    if (window.correoState.filtroActual === 'inactivo') {
        return configs.filter(config => config.estado === false || config.estado === 0 || config.estado === '0');
    }
    return configs;
}

function mostrarMensajeSinDatos() {
    const tableBody = document.getElementById('emailConfigTableBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center">No hay configuraciones de correo registradas</td>
        </tr>
    `;
}

function mostrarErrorCorreo(mensaje) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = `Error al cargar configuraciones: ${mensaje}`;
    errorMessage.style.display = 'block';

    const tableBody = document.getElementById('emailConfigTableBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center text-danger">Error al cargar datos</td>
        </tr>
    `;
}

$('#formEditarCorreo').on('submit', async function (e) {
    e.preventDefault();

    let valido = true;

    // Validar proveedor
    const proveedor = $('#editProveedor').val();
    if (proveedor !== 'Gmail' && proveedor !== 'Outlook') {
        $('#editProveedor').addClass('is-invalid');
        valido = false;
    } else {
        $('#editProveedor').removeClass('is-invalid');
    }

    // Validar correo
    const correo = $('#editCorreo').val();
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoRegex.test(correo)) {
        $('#editCorreo').addClass('is-invalid');
        valido = false;
    } else {
        $('#editCorreo').removeClass('is-invalid');
    }

    if (!valido) return;

    const id = $('#editCorreoId').val();
    const password = $('#editPassword').val();
    const estado = $('#editEstado').val();

    try {
        const response = await fetch(`${url}/api/configuraciones/actualizarCorreo/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ proveedor, correo, password, estado })
        });
        const data = await response.json();
        if (data.success) {
            $('#modalEditarCorreo').modal('hide');
            await cargarConfiguracionesCorreo();
            Swal.fire({
                icon: 'success',
                title: '¡Actualizado!',
                text: 'La configuración se actualizó correctamente.',
                timer: 1800,
                showConfirmButton: false
            });
        } else {
            alert(data.message || 'Error al actualizar');
        }
    } catch (err) {
        alert('Error al actualizar');
    }
});