// --- Autenticación y Permisos ---
const url = window.env.API_URL;

document.addEventListener('DOMContentLoaded', () => {
    const nombres = localStorage.getItem('nombres');
    const apellidos = localStorage.getItem('apellidos');

    if (nombres && apellidos) {
        const nombreCompleto = `${nombres.trim()} ${apellidos.trim()}`;
        const userNameDisplay = document.getElementById('userNameDisplay');

        if (userNameDisplay) {
            userNameDisplay.textContent = nombreCompleto;
        } else {
            console.error('El elemento con ID "userNameDisplay" no existe en el DOM.');
        }
    } else {
        console.warn('No se encontraron nombres o apellidos en el almacenamiento local.');
    }

    setSessionStartTime()
    resetSessionTimer()
    checkSessionExpiration()
    inactivityTime()



    document.querySelectorAll("a[data-navigate]").forEach(link => {
        link.addEventListener("click", async (event) => {
            event.preventDefault(); // Evita la recarga de la página

            const url = link.getAttribute("href");
            if (!url) return;

            try {
                const response = await fetch(url, { method: "GET", headers: { "X-Requested-With": "XMLHttpRequest" } });

                if (!response.ok) throw new Error("Error al cargar la vista");

                const html = await response.text();
                document.getElementById("contenido").innerHTML = html;

                // Guarda el estado anterior y la nueva URL en el historial
                const prevUrl = window.location.pathname;
                window.history.pushState({ path: url, prevUrl: prevUrl }, "", url);

                // Re-ejecutar scripts específicos de la vista
                reinitializeScripts();

            } catch (error) {
                console.error("Error en la navegación:", error);
            }
        });
    });

    // Escuchar el evento `popstate` para manejar los botones de navegación
    window.addEventListener("popstate", function (event) {
        if (event.state && event.state.path) {
            cargarVista(event.state.path);
        }
    });

    // Función para cargar dinámicamente una vista
    async function cargarVista(url) {
        try {
            showSpinner(); // Mostrar spinner de carga
            const response = await fetch(url, { method: "GET", headers: { "X-Requested-With": "XMLHttpRequest" } });
    
            if (!response.ok) throw new Error(`Error al cargar la vista: ${response.statusText}`);
    
            const html = await response.text();
            document.getElementById("contenido").innerHTML = html;
    
            // Re-ejecutar scripts específicos de la vista
            reinitializeScripts();
        } catch (error) {
            console.error("Error al cargar la vista:", error);
            Swal.fire("Error", "No se pudo cargar la vista. Intenta nuevamente.", "error");
        } finally {
            hideSpinner(); // Ocultar spinner de carga
        }
    }

    setInterval(cargarTickets, 30000);
});

