document.addEventListener('DOMContentLoaded', () => {
    inicializarConsultarBodega();
});

async function inicializarConsultarBodega() {
    await cargarTablaUnificada();

    // Asigna el evento al botón
    document.getElementById("btnRegistrarItem").addEventListener("click", abrirModalRegistrarItem);

    $("#tablaBitacora tbody").on("click", ".editar-movimiento", function () {
        const id = $(this).data("id");
        editarMovimiento(id);
    });
}

async function cargarTablaUnificada() {
    try {
        // Llama a ambos endpoints
        const [respMov, respItems] = await Promise.all([
            fetch(`${url}/api/bodega/obtenerBodega`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            }),
            fetch(`${url}/api/bodega/obtenerItems`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            })
        ]);

        const dataMov = await respMov.json();
        const dataItems = await respItems.json();

        const movimientos = dataMov.bodega || [];
        const items = dataItems.items || [];

        // Crea un mapa de movimientos por iditem (puedes usar el último movimiento si hay varios)
        const movPorItem = {};
        // Recorre de último a primero para que el más reciente sobrescriba
        for (let i = movimientos.length - 1; i >= 0; i--) {
            const mov = movimientos[i];
            movPorItem[mov.iditem] = mov;
        }

        // Fusiona los datos para la tabla
        const datosTabla = items.map(item => {
            const mov = movPorItem[item.iditem];
            return {
                iditem: item.iditem,
                item: item.item,
                tipomovimiento: mov ? mov.tipomovimiento : '',
                cantidad: mov ? mov.cantidad : '',
                valor_anterior: mov ? mov.valor_anterior : '',
                valor_nuevo: mov ? mov.valor_nuevo : item.cantidad,
                responsable: mov ? `${mov.responsable_nombres} ${mov.responsable_apellidos}` : '',
                fecha: mov ? mov.fecha : '',
                idbitacora: mov ? mov.idbitacora : '',
            };
        });

        renderizarTablaUnificada(datosTabla);

    } catch (error) {
        $('#tablaBitacora tbody').html(`
            <tr>
                <td colspan="9" class="text-center text-danger">Error al cargar datos</td>
            </tr>
        `);
    }
};

$("#tablaBitacora tbody").on("click", ".registrar-entrada", function () {
    const iditem = $(this).data("id");
    abrirModalMovimiento('entrada', iditem);
});
$("#tablaBitacora tbody").on("click", ".registrar-salida", function () {
    const iditem = $(this).data("id");
    abrirModalMovimiento('salida', iditem);
});

function renderizarTablaUnificada(datos) {
    const tabla = $("#tablaBitacora").DataTable();
    let paginaActual = tabla.page();
    tabla.clear();

    if (!datos.length) {
        tabla.row.add([
            'No hay items registrados', '', '', '', '', '', '', '', ''
        ]).draw(false);
        const row = $('#tablaBitacora tbody tr').last();
        row.find('td').eq(0).attr('colspan', 9).addClass('text-center');
        row.find('td:gt(0)').remove();
        return;
    }

    datos.forEach(item => {
        const botonMovimiento = `
            <button class="btn btn-fsvsaoff registrar-movimiento" data-id="${item.iditem}">
                <i class="fas fa-plus mr-1"></i> Movimiento
            </button>
        `;
        tabla.row.add([
            item.iditem,
            item.item,
            item.tipomovimiento,
            item.cantidad,
            item.valor_anterior,
            item.valor_nuevo,
            item.responsable,
            formatearFechaHora(item.fecha),
            botonMovimiento
        ]);
    });

    tabla.draw(false);
    tabla.page(paginaActual).draw(false);
}

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
    return `${dd}/${mm}/${yyyy} ${hh}:${min} ${ampm}`;
}

// Inicializar la tabla DataTable
$(document).ready(function () {
    $("#tablaBitacora").DataTable({
        columnDefs: [
            {
                targets: 0,
                visible: false,
            }
        ],
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.10.16/i18n/Spanish.json"
        },
        order: [[0, "asc"]],
        pageLength: 10
    });
});

