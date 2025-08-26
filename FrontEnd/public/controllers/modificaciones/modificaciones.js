document.addEventListener('DOMContentLoaded', () => {
    InicializarModificaciones();
});

async function InicializarModificaciones() {
    InicializarBusqueda(); // Nueva función para búsqueda en tiempo real
    document.getElementById('abrirModalBtn').addEventListener('click', function () {
        $('#guardarModificaciones').modal('show');
    });

    document.getElementById("archivos").addEventListener("change", function (event) {
        let listaArchivos = document.getElementById("listaArchivos");
        listaArchivos.innerHTML = ""; // Limpiar la lista antes de agregar nuevos archivos

        const archivosValidos = Array.from(event.target.files).filter(archivo =>
            archivo.type.startsWith("image/") || archivo.type === "application/pdf"
        );

        if (archivosValidos.length === 0) {
            Swal.fire("Error", "Solo se permiten imágenes y archivos PDF.", "error");
            event.target.value = ""; // Limpiar el input para evitar carga de archivos no permitidos
            return;
        }

        archivosValidos.forEach(archivo => {
            let li = document.createElement("li");
            li.textContent = archivo.name;
            li.classList.add("list-group-item");
            listaArchivos.appendChild(li);
        });
    });

    // Evento para limpiar el modal cuando se cierre
    $('#guardarModificaciones').on('hidden.bs.modal', function () {
        limpiarModal();
    });

    // También limpiamos cuando el usuario haga clic en "Cerrar"
    document.getElementById('cerrarBtn').addEventListener('click', function () {
        limpiarModal();
    });

    // Evento para capturar y enviar los datos al hacer clic en "Subir"
    document.getElementById('subirBtn').addEventListener('click', async function () {
        await enviarDatos();
    });

}

// Función para limpiar los campos del modal
function limpiarModal() {
    document.getElementById("subirArchivosForm").reset(); // Restablecer formulario
    document.getElementById("listaArchivos").innerHTML = ""; // Vaciar la lista de archivos
}

