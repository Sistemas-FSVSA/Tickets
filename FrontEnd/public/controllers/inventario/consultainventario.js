document.addEventListener('DOMContentLoaded', () => {
    InicializarConsultaInventario();
});

async function InicializarConsultaInventario() {
    reiniciarEstadoGlobal();
    cargarInventario();
    inicializarEventosModalImagenes();
    asignarEventosImagenes();
    asignarEventoGuardarCambios();

    if (!inputImagen1Formulario || !inputImagen2Formulario || !preview1Formulario || !preview2Formulario || !guardarImagenesBtn) {
        console.error("No se encontraron todos los elementos de imágenes necesarios");
        return; // Detener la ejecución si faltan elementos
    }

    // Reiniciar vistas previas de imágenes
    preview1Formulario.src = "";
    preview1Formulario.style.display = "none";
    preview2Formulario.src = "";
    preview2Formulario.style.display = "none";
}

$(document).on('change', '#filtroEstado', function () {
    const estadoSeleccionado = $(this).val();
    filtrarPorEstado(estadoSeleccionado);
});

function filtrarPorEstado(estadoSeleccionado) {
    const tabla = $("#inventario").DataTable();
    let paginaActual = tabla.page();

    tabla.clear();

    const inventarioFiltrado = estadoSeleccionado
        ? Inventario.filter(i => (i.estado == 1 ? "Activo" : "Desactivado") === estadoSeleccionado)
        : Inventario;

    inventarioFiltrado.forEach((inventario) => {
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

    tabla.draw(false);
    tabla.page(paginaActual).draw(false);
}


function inicializarEventosModalImagenes() {
    // Reasignar eventos del modal de imágenes
    $('#subirImagenesModal')
        .off('shown.bs.modal hidden.bs.modal hide.bs.modal')
        .on('shown.bs.modal', function () {
            imagenesGuardadas = false;

            // Actualizar vistas previas de imágenes al abrir el modal
            if (imagenesExistentes[0] && preview1Formulario) {
                preview1Formulario.src = `${url}${imagenesExistentes[0]}`;
                preview1Formulario.style.display = "block";
            } else if (preview1Formulario) {
                preview1Formulario.src = "";
                preview1Formulario.style.display = "none";
            }

            if (imagenesExistentes[1] && preview2Formulario) {
                preview2Formulario.src = `${url}${imagenesExistentes[1]}`;
                preview2Formulario.style.display = "block";
            } else if (preview2Formulario) {
                preview2Formulario.src = "";
                preview2Formulario.style.display = "none";
            }
        })
        .on('hide.bs.modal', function () {
            // Remueve el foco antes de que Bootstrap aplique aria-hidden
            const focused = document.activeElement;
            if (focused && this.contains(focused)) {
                focused.blur();
            }
        })
        .on('hidden.bs.modal', function () {
            if (!imagenesGuardadas) {
                limpiarImagenesFormulario();
            }

            const abrirModalBtn = document.getElementById("subirImagenesBtn");
            if (abrirModalBtn) {
                abrirModalBtn.focus();
            }
        });

    // Evento para abrir el modal de imágenes
    $(document).on('click', '#subirImagenesBtn', function () {
        $('#subirImagenesModal').modal('show');
    });
}

function reiniciarEstadoGlobal() {
    inputImagen1Formulario = document.getElementById("imagen1");
    inputImagen2Formulario = document.getElementById("imagen2");
    preview1Formulario = document.getElementById("preview1");
    preview2Formulario = document.getElementById("preview2");
    guardarImagenesBtn = document.getElementById("guardarImagenesBtn");
    imagenesGuardadas = false;
    imagenesExistentes = [];
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

        if (result.imagenes && result.imagenes.length > 0) {
            imagenesExistentes = result.imagenes; // Actualiza las imágenes existentes
        }
    } catch (error) {
        console.error("Error al cargar inventario:", error);
    }

    const estadoSeleccionado = $("#filtroEstado").val();
    if (estadoSeleccionado) {
        filtrarPorEstado(estadoSeleccionado);
    }
}

function asignarEventoGuardarCambios() {
    const guardarCambiosBtn = document.getElementById("guardarCambiosBtn");
    if (!guardarCambiosBtn) return;

    guardarCambiosBtn.addEventListener("click", function (event) {
        event.preventDefault();
        const form = document.getElementById("editarInventarioForm");

        if (!form.checkValidity()) {
            event.stopPropagation();
        } else {
            actualizarEquipo();
        }

        form.classList.add("was-validated");
    });
}

function renderizarInventario() {
    const tabla = $("#inventario").DataTable();
    let paginaActual = tabla.page();
    tabla.clear();

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

    tabla.draw(false);
    tabla.page(paginaActual).draw(false);

    // Reasignar eventos después de renderizar
    $("#inventario tbody").off("click", ".editar-inventario").on("click", ".editar-inventario", function () {
        const idinventario = $(this).data("id");
        editarInventario(idinventario);
    });
}

// 🔹 Inicializar la tabla si aún no lo está
$(document).ready(function () {
    // Destruir la tabla si ya existe
    if ($.fn.DataTable.isDataTable("#inventario")) {
        $("#inventario").DataTable().destroy();
    }

    // Inicializar DataTable
    const tabla = $("#inventario").DataTable({
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.10.16/i18n/Spanish.json"
        },
        order: [[0, "asc"]],
        pageLength: 10,
        destroy: true // Permite reinicializar la tabla
    });

    // Delegar evento para botones de edición
    $("#inventario tbody").off("click", ".editar-inventario").on("click", ".editar-inventario", function () {
        const idinventario = $(this).data("id");
        editarInventario(idinventario);
    });

    // Cargar inventario por primera vez
    cargarInventario();
});

