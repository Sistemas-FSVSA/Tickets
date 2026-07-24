// --- Autenticación y Permisos ---
// NOTA: este formulario es público (no requiere sesión), por eso ninguna
// de las peticiones de abajo manda header Authorization. Si en algún
// momento el backend empieza a exigir un token incluso para este flujo
// público, avisar para agregarlo.
const url = window.env.API_URL; // Backend viejo (se mantiene por si algo más de esta página lo usa)

// Backend NUEVO: solo para los endpoints de tickets que ya migraron
// (topics, subtopics, dependencias vía /auth, y creación de ticket).
const ticketsUrl = window.env.TICKETS_API_URL;

const MAX_IMAGES = 2;
const MAX_FILES = 2;
const MAX_CHARACTERS = 1000; // Límite de caracteres
let uploadedFiles = [];
let imageFiles = []; // Contendrá imágenes cargadas y pegadas

const extension = document.getElementById('extension');
// Validar que solo se permitan números en el input de ticket
if (extension) {
    extension.addEventListener('keydown', function (e) {
        if (
            (e.key >= '0' && e.key <= '9') || // Números
            e.key === 'Backspace' ||         // Retroceso
            e.key === 'Tab' ||              // Tabulación
            e.key === 'ArrowLeft' ||        // Flecha izquierda
            e.key === 'ArrowRight' ||       // Flecha derecha
            e.key === 'Delete' ||           // Suprimir
            e.key === 'Enter'               // Enter
        ) {
            return; // Permitir estas teclas
        } else {
            e.preventDefault(); // Bloquear cualquier otra tecla
        }
    });
}


// Validar que solo se permitan letras en el campo "Nombre"
const username = document.getElementById('username');
if (username) {
    // Bloquear números y caracteres no permitidos
    username.addEventListener('keydown', function (e) {
        // Permitir teclas de control
        if (
            e.key === 'Backspace' ||
            e.key === 'Tab' ||
            e.key === 'ArrowLeft' ||
            e.key === 'ArrowRight' ||
            e.key === 'Delete' ||
            e.key === 'Enter' ||
            e.key === ' ' // Permitir espacio para nombres compuestos
        ) {
            return;
        }

        // Bloquear números
        if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            return;
        }

        // Solo permitir letras (a-z, A-Z) y letras con tildes/ñ
        const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]$/;
        if (!regex.test(e.key)) {
            e.preventDefault();
        }
    });

    // Bloquear copiar y pegar
    username.addEventListener('paste', function (e) {
        e.preventDefault();
        Swal.fire({
            title: '¡Acción no permitida!',
            html: 'Digite su nombre completo.<br>Omita el uso de números.',
            icon: 'warning',
            confirmButtonText: 'Aceptar'
        });
    });

    username.addEventListener('copy', function (e) {
        e.preventDefault();
    });

    username.addEventListener('cut', function (e) {
        e.preventDefault();
    });
}

// Inicializar Quill con las opciones personalizadas
var quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
        toolbar: [['image'], ['link']] // Solo se permiten imágenes y enlaces 
        //toolbar: false // Solo se permiten imágenes y enlaces 
    },
    placeholder: 'Describe tu problema aquí y adjunta captura o id de tu anydesk... ',
});

// Iniciar la validación periódica al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    // NOTA: se quitó la llamada a validarHorarioPeriodicamente() — llamaba a
    // `${url}/api/index/horario`, endpoint que ya no existe en el backend
    // nuevo. Si en algún momento se necesita restringir el horario de
    // creación de tickets, habría que reimplementarlo contra un endpoint
    // real del backend actual.
    contadorCaracteres();

    // Endpoints nuevos: temas y dependencias viven en rutas y con formas
    // de respuesta distintas a las de antes, por eso ahora son dos
    // funciones dedicadas en vez de una sola genérica (ver más abajo).
    cargarTemas();
    cargarDependencias();
});