// Función para capturar la fecha, archivos y enviar a la API
async function enviarDatos() {
    let mesAnio = document.getElementById("mesAnio").value;
    let archivosInput = document.getElementById("archivos");
    let archivos = archivosInput.files;

    // Validaciones antes de enviar
    if (!mesAnio) {
        alert("Por favor, selecciona un mes y un año.");
        return;
    }

    if (archivos.length === 0) {
        alert("Por favor, adjunta al menos un archivo.");
        return;
    }

    if (archivos.length > 100) {
        alert("Solo puedes subir un máximo de 100 archivos.");
        return;
    }

    let totalSize = 0;
    for (let archivo of archivos) {
        totalSize += archivo.size;
    }

    if (totalSize > 10 * 1024 * 1024 * 1024) { // 10GB en bytes
        alert("El tamaño total de los archivos no puede superar los 10GB.");
        return;
    }

    let formData = new FormData();
    formData.append("mesAnio", mesAnio);

    for (let archivo of archivos) {
        formData.append("archivos[]", archivo);
    }

    try {
        showSpinner(); // Mostrar spinner

        let response = await fetch(`${url}/api/modificaciones/guardarModificaciones`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error("Error en la subida de archivos");

        let result = await response.json();
        alert(`Archivos subidos con éxito: ${result.message}`);

        // Cerrar y limpiar el modal después de la subida exitosa
        $('#guardarModificaciones').modal('hide');
        archivosInput.value = ""; // Limpiar el input de archivos
    } catch (error) {
        alert("Error al subir archivos.");
    } finally {
        hideSpinner(); // Ocultar spinner al finalizar
    }
}

function InicializarBusqueda() {
    const searchInput = document.getElementById("searchInput");

    searchInput.addEventListener("input", async function () {
        const query = searchInput.value.trim();

        if (query.length === 0) {
            renderizarResultados([]); // Si el input está vacío, limpia los resultados
            return;
        }

        try {
            const response = await fetch(`${url}/api/modificaciones/obtenerModificaciones?query=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error("Error en la búsqueda");

            const data = await response.json();
            renderizarResultados(data);
        } catch (error) {
            console.error("Error al obtener modificaciones:", error);
        }
    });
}

function renderizarResultados(resultados) {
    const container = document.getElementById("cards-container");
    container.innerHTML = ""; // Limpiar contenido antes de renderizar

    if (resultados.length === 0) {
        container.innerHTML = `<p class="text-muted text-center w-100">No se encontraron resultados.</p>`;
        return;
    }

    resultados.forEach(mod => {
        const fileUrl = `${url}/${mod.url.replace(/\\/g, '/')}`;
        const extension = mod.url.split('.').pop().toLowerCase();

        const card = document.createElement("div");
        card.classList.add("col");

        let previewContent = "";

        if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
            // Previsualización de imágenes
            previewContent = `<img data-src="${fileUrl}" class="card-img-top lazy" alt="${mod.nombre}">`;
        } else if (extension === "pdf") {
            // Previsualización de PDFs
            previewContent = `
                <embed src="${fileUrl}#toolbar=0&navpanes=0&scrollbar=0" 
                       type="application/pdf" 
                       class="card-img-top" 
                       style="height: 200px; object-fit: contain;">
            `;
        } else {
            previewContent = `<p class="text-center p-3">Formato no soportado</p>`;
        }

        card.innerHTML = `
            <div class="card">
                ${previewContent}
                <div class="card-body">
                    <p class="card-text">${mod.nombre} - ${mod.fecha}</p>
                    <div class="button-group">
                        <button class="btn btn-fsvsaon abrir-btn" data-url="${fileUrl}" data-ext="${extension}"><i class="far fa-eye mr-1"></i>Abrir</button>
                        <button class="btn btn-fsvsaoff imprimir-btn" data-url="${fileUrl}" data-ext="${extension}"><i class="fas fa-print mr-1"></i>Imprimir</button>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(card);
    });

    // Agregar eventos a los botones después de renderizar
    document.querySelectorAll('.abrir-btn').forEach(button => {
        button.addEventListener('click', () => {
            abrirArchivo(button.getAttribute('data-url'), button.getAttribute('data-ext'));
        });
    });

    document.querySelectorAll('.imprimir-btn').forEach(button => {
        button.addEventListener('click', () => {
            imprimirArchivo(button.getAttribute('data-url'), button.getAttribute('data-ext'));
        });
    });

    // Aplicar lazy loading
    aplicarLazyLoading();
}

function abrirArchivo(fileUrl, extension) {
    const viewer = document.createElement('div');
    viewer.id = 'fileViewer';
    viewer.style.position = 'fixed';
    viewer.style.top = '0';
    viewer.style.left = '0';
    viewer.style.width = '100%';
    viewer.style.height = '100%';
    viewer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    viewer.style.display = 'flex';
    viewer.style.alignItems = 'center';
    viewer.style.justifyContent = 'center';
    viewer.style.zIndex = '9999';

    let content;
    if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
        content = document.createElement('img');
        content.src = fileUrl;
        content.style.maxWidth = '90%';
        content.style.maxHeight = '90%';
    } else if (extension === "pdf") {
        content = document.createElement('embed');
        content.src = fileUrl;
        content.type = "application/pdf";
        content.style.width = '80%';
        content.style.height = '90%';
    }

    // Botón cerrar
    const closeButton = document.createElement('div');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '20px';
    closeButton.style.fontSize = '40px';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';

    viewer.appendChild(content);
    viewer.appendChild(closeButton);
    document.body.appendChild(viewer);

    closeButton.addEventListener('click', () => {
        viewer.remove();
    });

    viewer.addEventListener('click', (e) => {
        if (e.target === viewer) viewer.remove();
    });
}

function imprimirArchivo(fileUrl, extension) {
    const ventanaImpresion = window.open(fileUrl, "_blank");
    ventanaImpresion.onload = () => {
        ventanaImpresion.print();
    };
}

function aplicarLazyLoading() {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src');
                img.removeAttribute('data-src'); // Eliminar el atributo después de cargar
                observer.unobserve(img); // Dejar de observar esta imagen
            }
        });
    });

    document.querySelectorAll(".lazy").forEach(img => observer.observe(img));
}