function editarInventario(idinventario) {
    // Limpiar validación previa antes de abrir el modal
    const form = document.getElementById("editarInventarioForm");
    const modal = document.getElementById("subirImagenesModal");
    if (!modal) {
        console.error("El modal de imágenes no está disponible en el DOM.");
        return;
    }
    if (form) form.classList.remove("was-validated");

    // Reiniciar estados de imágenes
    imagenesGuardadas = false;
    imagenesExistentes = []
    imagenesModificadas = [false, false];

    // Limpiar inputs pero mantener referencias a imágenes existentes
    if (inputImagen1Formulario) inputImagen1Formulario.value = "";
    if (inputImagen2Formulario) inputImagen2Formulario.value = "";

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
                cargarSelect('#formatoequipo', opciones.formato, inventario.idformato, 'idformato', 'formato');
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

                // Manejo de imágenes
                if (result.imagenes && result.imagenes.length > 0) {
                    imagenesExistentes[0] = result.imagenes[0];
                    if (preview1Formulario) {
                        preview1Formulario.src = `${url}${result.imagenes[0]}`;
                        preview1Formulario.style.display = "block";
                    }

                    if (result.imagenes.length > 1) {
                        imagenesExistentes[1] = result.imagenes[1];
                        if (preview2Formulario) {
                            preview2Formulario.src = `${url}${result.imagenes[1]}`;
                            preview2Formulario.style.display = "block";
                        }
                    }
                } else {
                    // Si no hay imágenes, oculta las vistas previas
                    if (preview1Formulario) {
                        preview1Formulario.src = "";
                        preview1Formulario.style.display = "none";
                    }
                    if (preview2Formulario) {
                        preview2Formulario.src = "";
                        preview2Formulario.style.display = "none";
                    }
                }

                // Mostrar el modal
                $("#formEditarInventario").modal("show");
            }
        })
        .catch(error => console.error("Error al obtener inventario:", error));
}

$('#formEditarInventario').on('shown.bs.modal', function () {
    if (imagenesExistentes[0] && preview1Formulario) {
        preview1Formulario.src = `${url}${imagenesExistentes[0]}`;
        preview1Formulario.style.display = "block";
    }
    if (imagenesExistentes[1] && preview2Formulario) {
        preview2Formulario.src = `${url}${imagenesExistentes[1]}`;
        preview2Formulario.style.display = "block";
    }
});

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

function asignarEventosImagenes() {
    // Limpiar eventos anteriores para evitar duplicados
    inputImagen1Formulario.removeEventListener("change", manejarCambioImagen1);
    inputImagen2Formulario.removeEventListener("change", manejarCambioImagen2);
    guardarImagenesBtn.removeEventListener("click", manejarGuardarImagenes);

    // Asignar nuevos eventos
    inputImagen1Formulario.addEventListener("change", manejarCambioImagen1);
    inputImagen2Formulario.addEventListener("change", manejarCambioImagen2);
    guardarImagenesBtn.addEventListener("click", manejarGuardarImagenes);
}

function manejarCambioImagen1() {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (preview1Formulario) {
                preview1Formulario.src = e.target.result;
                preview1Formulario.style.display = "block";
                imagenesModificadas[0] = true;
            }
        };
        reader.readAsDataURL(this.files[0]);
    }
}

function manejarCambioImagen2() {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (preview2Formulario) {
                preview2Formulario.src = e.target.result;
                preview2Formulario.style.display = "block";
                imagenesModificadas[1] = true;
            }
        };
        reader.readAsDataURL(this.files[0]);
    }
}

function manejarGuardarImagenes(event) {
    event.preventDefault();

    // Actualiza las imágenes existentes solo para el registro actual
    if (inputImagen1Formulario.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function (e) {
            if (preview1Formulario) {
                preview1Formulario.src = e.target.result;
                preview1Formulario.style.display = "block";
            }
        };
        reader.readAsDataURL(inputImagen1Formulario.files[0]);
    }

    if (inputImagen2Formulario.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function (e) {
            if (preview2Formulario) {
                preview2Formulario.src = e.target.result;
                preview2Formulario.style.display = "block";
            }
        };
        reader.readAsDataURL(inputImagen2Formulario.files[0]);
    }

    imagenesGuardadas = true;
    $('#subirImagenesModal').modal('hide');
}

