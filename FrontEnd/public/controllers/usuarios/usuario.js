document.addEventListener('DOMContentLoaded', () => {
    InicializarUsuario()
});

async function InicializarUsuario() {
        // Obtener datos del usuario desde sessionStorage
        const nombres = sessionStorage.getItem("nombres") || "";
        const apellidos = sessionStorage.getItem("apellidos") || "";
        const documento = sessionStorage.getItem("identificacion") || "";
        const idUsuario = sessionStorage.getItem("idusuario"); // Obtener el ID del usuario en sesión
    
        // Insertar los valores en los campos
        document.getElementById("nombre").value = `${nombres} ${apellidos}`;
        document.getElementById("documento").value = documento;
    
        // Validar si no hay ID de usuario en sesión (para evitar errores)
        if (!idUsuario) {
            console.error("No hay usuario en sesión.");
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se encontró la información del usuario en sesión.',
            });
            return;
        }
    
        // Evento para cambiar contraseña
        document.getElementById("guardarPasswordBtn").addEventListener("click", function (event) {
            event.preventDefault();
    
            // Capturar valores de los inputs
            const oldpassword = document.getElementById("passwordActual").value;
            const newpassword = document.getElementById("passwordNueva").value;
            const confirmarPassword = document.getElementById("confirmarPasswordNueva").value;
    
            // Validar que las contraseñas coincidan
            if (newpassword !== confirmarPassword) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Las contraseñas no coinciden.',
                });
                return;
            }
    
            // Datos a enviar en la petición
            const passwordData = {
                idusuario: idUsuario, // Ahora toma el ID del usuario en sesión
                oldpassword: oldpassword,
                newpassword: newpassword
            };
    
            // Realizar la petición con fetch
            fetch(`${url}/api/usuarios/actualizarContraseña`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(passwordData),
                credentials: "include",
            })
            .then(response => response.json()) // Convertir la respuesta en JSON
            .then(data => {
                if (data.success) { // Verificar si el backend envió una respuesta exitosa
                    Swal.fire({
                        icon: 'success',
                        title: 'Contraseña actualizada',
                        text: 'Tu contraseña ha sido actualizada correctamente.',
                    });
                    $('#modalCambiarPassword').modal('hide');
                    $('.modal-backdrop').remove();
                    $('body').removeClass('modal-open');
                } else {
                    // Si el backend envía un error, mostrar el mensaje adecuado
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'Hubo un error al cambiar la contraseña.',
                    });
                }
            })
            .catch(error => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Hubo un error al procesar la solicitud.',
                });
            });
        });
}