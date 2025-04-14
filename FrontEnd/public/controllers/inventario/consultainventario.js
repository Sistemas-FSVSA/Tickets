document.addEventListener('DOMContentLoaded', () => {
    InicializarConsultaInventario();
});

async function InicializarConsultaInventario() {
    cargarInventario();

    guardarCambiosBtn.addEventListener("click", function (event) {
        event.preventDefault();
        let form = document.getElementById("editarInventarioForm");

        if (form.checkValidity() === false) {
            event.stopPropagation();
        } else {
            actualizarEquipo(); // Esta sí está definida correctamente
        }

        form.classList.add("was-validated");
    });

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
    if (form) {
        form.classList.remove("was-validated");
    }

    // Reiniciar estado de imágenes
    imagenesGuardadas = false;
    imagenesExistentes = [null, null];
    inputImagen1Formulario.value = "";
    inputImagen2Formulario.value = "";
    preview1Formulario.src = "";
    preview2Formulario.src = "";
    preview1Formulario.style.display = "none";
    preview2Formulario.style.display = "none";

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

                // Cargar imágenes en el modal de imágenes
                if (result.imagenes && result.imagenes.length > 0) {
                    // Guardar referencias de las imágenes existentes
                    imagenesExistentes[0] = result.imagenes[0];
                    $("#preview1").attr("src", `${url}${result.imagenes[0]}`).show();
                    $("#download1").attr("href", `${url}${result.imagenes[0]}`).show();

                    if (result.imagenes.length > 1) {
                        imagenesExistentes[1] = result.imagenes[1];
                        $("#preview2").attr("src", `${url}${result.imagenes[1]}`).show();
                        $("#download2").attr("href", `${url}${result.imagenes[1]}`).show();
                    } else {
                        imagenesExistentes[1] = null;
                        $("#preview2").hide();
                        $("#download2").hide();
                    }
                } else {
                    imagenesExistentes = [null, null];
                    $("#preview1, #preview2").hide();
                    $("#download1, #download2").hide();
                }

                // Mostrar el modal
                $("#formEditarInventario").modal("show");
            }
        })
        .catch(error => console.error("Error al obtener inventario:", error));
}