function mostrarVistaPreviaFormulario(input, preview) {
    const file = input.files[0];
    if (!file) {
        preview.style.display = "none";
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        preview.src = e.target.result;
        preview.style.display = "block";
    };
    reader.readAsDataURL(file);
}


async function actualizarEquipo() {
    const formData = new FormData();
    const idinventario = document.getElementById("idinventario").value;
    formData.append("idinventario", idinventario);

    // Agregar datos del equipo
    const equipoData = [
        "sn", "ip", "mac", "datos", "procesador", "tiporam", "cantidadram",
        "tipoalmacenamiento", "cantidadalmacenamiento", "formatoequipo", "marca",
        "so", "nombreequipo", "sistemas", "dependencia", "responsable", "usuario",
        "cargousuario", "mantenimiento", "observaciones"
    ];

    equipoData.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            formData.append(id, input.value);
        }
    });

    // Agregar usuario
    const idusuario = localStorage.getItem("idusuario");
    if (idusuario) {
        formData.append("idusuario", idusuario);
    }

    // Procesar imágenes y enviarlas en un array `archivos[]`
    if (inputImagen1Formulario.files.length > 0) {
        // Si hay una nueva imagen seleccionada, envíala
        formData.append("archivos[]", inputImagen1Formulario.files[0]);
    } else if (imagenesExistentes[0]) {
        // Si no hay nueva imagen, envía la imagen existente como un archivo virtual
        const response = await fetch(`${url}${imagenesExistentes[0]}`);
        const blob = await response.blob();
        formData.append("archivos[]", blob, "imagen1.jpg");
    } else {
        // Si no hay imagen nueva ni existente, envía un archivo vacío
        formData.append("archivos[]", new Blob([]), "imagen1.jpg");
    }

    if (inputImagen2Formulario.files.length > 0) {
        // Si hay una nueva imagen seleccionada, envíala
        formData.append("archivos[]", inputImagen2Formulario.files[0]);
    } else if (imagenesExistentes[1]) {
        // Si no hay nueva imagen, envía la imagen existente como un archivo virtual
        const response = await fetch(`${url}${imagenesExistentes[1]}`);
        const blob = await response.blob();
        formData.append("archivos[]", blob, "imagen2.jpg");
    } else {
        // Si no hay imagen nueva ni existente, envía un archivo vacío
        formData.append("archivos[]", new Blob([]), "imagen2.jpg");
    }

    try {
        const response = await fetch(`${url}/api/inventario/actualizarEquipo`, {
            method: "POST",
            credentials: "include",
            body: formData,
        });

        const result = await handleResponse(response);

        if (response.ok) {
            Swal.fire({
                icon: "success",
                title: "Éxito",
                text: "El inventario se actualizó correctamente.",
                timer: 2000,
                showConfirmButton: false,
            }).then(() => {
                cargarInventario();
                editarInventario(idinventario);
            });
        } else {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: result.message || "Ocurrió un error al actualizar el inventario.",
            });
        }
    } catch (error) {
        console.error("Error al enviar datos al backend:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: error.message || "No se pudo conectar con el servidor.",
        });
    }
}

// Función auxiliar para verificar la respuesta
async function handleResponse(response) {
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("La respuesta no es JSON:", text);
        throw new Error(text);
    }
}

function limpiarModal() {
    const form = document.getElementById("editarInventarioForm");

    if (form && typeof form.reset === "function") {
        form.reset();

        // No borrar las imágenes si ya fueron guardadas
        if (!imagenesGuardadas) {
            limpiarImagenesFormulario();
        }

        form.classList.remove("was-validated");
    } else {
        console.error("No se encontró el formulario con ID 'editarInventarioForm'");
    }
}

// Función para limpiar imágenes en el formulario si no se guardaron
function limpiarImagenesFormulario() {
    if (!imagenesGuardadas) {
        if (inputImagen1Formulario) {
            inputImagen1Formulario.value = "";
            if (preview1Formulario) {
                preview1Formulario.src = "";
                preview1Formulario.style.display = "none";
            }
            imagenesModificadas[0] = false;
        }
        if (inputImagen2Formulario) {
            inputImagen2Formulario.value = "";
            if (preview2Formulario) {
                preview2Formulario.src = "";
                preview2Formulario.style.display = "none";
            }
            imagenesModificadas[1] = false;
        }
    }
}

// Manejar eventos del modal principal
$('#formEditarInventario').off('hidden.bs.modal').on('hidden.bs.modal', function () {
    if (!imagenesGuardadas) {
        limpiarImagenesFormulario();
    }
});