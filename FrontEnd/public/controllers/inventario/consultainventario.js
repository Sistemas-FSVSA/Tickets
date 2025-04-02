document.addEventListener('DOMContentLoaded', () => {
    InicializarConsultaInventario();
});

async function InicializarConsultaInventario() {
    cargarInventario();

    document.getElementById("guardarCambiosBtn").addEventListener("click", function (event) {
        // Validamos el formulario usando su ID
        let form = document.getElementById("editarInventarioForm");
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        } else {
            guardarCambios();
        }
        form.classList.add("was-validated");
    });

    // Limpiar el modal al cerrarse
    $("#formEditarInventario").on("hidden.bs.modal", function () {
        limpiarModal();
    });
}

// Función para limpiar el modal
function limpiarModal() {
    // Aquí accedemos al formulario dentro del modal
    let form = document.getElementById("editarInventarioForm");
    if (form && typeof form.reset === "function") {
        form.reset();
        form.classList.remove("was-validated");
    } else {
        console.error("No se encontró el formulario con ID 'editarInventarioForm' o no es un elemento <form>");
    }
}


async function cargarInventario() {
    try {
        const response = await fetch(`${url}/api/inventario/obtenerInventario`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const result = await response.json();
        Inventario = result.inventarios;
        renderizarInventario();
    } catch (error) {
        console.error("Error al cargar inventario:", error);
    }
}

function renderizarInventario() {
    const tabla = $("#inventario").DataTable();

    // 🔹 Guardar la página actual antes de actualizar
    let paginaActual = tabla.page();

    // 🔹 Limpiar la tabla sin destruirla
    tabla.clear();

    // 🔹 Agregar los nuevos datos
    Inventario.forEach((inventario) => {
        const estadoTexto = inventario.estado == 1 ? "Activo" : "Desactivado";
        const snFormateado = inventario.sn.toString().padStart(3, "0");

        tabla.row.add([
            snFormateado,
            inventario.nombre,
            inventario.marca,
            inventario.formato,
            inventario.nombreequipo,
            inventario.ipequipo,
            inventario.nombreusuario,
            estadoTexto,
            `<button class="btn btn-warning btn-sm editar-inventario" data-id="${inventario.idinventario}">
                <i class="fas fa-edit"></i> Editar
            </button>`
        ]);
    });

    // 🔹 Dibujar la tabla con los nuevos datos y mantener la página actual
    tabla.draw(false);
    tabla.page(paginaActual).draw(false);
}

// 🔹 Inicializar la tabla si aún no lo está
$(document).ready(function () {
    $("#inventario").DataTable({
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.10.16/i18n/Spanish.json"
        },
        order: [[0, "asc"]],
        pageLength: 10
    });

    // 🔹 Delegar evento para botones de edición
    $("#inventario tbody").on("click", ".editar-inventario", function () {
        const idinventario = $(this).data("id");
        editarInventario(idinventario);
    });

    // 🔹 Cargar inventario por primera vez
    cargarInventario();
});

