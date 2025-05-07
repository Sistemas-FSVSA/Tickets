// Evento para cargar datos solo cuando se abre el modal
$(document).on("shown.bs.modal", "#nuevoEquipoModal", async function () {
    if (!datosFormularioCargados) {
        await obtenerDatosParaFormulario();
        mostrarDatosEnFormulario();
        datosFormularioCargados = true; // Marcar como cargados
    }
});

$(document).on('click', '#abrirModalEquipo', function () {
    $('#nuevoEquipoModal').modal('show');
});

// Función para obtener datos del servidor (Inventario)
async function obtenerDatosParaFormulario() {
    try {
        const response = await fetch(`${url}/api/inventario/obtenerDatos`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (response.ok) {
            datosCargados = await response.json(); // Guardar datos en la variable global
        } else {
            console.error("⚠️ Error al obtener los datos del inventario");
            alert("Error al obtener los datos");
        }
    } catch (error) {
        console.error("⚠️ Error de conexión con el servidor:", error);
        alert("Error de conexión con el servidor");
    }
}

// Función para mostrar los datos en el formulario (sin volver a hacer la petición)
function mostrarDatosEnFormulario() {
    if (!datosCargados) {
        console.error("⚠️ Los datos no están disponibles aún.");
        return;
    }

    function llenarSelect(selectId, datos, claveId, claveNombre) {
        const select = document.getElementById(selectId);
        if (!select) {
            console.warn(`⚠️ El elemento con ID '${selectId}' no existe en el DOM.`);
            return;
        }

        if (select.tagName !== "SELECT") {
            console.error(`⚠️ El elemento con ID ${selectId} no es un <select>, es un ${select.tagName}`);
            return;
        }

        select.innerHTML = '<option value="">Seleccionar</option>'; // Opción predeterminada

        if (!Array.isArray(datos)) {
            console.error(`⚠️ Los datos para ${selectId} no son un array:`, datos);
            return;
        }

        const datosFiltrados = datos.filter(item => item.estado === true);

        datosFiltrados.forEach(item => {
            const option = document.createElement("option");
            option.value = item[claveId];
            option.textContent = item[claveNombre];
            select.appendChild(option);
        });
    }

    if (datosCargados.dependencia) llenarSelect('dependenciaequipo', datosCargados.dependencia, 'iddependencia', 'nombre');
    if (datosCargados.marca) llenarSelect('marcaequipo', datosCargados.marca, 'idmarca', 'marca');
    if (datosCargados.formato) llenarSelect('formatoequipo', datosCargados.formato, 'idformato', 'formato');
    if (datosCargados.ram) llenarSelect('tiporam', datosCargados.ram, 'idram', 'ram');
    if (datosCargados.almacenamiento) llenarSelect('tipoalmacenamiento', datosCargados.almacenamiento, 'idalmacenamiento', 'almacenamiento');

    // Capturar `data.sn`, sumarle 1 y colocarlo en un input
    if (datosCargados.ultimoSn !== undefined && !isNaN(datosCargados.ultimoSn)) {
        const snInput = document.getElementById("sn");
        if (snInput) {
            snInput.value = parseInt(datosCargados.ultimoSn) + 1;
        } else {
            console.warn("⚠️ El campo de entrada con ID 'sn' no existe en el DOM.");
        }
    } else {
        console.warn("⚠️ El valor de 'ultimoSn' en data no es válido:", datosCargados.ultimoSn);
    }
}

// Evento para resetear la variable al cerrar el modal
$(document).on("hidden.bs.modal", "#nuevoEquipoModal", function () {
    datosFormularioCargados = false; // Permitir recarga cuando se vuelva a abrir
});

if (!window.inputImagen1) {
    window.inputImagen1 = document.getElementById("imagen1");
}
if (!window.inputImagen2) {
    window.inputImagen2 = document.getElementById("imagen2");
}
if (!window.preview1) {
    window.preview1 = document.getElementById("preview1");
}
if (!window.preview2) {
    window.preview2 = document.getElementById("preview2");
}

if (!inputImagen1 || !inputImagen2 || !preview1 || !preview2) {
    console.error("❌ Error: No se encontraron los elementos necesarios para la vista previa.");
}

function inicializarElementosImagen() {
    // Buscar elementos cada vez que se abre el modal para asegurar que existen en el DOM
    window.inputImagen1 = document.getElementById("imagen1");
    window.inputImagen2 = document.getElementById("imagen2");
    window.preview1 = document.getElementById("preview1");
    window.preview2 = document.getElementById("preview2");

    if (!inputImagen1 || !inputImagen2 || !preview1 || !preview2) {
        console.error("Elementos de imagen no encontrados en el DOM");
        return false;
    }
    return true;
}

// Función para mostrar la vista previa de las imágenes
function mostrarVistaPrevia(input, preview) {
    if (!input || !preview) {
        console.error("❌ Error: Elementos de imagen no encontrados.");
        return;
    }

    const archivo = input.files[0]; // Obtener el archivo seleccionado
    if (archivo) {
        const lector = new FileReader(); // Crear un lector de archivos
        lector.onload = function (e) {
            preview.src = e.target.result; // Asignar la imagen al elemento `img`
            preview.style.display = "block"; // Mostrar el elemento `img`
        };
        lector.readAsDataURL(archivo); // Leer el archivo como una URL de datos
    } else {
        preview.src = ""; // Limpiar la vista previa si no hay archivo
        preview.style.display = "none"; // Ocultar el elemento `img`
    }
}

// Asegurar que los eventos solo se asignen si los elementos existen
function configurarEventosImagenes() {
    if (!inicializarElementosImagen());

    // Asignar eventos a los inputs de archivo
    inputImagen1.addEventListener("change", function () {
        mostrarVistaPrevia(inputImagen1, preview1);
    });

    inputImagen2.addEventListener("change", function () {
        mostrarVistaPrevia(inputImagen2, preview2);
    });
}

// Llama a esta función al abrir el modal
$("#subirImagenesModal").on("shown.bs.modal", function () {
    configurarEventosImagenes();
});

function actualizarVistaPrevia(preview, input = null, imagenUrl = null) {
    if (input && input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = "block";
        };
        reader.readAsDataURL(input.files[0]);
    } else if (imagenUrl) {
        preview.src = `${url}${imagenUrl}`;
        preview.style.display = "block";
    } else {
        preview.src = "";
        preview.style.display = "none";
    }
}

