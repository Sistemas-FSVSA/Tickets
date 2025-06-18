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
        const imageUrl = `${url}/${mod.url.replace(/\\/g, '/')}`;

        const card = document.createElement("div");
        card.classList.add("col");

        card.innerHTML = `
            <div class="card">
                <img data-src="${imageUrl}" class="card-img-top lazy" alt="${mod.nombre}">
                <div class="card-body">
                    <p class="card-text">${mod.nombre} - ${mod.fecha}</p>
                    <div class="button-group">
                        <button class="btn btn-fsvsaon abrir-btn" data-url="${imageUrl}"><i class="far fa-eye mr-1"></i>Abrir</button>
                        <button class="btn btn-fsvsaoff imprimir-btn" data-url="${imageUrl}"><i class="fas fa-print mr-1"></i>Imprimir</button>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(card);
    });

    // Agregar eventos a los botones después de renderizar
    document.querySelectorAll('.abrir-btn').forEach(button => {
        button.addEventListener('click', () => {
            abrirImagenGrande(button.getAttribute('data-url'));
        });
    });

    document.querySelectorAll('.imprimir-btn').forEach(button => {
        button.addEventListener('click', () => {
            imprimirImagen(button.getAttribute('data-url'));
        });
    });

    // Aplicar lazy loading
    aplicarLazyLoading();
}

// Función para abrir la imagen en grande con un fondo oscuro y una X para cerrar
function abrirImagenGrande(imagenUrl) {
    // Crear el contenedor de la imagen con el fondo oscuro
    const imageViewer = document.createElement('div');
    imageViewer.id = 'imageViewer';
    imageViewer.style.position = 'fixed';
    imageViewer.style.top = '0';
    imageViewer.style.left = '0';
    imageViewer.style.width = '100%';
    imageViewer.style.height = '100%';
    imageViewer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    imageViewer.style.display = 'flex';
    imageViewer.style.alignItems = 'center';
    imageViewer.style.justifyContent = 'center';
    imageViewer.style.zIndex = '9999';
    imageViewer.style.cursor = 'pointer';

    // Crear la imagen a tamaño grande
    const imgElement = document.createElement('img');
    imgElement.src = imagenUrl;
    imgElement.style.maxWidth = '90%';
    imgElement.style.maxHeight = '90%';
    imgElement.style.objectFit = 'contain';

    // Crear la X para cerrar
    const closeButton = document.createElement('div');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '20px';
    closeButton.style.fontSize = '40px';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontWeight = 'bold';

    // Agregar la imagen y la X al contenedor
    imageViewer.appendChild(imgElement);
    imageViewer.appendChild(closeButton);

    // Agregar el contenedor al cuerpo del documento
    document.body.appendChild(imageViewer);

    // Evento para cerrar la imagen cuando se hace clic en la X
    closeButton.addEventListener('click', () => {
        if (document.body.contains(imageViewer)) {
            document.body.removeChild(imageViewer);
        }
    });

    // También cerramos la imagen cuando se haga clic en cualquier parte del fondo oscuro
    imageViewer.addEventListener('click', () => {
        document.body.removeChild(imageViewer);
    });
}

function imprimirImagen(imagenUrl) {
    const ventanaImpresion = window.open("", "_blank");

    ventanaImpresion.document.write(`
        <html>
        <head>
            <title>Imprimir Imagen</title>
            <style>
                @media print {
                    body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
                    img { max-width: 100%; max-height: 100vh; }
                }
            </style>
        </head>
        <body>
            <img src="${imagenUrl}">
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(() => window.close(), 500);
                }
            </script>
        </body>
        </html>
    `);

    ventanaImpresion.document.close();
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