function editarInventario(idinventario) {
    fetch(`${url}/api/inventario/obtenerInventario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idinventario })
    })
        .then((response) => response.json())
        .then((result) => {
            if (result.inventario) {
                const inventario = result.inventario;
                const opciones = result.opciones;

                // Llenar los campos del modal de edición
                $("#idinventario").val(inventario.idinventario);
                $("#sn").val(inventario.sn ? inventario.sn.toString().padStart(3, "0") : "000");
                $("#nombreequipo").val(inventario.nombreequipo);
                $("#ip").val(inventario.ipequipo);
                $("#usuario").val(inventario.nombreusuario);
                $("#estado").val(inventario.estado);
                $("#mac").val(inventario.mac);
                $("#datos").val(inventario.puertodatos);
                $("#procesador").val(inventario.procesador);
                $("#cantidadram").val(inventario.cantidadram);
                $("#observaciones").val(inventario.observacion);
                $("#cargousuario").val(inventario.cargousuario);
                $("#responsable").val(inventario.responsable);
                $("#so").val(inventario.so);
                $("#cantidadalmacenamiento").val(inventario.cantidadalmacenamiento);
                $("#mantenimiento").val(inventario.mantenimiento ? '1' : '0');
                $("#sistemas").val(inventario.usuariosistemas === 1 ? '1' : inventario.usuariosistemas === 0 ? '0' : '2');

                // Cargar selects dinámicamente
                cargarSelect('#dependencia', opciones.dependencia, inventario.iddependencia, 'iddependencia', 'nombre');
                cargarSelect('#marca', opciones.marca, inventario.idmarca, 'idmarca', 'marca');
                cargarSelect('#formatoEquipo', opciones.formato, inventario.idformato, 'idformato', 'formato');
                cargarSelect('#tiporam', opciones.ram, inventario.idram, 'idram', 'ram');
                cargarSelect('#tipoalmacenamiento', opciones.almacenamiento, inventario.idalmacenamiento, 'idalmacenamiento', 'almacenamiento');

                // Actualizar el botón de cambiar estado
                const btnEstado = document.getElementById("estadoEquipoBtn");
                btnEstado.replaceWith(btnEstado.cloneNode(true)); // Evitar duplicados
                const nuevoBtnEstado = document.getElementById("estadoEquipoBtn");

                if (inventario.estado === 1) {
                    nuevoBtnEstado.textContent = "Desactivar";
                    nuevoBtnEstado.classList.remove("btn-success");
                    nuevoBtnEstado.classList.add("btn-danger");
                } else {
                    nuevoBtnEstado.textContent = "Activar";
                    nuevoBtnEstado.classList.remove("btn-danger");
                    nuevoBtnEstado.classList.add("btn-success");
                }

                // Evento para cambiar el estado
                nuevoBtnEstado.addEventListener("click", function () {
                    const nuevoEstado = nuevoBtnEstado.textContent === "Activar" ? 1 : 0;
                    actualizarEstadoInventario(idinventario, nuevoEstado);
                });

                // Cargar imágenes en el modal de imágenes
                if (result.imagenes && result.imagenes.length > 0) {
                    $("#preview1").attr("src", `${url}${result.imagenes[0]}`).show();
                    $("#download1").attr("href", `${url}${result.imagenes[0]}`).show();

                    if (result.imagenes.length > 1) {
                        $("#preview2").attr("src", `${url}${result.imagenes[1]}`).show();
                        $("#download2").attr("href", `${url}${result.imagenes[1]}`).show();
                    } else {
                        $("#preview2").hide();
                        $("#download2").hide();
                    }
                } else {
                    $("#preview1, #preview2").hide();
                    $("#download1, #download2").hide();
                }

                // Mostrar el modal
                $("#formEditarInventario").modal("show");
            }
        })
        .catch(error => console.error("Error al obtener inventario:", error));
}

async function actualizarEstadoInventario(idinventario, nuevoEstado, motivoDesactivacion = "") {
    // 🔹 Cerrar modal antes de mostrar la alerta
    $("#formEditarInventario").modal("hide");

    // 🔹 Mostrar alerta de confirmación antes de actualizar
    Swal.fire({
        title: `¿Estás seguro de ${nuevoEstado === 1 ? "Activar" : "Desactivar"} este equipo?`,
        text: nuevoEstado === 0 ? "Debes ingresar un motivo de desactivación." : "Esta acción afectará el estado del equipo.",
        icon: "warning",
        input: nuevoEstado === 0 ? "text" : null, // Si desactiva, pedir motivo
        inputPlaceholder: "Motivo de desactivación",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Aceptar",
        cancelButtonText: "Cancelar",
        inputValidator: (value) => {
            if (nuevoEstado === 0 && !value.trim()) {
                return "El motivo es obligatorio para desactivar.";
            }
        },
    }).then(async (result) => {
        if (result.isConfirmed) {
            if (nuevoEstado === 0) {
                motivoDesactivacion = result.value;
            }

            try {
                const response = await fetch(`${url}/api/inventario/actualizarEstadoInv`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ idinventario, estado: nuevoEstado, motivoDesactivacion }),
                });

                const result = await response.json();

                if (response.ok) {
                    Swal.fire({
                        icon: "success",
                        title: "Éxito",
                        text: "Estado del equipo actualizado correctamente.",
                        timer: 1500,
                        showConfirmButton: false,
                    }).then(() => {
                        cargarInventario();
                        editarInventario(idinventario);
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: result.message || "No se pudo actualizar el estado.",
                        timer: 1500,
                        showConfirmButton: false,
                    });
                }
            } catch (error) {
                console.error("Error al actualizar el estado:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudo conectar con el servidor.",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        }
    });
}

// Función para cargar select con opciones dinámicas
function cargarSelect(selector, opciones, seleccionada, idKey, nombreKey) {
    const select = $(selector);
    select.empty();
    opciones.forEach(opcion => {
        const selected = opcion[idKey] === seleccionada ? 'selected' : '';
        select.append(`<option value="${opcion[idKey]}" ${selected}>${opcion[nombreKey]}</option>`);
    });
}