// Función para cargar imágenes existentes
function cargarImagenesExistentes(imagenes) {
    limpiarImagenesFormulario(); // Limpia cualquier imagen previa

    if (!imagenes || !Array.isArray(imagenes)) return;

    imagenesExistentes = [...imagenes]; // Copiar el array

    actualizarVistaPrevia(preview1, null, imagenesExistentes[0]);
    actualizarVistaPrevia(preview2, null, imagenesExistentes[1]);
}

// Función para limpiar las imágenes del formulario
function limpiarImagenesFormulario() {
    if (preview1) {
        preview1.src = "";
        preview1.style.display = "none";
    }
    if (preview2) {
        preview2.src = "";
        preview2.style.display = "none";
    }
    if (inputImagen1) inputImagen1.value = "";
    if (inputImagen2) inputImagen2.value = "";
    imagenesGuardadas = []; // Limpia las imágenes guardadas
    imagenesExistentes = []; // Limpia las imágenes existentes
}

// Evento para guardar las imágenes seleccionadas
function manejarGuardarImagenes(event) {
    event.preventDefault();
    imagenesGuardadas = true;
    $('#subirImagenesModal').modal('hide');
}

// Esta línea enlaza el botón con el evento
document.getElementById("guardarImagenesBtn").addEventListener("click", manejarGuardarImagenes);