// ==========================
// Carga de Temas
// ==========================
// GET /system/tickets/topics -> { status, message, data: [{ topicId, name, priorityId, status }] }
// NOTA: la respuesta trae temas con status true Y false mezclados (no se
// filtra del lado del backend), por eso el filtro por "status === true"
// se hace acá, en el cliente.
function cargarTemas() {
    fetch(`${ticketsUrl}/system/tickets/topics`)
        .then(response => response.json())
        .then(result => {
            const temas = (result.data || [])
                .filter(item => item.status === true)
                .sort((a, b) => a.name.localeCompare(b.name));

            const select = document.getElementById('tema');
            select.innerHTML = '';

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Seleccione un tema';
            select.appendChild(defaultOption);

            temas.forEach(tema => {
                const opt = document.createElement('option');
                opt.value = tema.topicId;
                opt.textContent = tema.name;
                select.appendChild(opt);
            });
        })
        .catch(error => console.error('Error al obtener temas:', error));
}

// ==========================
// Carga de Dependencias
// ==========================
// GET /auth/dependency?code=AREAS -> { status, message, data: [{ dependency, name, ... }] }
// NOTA: este endpoint vive en /auth (no en /system/tickets), y el
// identificador real es "dependency" (viene como texto, ej. "102"),
// no un ID numérico como en el formulario viejo. Tampoco trae un campo
// de estado explícito: todo lo que devuelve para code=AREAS ya se
// asume habilitado para este formulario. El único filtro que importa
// es "code=TICKETS" (no depende de status/page/limit).
function cargarDependencias() {
    fetch(`${ticketsUrl}/auth/dependency?code=AREAS`)
        .then(response => response.json())
        .then(result => {
            const dependencias = (result.data || [])
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name));

            const select = document.getElementById('dependencia');
            select.innerHTML = '';

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Seleccione una dependencia';
            select.appendChild(defaultOption);

            dependencias.forEach(dep => {
                const opt = document.createElement('option');
                opt.value = dep.dependency;
                opt.textContent = dep.name;
                select.appendChild(opt);
            });
        })
        .catch(error => console.error('Error al obtener dependencias:', error));
}


function contadorCaracteres() {
    const editorContainer = document.querySelector('#editor');
    const textarea = document.querySelector('#rich-text');

    // Crear el contador de caracteres
    const counter = document.createElement('div');
    counter.id = 'character-counter';
    counter.style.textAlign = 'right';
    counter.style.marginTop = '5px';
    counter.textContent = `0/${MAX_CHARACTERS} caracteres`;

    // Insertar el contador después del editor
    editorContainer.parentNode.insertBefore(counter, editorContainer.nextSibling);

    // Escuchar cambios en el contenido del editor
    quill.on('text-change', function () {
        const text = quill.getText().trim(); // Obtener texto sin formato
        const currentLength = text.length;

        // Verificar si se ha alcanzado el límite de caracteres
        if (currentLength > MAX_CHARACTERS) {
            // Limitar el texto a MAX_CHARACTERS
            quill.root.innerHTML = quill.root.innerHTML.slice(0, MAX_CHARACTERS);
        }

        // Actualizar el contador de caracteres
        counter.textContent = `${currentLength}/${MAX_CHARACTERS} caracteres`;

        // Sincronizar con el textarea oculto
        textarea.value = quill.root.innerHTML; // Guardar contenido como HTML
    });
}

// Cuando el usuario selecciona un tema
// GET /system/tickets/subtopics?topicId={topicId} -> { status, message, data: [{ subtopicId, topicId, description, status }] }
document.getElementById('tema').addEventListener('change', async function () {
    const topicId = this.value;
    const subtemaContainer = document.getElementById('subtema-container');
    const subtemaSelect = document.getElementById('subtema');

    // Limpia el select de subtemas
    subtemaSelect.innerHTML = '<option value="">Selecciona un subtema</option>';

    if (topicId) {
        try {
            const response = await fetch(`${ticketsUrl}/system/tickets/subtopics?topicId=${topicId}`, {
                method: 'GET',
            });
            const result = await response.json();
            const subtemas = (result.data || []).filter(item => item.status === true);

            if (subtemas.length > 0) {
                subtemas.forEach(sub => {
                    const option = document.createElement('option');
                    option.value = sub.subtopicId;
                    option.textContent = sub.description;
                    subtemaSelect.appendChild(option);
                });
                subtemaContainer.style.display = '';
                subtemaSelect.disabled = false;
            } else {
                subtemaContainer.style.display = 'none';
                subtemaSelect.disabled = true;
            }
        } catch (error) {
            console.error('Error al cargar subtemas:', error);
            //subtemaContainer.style.display = 'none';
            subtemaSelect.disabled = false; // Deshabilitar el select si hay error
        }
    } else {
        //subtemaContainer.style.display = 'none';
        subtemaSelect.disabled = false;
    }
});