function prepararImagenesParaEnvio() {
    const archivos = [];

    // Imagen 1
    if (inputImagen1Formulario.files.length > 0) {
        archivos.push(inputImagen1Formulario.files[0]);
    } else if (imagenesExistentes[0]) {
        // Si no hay nueva imagen pero existe una guardada, enviar null para mantenerla
        archivos.push(null);
    } else {
        // Si no hay imagen nueva ni existente, enviar Blob vacío
        archivos.push(new Blob([]));
    }

    // Imagen 2
    if (inputImagen2Formulario.files.length > 0) {
        archivos.push(inputImagen2Formulario.files[0]);
    } else if (imagenesExistentes[1]) {
        // Si no hay nueva imagen pero existe una guardada, enviar null para mantenerla
        archivos.push(null);
    } else {
        // Si no hay imagen nueva ni existente, enviar Blob vacío
        archivos.push(new Blob([]));
    }

    return archivos;
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

const guardarCambiosBtn = document.getElementById("guardarCambiosBtn");
const inputImagen1Formulario = document.getElementById("imagen1");
const inputImagen2Formulario = document.getElementById("imagen2");
const preview1Formulario = document.getElementById("preview1");
const preview2Formulario = document.getElementById("preview2");
const guardarImagenesBtn = document.getElementById("guardarImagenesBtn");
const modal = document.getElementById("formEditarInventario");

inputImagen1Formulario.addEventListener("change", () => {
    mostrarVistaPreviaFormulario(inputImagen1Formulario, preview1Formulario);
});

inputImagen2Formulario.addEventListener("change", () => {
    mostrarVistaPreviaFormulario(inputImagen2Formulario, preview2Formulario);
});

function mostrarVistaPreviaFormulario(input, preview) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = "block";
        };
        reader.readAsDataURL(file);
    } else {
        preview.src = "";
        preview.style.display = "none";
    }
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

    // Manejo de imágenes mejorado
    try {
        // Función para convertir URL de imagen a Blob
        async function urlToBlob(imageUrl) {
            if (!imageUrl) return new Blob([]);
            try {
                const response = await fetch(`${url}${imageUrl}`);
                return await response.blob();
            } catch (error) {
                console.error("Error al convertir imagen existente:", error);
                return new Blob([]);
            }
        }

        // Procesar imagen 1
        if (inputImagen1Formulario.files.length > 0) {
            // Si hay nueva imagen, enviarla
            formData.append("archivos[]", inputImagen1Formulario.files[0]);
        } else if (imagenesExistentes[0]) {
            // Si no hay nueva pero existe una guardada, convertir y reenviar
            const blob = await urlToBlob(imagenesExistentes[0]);
            formData.append("archivos[]", blob, `imagen1_${Date.now()}.jpg`);
        } else {
            // Si no hay imagen, enviar Blob vacío
            formData.append("archivos[]", new Blob([]));
        }

        // Procesar imagen 2
        if (inputImagen2Formulario.files.length > 0) {
            formData.append("archivos[]", inputImagen2Formulario.files[0]);
        } else if (imagenesExistentes[1]) {
            const blob = await urlToBlob(imagenesExistentes[1]);
            formData.append("archivos[]", blob, `imagen2_${Date.now()}.jpg`);
        } else {
            formData.append("archivos[]", new Blob([]));
        }

        // Mostrar loader mientras se procesa
        Swal.fire({
            title: 'Procesando...',
            html: 'Por favor espera mientras se actualiza el equipo',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(`${url}/api/inventario/actualizarEquipo`, {
            method: "POST",
            credentials: "include",
            body: formData,
        });

        // Cerrar loader
        Swal.close();

        // Verificar si la respuesta es JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            throw new Error(`Respuesta inesperada del servidor: ${text.substring(0, 100)}...`);
        }

        const result = await handleResponse(response);

        if (response.ok) {
            Swal.fire({
                icon: "success",
                title: "Éxito",
                text: "El inventario se actualizó correctamente.",
                timer: 2000,
                showConfirmButton: false,
            }).then(() => {
                $("#formEditarInventario").modal("hide");
                cargarInventario();
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

        // Mostrar mensaje de error más detallado
        let errorMessage = "No se pudo conectar con el servidor.";
        if (error.message.includes("Unexpected token '<'")) {
            errorMessage = "El servidor respondió con una página de error. Verifica la consola para más detalles.";
        } else if (error.message) {
            errorMessage = error.message;
        }

        Swal.fire({
            icon: "error",
            title: "Error",
            text: errorMessage,
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
            preview1Formulario.src = "";
            preview1Formulario.style.display = "none";
        }
        if (inputImagen2Formulario) {
            inputImagen2Formulario.value = "";
            preview2Formulario.src = "";
            preview2Formulario.style.display = "none";
        }
    }
}

// Evento para guardar imágenes seleccionadas en el formulario al actualizar
guardarImagenesBtn.addEventListener("click", function () {
    imagenesGuardadas = true;

    // Copiar imágenes del modal al formulario
    if (inputImagen1Formulario.files.length) {
        mostrarVistaPreviaFormulario(inputImagen1Formulario, preview1Formulario);
    }
    if (inputImagen2Formulario.files.length) {
        mostrarVistaPreviaFormulario(inputImagen2Formulario, preview2Formulario);
    }

    // Cerrar el modal
    $('#subirImagenesModal').modal('hide');
});

$(modal).on("hidden.bs.modal", function () {
    if (!imagenesGuardadas) {
        limpiarImagenesFormulario();
    }
});

// Evento para guardar imágenes seleccionadas
$('#guardarImagenesBtn').off('click').on('click', function () {
    imagenesGuardadas = true;

    // Actualizar vistas previas
    if (inputImagen1Formulario.files.length) {
        mostrarVistaPreviaFormulario(inputImagen1Formulario, preview1Formulario);
    }
    if (inputImagen2Formulario.files.length) {
        mostrarVistaPreviaFormulario(inputImagen2Formulario, preview2Formulario);
    }

    $('#subirImagenesModal').modal('hide');
});

// Manejar eventos del modal principal
$('#formEditarInventario').off('hidden.bs.modal').on('hidden.bs.modal', function () {
    if (!imagenesGuardadas) {
        limpiarImagenesFormulario();
    }
});

// Reiniciar variable cuando se abre el modal de imágenes
$('#subirImagenesModal').off('shown.bs.modal').on('shown.bs.modal', function () {
    imagenesGuardadas = false;

    if (inputImagen1Formulario.files.length) {
        mostrarVistaPreviaFormulario(inputImagen1Formulario, document.getElementById("preview1"));
    }
    if (inputImagen2Formulario.files.length) {
        mostrarVistaPreviaFormulario(inputImagen2Formulario, document.getElementById("preview2"));
    }
});