function reinitializeScripts() {
    const path = window.location.pathname;

    function loadAndRunScript(scriptPath, functionName) {
        // Elimina el script si ya existe
        const existingScript = document.querySelector(`script[src="${scriptPath}"]`);
        if (existingScript) {
            existingScript.remove();
        }

        // Cargar nuevamente el script
        const script = document.createElement("script");
        script.src = scriptPath;
        script.onload = () => {
            if (typeof window[functionName] === "function") {
                window[functionName]();
            } else {
                console.error(`Error: ${functionName} no está definido.`);
            }
        };
        script.onerror = () => {
            console.error(`Error al cargar ${scriptPath}`);
        };
        document.body.appendChild(script);
    }

    if (path.includes("/dashboard/dashboard")) {
        loadAndRunScript("/controllers/dashboard/dashboard.js", "inicializarDashboard");
    }

    if (path.includes("/tickets/tickets")) {
        loadAndRunScript("/controllers/tickets/tickets.js", "inicializarTickets");
    }

    if (path.includes("/usuarios/usuarios/")) {
        loadAndRunScript("/controllers/usuarios/usuarios.js", "inicializarUsuarios");
    }

    if (path.includes("/usuarios/usuario/")) {
        loadAndRunScript("/controllers/usuarios/usuario.js", "InicializarUsuario");
    }

    if (path.includes("/tickets/consultastickets")) {
        loadAndRunScript("/controllers/tickets/consultastickets.js", "InicializarConsultaTickets");
    }

    if (path.includes("/tickets/registrotickets")) {
        loadAndRunScript("/controllers/tickets/registrotickets.js", "obtenerDatosTickets");
    }

    if (path.includes("/inventario/consultainventario")) {
        loadAndRunScript("/controllers/inventario/consultainventario.js", "InicializarConsultaInventario");
    }

    if (path.includes("/inventario/registro")) {
        loadAndRunScript("/controllers/inventario/registro.js", "obtenerDatosInventario");
    }

    if (path.includes("/inventario/registro")) {
        loadAndRunScript("/controllers/inventario/guardarequipo.js", "obtenerDatosParaFormulario");
    }

    if (path.includes("/mantenimientos/mantenimiento")) {
        loadAndRunScript("/controllers/mantenimientos/mantenimiento.js", "InicializarMantenimiento");
    }

    if (path.includes("/mantenimientos/hvc")) {
        loadAndRunScript("/controllers/mantenimientos/hvc.js", "InicializarHVC");
    }

    if (path.includes("/modificaciones/modificaciones")) {
        loadAndRunScript("/controllers/modificaciones/modificaciones.js", "InicializarModificaciones");
    }
}

async function cargarTickets() {
    try {
        const response = await fetch(`${url}/api/tickets/obtenerTickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ filtro: '!=', estado: 'CERRADO' })
        });

        const result = await response.json();
        const ticketsAbiertos = result.tickets || [];

        if (ticketsAbiertos.length > 0) {
            const nuevosTickets = ticketsAbiertos.filter(ticket => !ticketIds.has(ticket.idticket));

            if (firstLoad) {
                ticketsAbiertos.forEach(ticket => ticketIds.add(ticket.idticket));
                firstLoad = false;
            } else {
                nuevosTickets.forEach(ticket => {
                    enviarNotificacionConSonido();
                    ticketIds.add(ticket.idticket);
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar los tickets:', error);
    }
}


function enviarNotificacionConSonido() {
    // Reproducir el sonido
    const audio = new Audio('/audio/1.mp3'); // Ruta al archivo de sonido en la carpeta public
    audio.play().catch((error) => {
        console.error("Error al intentar reproducir el sonido:", error);
    });

    // Mostrar la notificación
    Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: '¡Nuevo Ticket!',
        text: 'Tienes un ticket nuevo. 🎉',
        showConfirmButton: false,
        timer: 3000,
    });
}

let ticketIds = new Set(); // Para almacenar los IDs de los tickets actuales
let firstLoad = true; // Para verificar si es la primera carga de tickets
let enProceso = false; // Variable para controlar ejecución
let datosTickets = null; // Variable para almacenar los datos obtenidos
let datosInventario = null; // Variable para almacenar los datos obtenidos
let datosCargados = false; // Variable global para almacenar los datos obtenidos del servidor
let datosFormularioCargados = false; // Variable para controlar si los datos ya fueron cargados
let inputImagen1Formulario = null;
let inputImagen2Formulario = null;
let preview1Formulario = null;
let preview2Formulario = null;
let imagenesExistentes = [null, null];
let imagenesGuardadas = false;
let imagenesModificadas = [false, false];
let guardarImagenesBtn = null;
let Inventario = [];
let ticketsCerrados = [];
let Usuarios = [];
let Mantenimiento = [];
let EquiposSeleccionados = [];

function setSessionStartTime() {
    localStorage.setItem('sessionStartTime', Date.now());
}

function resetSessionTimer() {
    localStorage.setItem('sessionStartTime', Date.now());
}

function checkSessionExpiration() {
    const sessionStartTime = localStorage.getItem('sessionStartTime');
    const maxInactivityTime = 6 * 60 * 60 * 1000;

    if (sessionStartTime) {
        const elapsedTime = Date.now() - parseInt(sessionStartTime, 10);
        if (elapsedTime > maxInactivityTime) {
            logoutLink(true); // Cierre de sesión automático
        }
    }
}

function inactivityTime() {
    let time;
    const maxInactivityTime = 6 * 60 * 60 * 1000; // Tiempo máximo de inactividad

    function resetTimer() {
        clearTimeout(time);
        time = setTimeout(() => logoutUser(true), maxInactivityTime); // Cierre de sesión automático
        resetSessionTimer();
    }

    window.onload = resetTimer;
    document.onmousemove = resetTimer;
    document.onkeypress = resetTimer;
    document.onclick = resetTimer;
    document.onscroll = resetTimer;
    document.onkeydown = resetTimer;
}

const logoutLink = document.getElementById('logoutLink');

logoutLink.addEventListener('click', async (event) => {
    event.preventDefault(); // Evitar la acción por defecto del enlace

    try {
        const response = await fetch(`${url}/api/index/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Habilita el envío de cookies (incluye cookies en la solicitud)
        });

        const data = await response.json();
        if (data.estado === 'ok') {
            localStorage.clear();  // Limpiar sessionStorage

            Swal.fire({
                title: 'Sesión cerrada',
                text: 'Has cerrado sesión correctamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.href = '/login'; // Redirigir al login
            });
        } else {
            console.error('Error al cerrar sesión:', data.mensaje);
            Swal.fire('Error', 'Hubo un problema al cerrar sesión. Inténtalo de nuevo.', 'error');
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        Swal.fire('Error', 'Hubo un problema al cerrar sesión. Inténtalo de nuevo.', 'error');
    }
});


