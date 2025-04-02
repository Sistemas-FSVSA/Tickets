document.addEventListener('DOMContentLoaded', () => {
    inicializarUsuarios();
});
async function inicializarUsuarios() {
    cargarUsuarios();

    document.getElementById("guardarCambios").addEventListener("click", function (event) {
        let form = document.getElementById("formEditarUsuario");

        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        } else {
            guardarCambios();
        }

        form.classList.add("was-validated");
    });

    // Detectar cuando el modal se cierra para limpiar el formulario
    $("#modalEditarUsuario").on("hidden.bs.modal", function () {
        limpiarModal();
    });
}

// Función para limpiar el modal
function limpiarModal() {
    let form = document.getElementById("formEditarUsuario");
    form.reset(); // Limpiar todos los inputs
    form.classList.remove("was-validated"); // Quitar validaciones previas
}


async function cargarUsuarios() {
    try {
        const response = await fetch(`${url}/api/usuarios/obtenerUsuarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const result = await response.json();
        Usuarios = result.usuarios;
        renderizarUsuarios();
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
    }
}

function renderizarUsuarios() {
    const tabla = $("#usuarios").DataTable();

    // 🔹 Guardar la página actual antes de actualizar
    let paginaActual = tabla.page();

    // 🔹 Limpiar la tabla sin destruirla
    tabla.clear();

    // 🔹 Agregar los nuevos datos
    Usuarios.forEach((usuario) => {
        const switchEstado = `
            <div class="custom-control custom-switch">
                <input type="checkbox" class="custom-control-input switch-estado" id="switch-${usuario.idresponsable}" 
                    ${usuario.estado === 1 ? "checked" : ""} data-id="${usuario.idresponsable}">
                <label class="custom-control-label" for="switch-${usuario.idresponsable}"></label>
            </div>
        `;

        const botonEditar = `
            <button class="btn btn-warning btn-sm editar-usuario" data-id="${usuario.idresponsable}">
                <i class="fas fa-edit"></i> Editar
            </button>
        `;

        tabla.row.add([
            usuario.nombres,
            usuario.apellidos,
            usuario.documento,
            switchEstado,
            usuario.correo || "No hay correo",
            botonEditar
        ]);
    });

    // 🔹 Dibujar la tabla con los nuevos datos y mantener la página actual
    tabla.draw(false);
    tabla.page(paginaActual).draw(false);
}

// 🔹 Inicializar la tabla si aún no lo está
$(document).ready(function () {
    $("#usuarios").DataTable({
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.10.16/i18n/Spanish.json"
        },
        order: [[0, "asc"]],
        pageLength: 10
    });

    // 🔹 Delegar eventos para los botones "Editar"
    $("#usuarios tbody").on("click", ".editar-usuario", function () {
        const idusuario = $(this).data("id");
        editarUsuario(idusuario);
    });

    // 🔹 Delegar eventos para los switches de estado
    $("#usuarios tbody").on("change", ".switch-estado", function () {
        const idusuario = $(this).data("id");
        const nuevoEstado = this.checked ? 1 : 0;
        cambiarEstadoUsuario(idusuario, nuevoEstado);
    });

    // 🔹 Cargar usuarios por primera vez
    cargarUsuarios();
});


function cambiarEstadoUsuario(idusuario, nuevoEstado) {
    const usuarioLogueado = Number(sessionStorage.getItem("idusuario")); // Convertir a número

    if (idusuario === usuarioLogueado) {
        Swal.fire({
            icon: "error",
            title: "Acción no permitida",
            text: "No puedes desactivar tu propio usuario.",
            timer: 1500,
            showConfirmButton: false
        });

        // 🔹 Restaurar el estado original del switch
        setTimeout(() => {
            document.getElementById(`switch-${idusuario}`).checked = true;
        }, 100);

        return;
    }

    Swal.fire({
        title: `¿Estás seguro de ${nuevoEstado === 1 ? "Activar" : "Desactivar"} este usuario?`,
        text: "Esta acción puede afectar el acceso del usuario.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Aceptar",
        cancelButtonText: "Cancelar"
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`${url}/api/usuarios/actualizarEstadoUsr`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ idusuario, estado: nuevoEstado })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire({
                            icon: "success",
                            title: "Éxito",
                            text: `El usuario ha sido ${nuevoEstado === 1 ? "Activado" : "Desactivado"} correctamente.`,
                            timer: 1500,
                            showConfirmButton: false
                        });
                    } else {
                        Swal.fire({
                            icon: "error",
                            title: "Error",
                            text: "Hubo un problema al actualizar el estado.",
                            timer: 1500,
                            showConfirmButton: false
                        });

                        // 🔹 Restaurar el estado original del switch en caso de error
                        setTimeout(() => {
                            document.getElementById(`switch-${idusuario}`).checked = !nuevoEstado;
                        }, 100);
                    }
                })
                .catch(error => {
                    console.error("Error en la solicitud:", error);
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "No se pudo conectar con el servidor.",
                        timer: 1500,
                        showConfirmButton: false
                    });

                    // 🔹 Restaurar el estado original del switch en caso de error
                    setTimeout(() => {
                        document.getElementById(`switch-${idusuario}`).checked = !nuevoEstado;
                    }, 100);
                });
        } else {
            // 🔹 Restaurar el estado original del switch si el usuario cancela la acción
            setTimeout(() => {
                document.getElementById(`switch-${idusuario}`).checked = !nuevoEstado;
            }, 100);
        }
    });
}


function editarUsuario(idusuario) {
    fetch(`${url}/api/usuarios/obtenerUsuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idusuario: idusuario }),
    })
        .then((response) => response.json())
        .then((result) => {
            if (result.usuario) {
                const usuario = result.usuario;

                // Llenar los campos del modal
                $("#idusuario").val(usuario.idresponsable);
                $("#nombres").val(usuario.nombres);
                $("#apellidos").val(usuario.apellidos);
                $("#documento").val(usuario.documento);
                $("#correo").val(usuario.correo || "");
                $("#estado").val(usuario.estado);

                // Mostrar el modal
                $("#modalEditarUsuario").modal("show");
            }
        })
        .catch(error => console.error("Error al obtener usuario:", error));
}

// 🔹 Guardar cambios (función asincrónica)
async function guardarCambios() {
    const data = {
        idusuario: $("#idusuario").val(),
        nombres: $("#nombres").val(),
        apellidos: $("#apellidos").val(),
        documento: $("#documento").val(),
        correo: $("#correo").val(),
    };

    try {
        const response = await fetch(`${url}/api/usuarios/actualizarUsuario`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
        });
        const result = await response.json();

        if (result.success) {
            Swal.fire({
                icon: "success",
                title: "Usuario actualizado",
                text: "Los cambios se guardaron correctamente.",
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                $("#modalEditarUsuario").modal("hide");
                cargarUsuarios();
            });
        }
    } catch (error) {
        console.error("Error al guardar cambios:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo conectar con el servidor.",
            timer: 1500,
            showConfirmButton: false
        });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const documentoRegistroInput = document.getElementById("documentoRegistro");

    if (documentoRegistroInput) {
        documentoRegistroInput.addEventListener("keydown", function (e) {
            if (
                (e.key >= "0" && e.key <= "9") || 
                ["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete", "Enter"].includes(e.key)
            ) {
                return;
            } else {
                e.preventDefault();
            }
        });
    }
});