// Función para manejar la carga de archivos
function handleFileUpload(allowedTypes, callback) {
    const fileInput = document.createElement('input');
    fileInput.setAttribute('type', 'file');
    fileInput.setAttribute('accept', allowedTypes);
    fileInput.click();

    fileInput.onchange = function () {
        const file = fileInput.files[0];
        if (file) {
            callback(file);
        }
    };
}

// Agregar imágenes a la lista y vista previa
function addImageFile(file) {
    if (imageFiles.length >= MAX_IMAGES) {
        alert(`Solo puedes agregar hasta ${MAX_IMAGES} imágenes.`);
        return;
    }
    imageFiles.push(file);
    const reader = new FileReader();
    reader.onload = function (e) {
        displayPreviewImage(e.target.result, file.name);
    };
    reader.readAsDataURL(file);
}



// Mostrar imagen en la vista previa
function displayPreviewImage(imageSrc, imageName) {
    const previewContainer = document.getElementById('preview-files');
    previewContainer.insertAdjacentHTML('beforeend', `
        <div class="preview-item" data-name="${imageName}">
            <img src="${imageSrc}" alt="${imageName}" class="img-thumbnail" style="max-width: 100px; max-height: 100px;">
            <button class="btn-remove" onclick="removePreviewItem('image', '${imageName}')">X</button>
        </div>
    `);
}

// Mostrar archivo en la vista previa
function displayPreviewFile(file) {
    const previewContainer = document.getElementById('preview-files');
    previewContainer.insertAdjacentHTML('beforeend', `
        <div class="preview-item" data-name="${file.name}">
            <span class="badge bg-info text-light">${file.name}</span>
            <button class="btn-remove" onclick="removePreviewItem('file', '${file.name}')">X</button>
        </div>
    `);
}

// Eliminar elemento de la vista previa
function removePreviewItem(type, name) {
    const previewContainer = document.getElementById('preview-files');
    const itemToRemove = [...previewContainer.children].find(child => child.getAttribute('data-name') === name);
    if (itemToRemove) {
        previewContainer.removeChild(itemToRemove);
    }
    if (type === 'image') {
        imageFiles = imageFiles.filter(file => file.name !== name);
    } else if (type === 'file') {
        uploadedFiles = uploadedFiles.filter(file => file.name !== name);
    }
}

let lastRequestTime = 0; // Guarda la marca de tiempo del último envío