function setupMenuToggle(menuId, toggleId, submenuId, iconId) {
    const toggleElement = document.getElementById(toggleId);
    const submenuElement = document.getElementById(submenuId);
    const iconElement = document.getElementById(iconId);

    if (toggleElement && submenuElement && iconElement) {
        submenuElement.style.display = 'none';
        iconElement.style.transition = 'transform 0.3s ease';

        toggleElement.addEventListener('click', function (event) {
            event.preventDefault();

            if (submenuElement.classList.contains('menu-open')) {
                submenuElement.classList.remove('menu-open');
                submenuElement.style.display = 'none';
                iconElement.style.transform = 'rotate(0deg)';
            } else {
                submenuElement.classList.add('menu-open');
                submenuElement.style.display = 'block';
                iconElement.style.transform = 'rotate(180deg)';
            }
        });
    }
}

// Configurar cada menú desplegable
setupMenuToggle('menuTickets', 'toggleTickets', 'submenuTickets', 'iconTickets');
setupMenuToggle('menuInventario', 'toggleInventario', 'submenuInventario', 'iconInventario');

function formatoHora(fecha) {
    if (!fecha) return 'Fecha no disponible';

    const dateObj = new Date(fecha);
    let hours = dateObj.getUTCHours();
    const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
    const isPM = hours >= 12;

    hours = hours % 12 || 12;
    const period = isPM ? 'PM' : 'AM';

    return `${String(hours).padStart(2, '0')}:${minutes} ${period}`;
}

function formatearFecha(fecha) {
    if (!fecha) return 'Fecha no disponible';

    const dateObj = new Date(fecha);
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    let hours = dateObj.getUTCHours();
    const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
    const isPM = hours >= 12;

    hours = hours % 12 || 12;
    const period = isPM ? 'PM' : 'AM';

    return `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:${minutes} ${period}`;
}

//FUNCION MOSTRAR/OCULTAR SPINNER DE CARGA
function showSpinner() {
    const spinner = document.getElementById('spinner-overlay');
    spinner.classList.add('active');
}
function hideSpinner() {
    const spinner = document.getElementById('spinner-overlay');
    spinner.classList.remove('active');
}