async function llenarSelectCategorias() {
    const selectCategoria = document.getElementById('selectCategoria');
    selectCategoria.innerHTML = `<option value="">Seleccionar categoría...</option>`;

    try {
        const response = await fetch(`${url}/api/bodega/obtenerCategorias`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success && Array.isArray(data.categorias)) {
            data.categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.idcategoria;
                option.textContent = cat.categoria;
                selectCategoria.appendChild(option);
            });
        } else {
            selectCategoria.innerHTML = `<option value="">No hay categorías</option>`;
        }
    } catch (error) {
        selectCategoria.innerHTML = `<option value="">Error al cargar categorías</option>`;
        console.error('Error al cargar categorías:', error);
    }
}

// Modifica tu función para abrir el modal así:
function abrirModalRegistrarItem() {
    document.getElementById('formRegistrarItem').reset();
    llenarSelectCategorias(); // Llenar el select dinámicamente

    $('#modalRegistrarItem').modal('show');
    $('#modalRegistrarItem .btn-secondary').off('click').on('click', function () {
        $('#modalRegistrarItem').modal('hide');
    });
}

async function registrarItem() {
    const nombre = document.getElementById('nombreItem').value.trim();
    const cantidad = document.getElementById('cantidadItem').value;
    const idcategoria = document.getElementById('selectCategoria').value;

    if (!nombre || !cantidad || !idcategoria) {
        Swal.fire('Campos requeridos', 'Por favor completa todos los campos.', 'warning');
        return;
    }

    try {
        const response = await fetch(`${url}/api/bodega/registrarItem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                item: nombre,
                cantidad: Number(cantidad),
                idcategoria: Number(idcategoria)
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            Swal.fire('¡Éxito!', data.message, 'success');
            $('#modalRegistrarItem').modal('hide');
            // Opcional: recargar la tabla de items
            await cargarTablaUnificada();
        } else {
            Swal.fire('Error', data.message || 'No se pudo registrar el item.', 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'Error de conexión al registrar el item.', 'error');
        console.error(error);
    }
}

// Asigna el evento al botón Guardar del formulario
document.getElementById('formRegistrarItem').addEventListener('submit', function (e) {
    e.preventDefault();
    registrarItem();
});

// Abre el modal y guarda el iditem seleccionado
function abrirModalMovimiento(iditem) {
    document.getElementById('formRegistrarMovimiento').reset();
    document.getElementById('movimientoIdItem').value = iditem;

    $('#modalRegistrarMovimiento').modal('show');
    $('#modalRegistrarMovimiento .btn-secondary').off('click').on('click', function () {
        $('#modalRegistrarMovimiento').modal('hide');
    });
}

// Evento para el botón de la tabla
$("#tablaBitacora tbody").on("click", ".registrar-movimiento", function () {
    const iditem = $(this).data("id");
    abrirModalMovimiento(iditem);
});

// Enviar el movimiento al backend
document.getElementById('formRegistrarMovimiento').addEventListener('submit', async function (e) {
    e.preventDefault();

    const iditem = document.getElementById('movimientoIdItem').value;
    const cantidad = document.getElementById('movimientoCantidad').value;
    const tipomovimiento = document.getElementById('movimientoTipo').value;
    const idresponsable = localStorage.getItem('idusuario');

    if (!iditem || !cantidad || !tipomovimiento || !idresponsable) {
        Swal.fire('Campos requeridos', 'Por favor completa todos los campos.', 'warning');
        return;
    }

    try {
        const response = await fetch(`${url}/api/bodega/registrarMovimiento`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                iditem: Number(iditem),
                cantidad: Number(cantidad),
                tipomovimiento,
                idresponsable: Number(idresponsable)
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            Swal.fire('¡Éxito!', data.message, 'success');
            $('#modalRegistrarMovimiento').modal('hide');
            await cargarTablaUnificada();
        } else {
            Swal.fire('Error', data.message || 'No se pudo registrar el movimiento.', 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'Error de conexión al registrar el movimiento.', 'error');
        console.error(error);
    }
});