// Enviar el formulario
// POST /system/tickets -> body: email, userName, extension, dependencyId,
// dependencyName, topicId, topicName, subTopicId, subTopicName,
// description, desktop, images, files
// Respuesta: { status, message, data: { ticketId, user, details, status, createdDate } }
const form = document.getElementById('ticketForm');
form.onsubmit = function (e) {
    e.preventDefault();

    const currentTime = Date.now(); // Obtener tiempo actual en milisegundos
    if (currentTime - lastRequestTime < 60000) { // 60000 ms = 1 minuto
        Swal.fire({
            title: "¡Espera un momento!",
            text: "Debes esperar al menos 1 minuto entre envíos.",
            icon: "warning",
            confirmButtonText: "Aceptar"
        });
        return;
    }

    lastRequestTime = currentTime; // Actualizar tiempo del último envío

    const email = document.getElementById('email').value;
    const userName = document.getElementById('username').value;
    const extensionValue = document.getElementById('extension').value;

    const dependenciaSelect = document.getElementById('dependencia');
    const temaSelect = document.getElementById('tema');
    const subtemaSelect = document.getElementById('subtema');

    const dependencyId = dependenciaSelect.value;
    const topicId = temaSelect.value;
    const subTopicId = subtemaSelect.value;

    // Nombre visible de cada select (no solo el ID) — el backend ahora
    // también exige dependencyName/topicName/subTopicName en el payload.
    const dependencyName = dependenciaSelect.options[dependenciaSelect.selectedIndex]?.text || '';
    const topicName = temaSelect.options[temaSelect.selectedIndex]?.text || '';
    const subTopicName = subtemaSelect.options[subtemaSelect.selectedIndex]?.text || '';

    const cleanedDescripcion = quill.getText().trim();

    // TODO: no hay una fuente confiable para este dato desde el navegador
    // (el backend espera un identificador del equipo, ej. "108AIOHP").
    // Se envía vacío por ahora; si el backend lo completa solo o hay otra
    // forma de obtenerlo, ajustar aquí.
    const desktop = '';

    const formData = new FormData();
    formData.set('email', email);
    formData.set('userName', userName);
    formData.set('extension', extensionValue);

    formData.set('dependencyId', dependencyId);
    formData.set('dependencyName', dependencyName);

    formData.set('topicId', topicId);
    formData.set('topicName', topicName);

    if (subTopicId) {
        formData.set('subTopicId', subTopicId);
        formData.set('subTopicName', subTopicName);
    }

    formData.set('description', cleanedDescripcion);
    formData.set('desktop', desktop);

    imageFiles.forEach(file => formData.append('images', file));
    uploadedFiles.forEach(file => formData.append('files', file));

    fetch(`${ticketsUrl}/system/tickets`, { method: 'POST', body: formData })
        .then(response => {
            if (response.status === 429) {
                throw new Error("Demasiadas solicitudes. Intenta nuevamente en un minuto.");
            }
            return response.json().then(result => ({ ok: response.ok, result }));
        })
        .then(({ ok, result }) => {
            if (ok && result.message) {
                Swal.fire({
                    title: "¡Éxito!",
                    text: result.message,
                    icon: "success",
                    confirmButtonText: "Aceptar"
                }).then(() => {
                    window.location.href = '/tickets/nuevoticket';
                });
            } else {
                Swal.fire({
                    title: "Error",
                    text: result.message || "Hubo un problema al crear el ticket",
                    icon: "error",
                    confirmButtonText: "Intentar nuevamente"
                });
            }
        })
        .catch(error => {
            if (error.message.includes("Demasiadas solicitudes")) {
                Swal.fire({
                    title: "¡Espera un momento!",
                    text: error.message,
                    icon: "warning",
                    confirmButtonText: "Aceptar"
                });
            } else {
                console.error('Error al enviar el formulario:', error);
            }
        });
};

// Escuchar el evento de pegar
quill.root.addEventListener('paste', function (e) {
    const clipboard = e.clipboardData || window.clipboardData;
    const items = clipboard.items;

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault(); // Evitar pegar directamente en el editor

            if (imageFiles.length >= MAX_IMAGES) {
                // Mostrar alerta con SweetAlert
                Swal.fire({
                    title: '¡Límite alcanzado!',
                    text: `Solo puedes cargar hasta ${MAX_FILES} imagenes.`,
                    icon: 'warning',
                    confirmButtonText: 'Aceptar'
                });
                return;
            }

            const file = items[i].getAsFile();
            addImageFile(file);
        }
    }
});

// Manejador para imágenes desde el toolbar
quill.getModule('toolbar').addHandler('image', function () {
    if (imageFiles.length >= MAX_IMAGES) {
        Swal.fire({
            title: '¡Límite alcanzado!',
            text: `Solo puedes cargar hasta ${MAX_IMAGES} imágenes.`,
            icon: 'warning',
            confirmButtonText: 'Aceptar'
        });
        return;
    }
    handleFileUpload('image/*', function (file) {
        addImageFile(file);
    });
});

// Manejador para archivos (solo permitir tipos específicos)
quill.getModule('toolbar').addHandler('link', function () {
    if (uploadedFiles.length >= MAX_FILES) {
        Swal.fire({
            title: '¡Límite alcanzado!',
            text: `Solo puedes cargar hasta ${MAX_FILES} archivos.`,
            icon: 'warning',
            confirmButtonText: 'Aceptar'
        });
        return;
    }
    handleFileUpload('application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain', function (file) {
        uploadedFiles.push(file);
        displayPreviewFile(file);
    });
});