// Evento para limpiar imágenes después de un registro exitoso
document.getElementById("guardarEquipoBtn").addEventListener("click", function (event) {
    let form = document.getElementById("nuevoEquipoForm");

    // Validar el formulario
    if (form.checkValidity() === false) {
        event.preventDefault();
        event.stopPropagation();
    } else {
        enviarEquipo(); // Llamar a la función de envío si es válido
    }

    form.classList.add("was-validated"); // Agregar clase de Bootstrap para resaltar errores
});

$("#subirImagenesModal").on("shown.bs.modal", function () {
    limpiarImagenesFormulario(); // Limpia las imágenes previas
    configurarEventosImagenes(); // Configura los eventos de los inputs de imágenes
    imagenesGuardadas = false;
    if (imagenesExistentes.length > 0) {
        cargarImagenesExistentes(imagenesExistentes);
    }
});

$("#subirImagenesModal").on("hidden.bs.modal", function () {
    if (!imagenesGuardadas) {
        limpiarImagenesFormulario();
    }
});

// Evento para limpiar los inputs de imágenes después de un registro exitoso
$("#nuevoEquipoModal").on("hidden.bs.modal", function () {
    limpiarImagenesFormulario(); // Limpia las imágenes al cerrar el modal principal
});

async function procesarImagen(input, imagenExistente, formData, nombreArchivo) {
    if (input.files.length > 0) {
        formData.append("archivos[]", input.files[0]);
    } else if (imagenExistente) {
        const response = await fetch(`${url}${imagenExistente}`);
        const blob = await response.blob();
        formData.append("archivos[]", blob, nombreArchivo);
    } else {
        formData.append("archivos[]", new Blob([]), nombreArchivo);
    }
}

async function enviarEquipo() {
    const formData = new FormData();

    // Obtener valores de los inputs y agregarlos a FormData
    const equipoData = [
        "sn", "ip", "mac", "datos", "procesador", "tiporam", "cantidadram",
        "tipoalmacenamiento", "cantidadalmacenamiento", "formatoequipo", "marcaequipo",
        "so", "nombreequipo", "sistemas", "dependenciaequipo", "responsable", "usuario",
        "cargousuario", "mantenimiento", "observaciones"
    ];

    equipoData.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            formData.append(id, input.value);
        }
    });

    // Agregar el idusuario (suponiendo que lo tienes en localStorage o sessionStorage)
    const idusuario = localStorage.getItem("idusuario");
    if (idusuario) {
        formData.append("idusuario", idusuario);
    } else {
        console.error("ID de usuario no encontrado.");
        alert("No se encontró el ID del usuario.");
        return;
    }

    // Uso en enviarEquipo
    await procesarImagen(inputImagen1, imagenesExistentes[0], formData, "imagen1.jpg");
    await procesarImagen(inputImagen2, imagenesExistentes[1], formData, "imagen2.jpg");

    try {
        const response = await fetch(`${url}/api/inventario/guardarEquipo`, {
            method: "POST",
            body: formData,
            credentials: "include"
        });

        if (response.ok) {
            // Mostrar alerta de éxito
            Swal.fire({
                icon: "success",
                title: "Registro exitoso",
                text: "El equipo ha sido registrado correctamente",
                timer: 2000,  // Cierra la alerta después de 2 segundos
                showConfirmButton: false
            });

            // Cerrar el modal
            $("#nuevoEquipoModal").modal("hide");

            // Opcional: limpiar los campos del formulario después del registro
            const formulario = document.getElementById("nuevoEquipoForm");
            if (formulario) {
                formulario.reset();
                formulario.classList.remove("was-validated"); // Resetear validación
            }
            limpiarImagenesFormulario(); // Limpiar imágenes

        } else {
            const errorText = await response.text();
            console.error("Error en el servidor:", errorText);
            alert(`Error al guardar el equipo: ${errorText}`);
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert("Error de conexión con el servidor");
    }
}