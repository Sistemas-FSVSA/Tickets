// --- Autenticación y Permisos ---
const url = window.env.API_URL;

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('login');
    const identificacionInput = document.getElementById('identificacion');
    const passwordInput = document.getElementById('password');

    if (identificacionInput) {
        identificacionInput.addEventListener('keydown', function (e) {
            if (
                (e.key >= '0' && e.key <= '9') ||
                ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'].includes(e.key)
            ) {
                return;
            } else {
                e.preventDefault();
            }
        });
    }

    form.onsubmit = function (e) {
        e.preventDefault();

        const identificacion = identificacionInput.value.trim();
        const password = passwordInput.value.trim();

        if (!identificacion || !password) {
            Swal.fire({
                title: "Error",
                text: "Por favor, completa todos los campos.",
                icon: "error",
            });
            return;
        }

        const data = { identificacion, password };

        fetch(`${url}/api/index/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Habilita el envío de cookies
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(result => {
                console.log('Respuesta del servidor:', result);

                if (result.estado === 'ok') {
                    Swal.fire({
                        title: "Éxito",
                        text: "Inicio de sesión exitoso. Redirigiendo al dashboard...",
                        icon: "success",
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = '/dashboard/dashboard';
                        localStorage.setItem('nombres', result.usuario.nombres);
                        localStorage.setItem('apellidos', result.usuario.apellidos);
                        localStorage.setItem('correo', result.usuario.correo);
                        localStorage.setItem('identificacion', result.usuario.identificacion);
                        localStorage.setItem('idusuario', result.usuario.idusuario);
                    });
                } else {
                    Swal.fire({
                        title: "Error",
                        text: result.mensaje || "Hubo un problema con el inicio de sesión.",
                        icon: "error"
                    });
                }
            })
            .catch(error => {
                console.error('Error al enviar el formulario:', error);
                Swal.fire({
                    title: "Error",
                    text: "Hubo un error al procesar tu solicitud. Intenta nuevamente.",
                    icon: "error"
                });
            });
    };
});
