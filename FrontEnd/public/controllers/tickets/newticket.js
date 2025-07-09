// --- Autenticación y Permisos ---
const url = window.env.API_URL;

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
    validarHorarioPeriodicamente();
    contadorCaracteres()

    fetchOptions(`${url}/api/tickets/obtenerDependencias`, 'dependencia', 'dependencias');
    fetchOptions(`${url}/api/tickets/obtenerTemas`, 'tema', 'temas');
});




// Validar horario periódicamente
function validarHorarioPeriodicamente() {
    setInterval(async () => {
        const ahora = new Date(); // Declarar correctamente la fecha actual
        const fechaLocalISO = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000).toISOString();

        try {
            const response = await fetch(`${url}/api/index/horario`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fechaHora: fechaLocalISO }),
                credentials: "include",
            });

            const data = await response.json();

            if (data.estado !== "true") {
                Swal.fire({
                    title: "Horario no disponible",
                    text: "El horario permitido ha finalizado. Serás redirigido al inicio.",
                    icon: "warning",
                    confirmButtonText: "Aceptar",
                }).then(() => {
                    window.location.href = "/";
                });
            }
        } catch (error) {
            console.error("Error al validar horario:", error);
        }
    }, 60000); // Validar cada 60 segundos
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
document.getElementById('tema').addEventListener('change', async function() {
    const temaId = this.value;
    const subtemaContainer = document.getElementById('subtema-container');
    const subtemaSelect = document.getElementById('subtema');

    // Limpia el select de subtemas
    subtemaSelect.innerHTML = '<option value="">Selecciona un subtema</option>';

    if (temaId) {
        try {
            const response = await fetch(`${url}/api/tickets/obtenerSubtemas?idtema=${temaId}`, {
                method: 'GET',
            });
            const data = await response.json();

            if (data.subtemas && data.subtemas.length > 0) {
                data.subtemas.forEach(sub => {
                    const option = document.createElement('option');
                    option.value = sub.idsubtema;
                    option.textContent = sub.descripcion;
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

    const dependenciaId = document.getElementById('dependencia').value;
    const temaId = document.getElementById('tema').value;
    const dependenciaNombre = document.getElementById('dependencia').options[document.getElementById('dependencia').selectedIndex].text;
    const temaNombre = document.getElementById('tema').options[document.getElementById('tema').selectedIndex].text;
    const subtemaId = document.getElementById('subtema').value;

    const cleanedDescripcion = quill.getText().trim();

    const formData = new FormData(form);
    formData.set('dependencia', dependenciaId);
    formData.set('tema', temaId);
    formData.set('subtema', subtemaId);
    formData.set('descripcion', cleanedDescripcion);
    formData.set('dependenciaNombre', dependenciaNombre);
    formData.set('temaNombre', temaNombre);

    imageFiles.forEach(file => formData.append('images[]', file));
    uploadedFiles.forEach(file => formData.append('files[]', file));

    fetch(`${url}/api/tickets/guardarTickets`, { method: 'POST', body: formData })
        .then(response => {
            if (response.status === 429) {
                throw new Error("Demasiadas solicitudes. Intenta nuevamente en un minuto.");
            }
            return response.json();
        })
        .then(result => {
            if (result.message) {
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
                    text: result.mensaje || "Hubo un problema al crear el ticket",
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


// Utilidades de fetch y validación
function fetchOptions(url, selectId, keyName) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Filtrar los elementos con estado true
            const options = data[keyName]
                .filter(item => item.estado === true)
                .sort((a, b) => a.nombre.localeCompare(b.nombre)); // Ordenar alfabéticamente por nombre

            const select = document.getElementById(selectId);

            select.innerHTML = '';
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = `Seleccione una ${selectId === 'dependencia' ? 'dependencia' : 'tema'}`;
            select.appendChild(defaultOption);

            // Añadir las opciones ordenadas al <select>
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.iddependencia || option.idtema;
                opt.textContent = option.nombre;
                select.appendChild(opt);
            });
        })
        .catch(error => console.error(`Error al obtener ${keyName}:`, error));
}

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

