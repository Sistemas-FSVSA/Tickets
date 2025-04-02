// Evento para cargar datos solo cuando se abre el modal
$(document).on("shown.bs.modal", "#nuevoEquipoModal", async function () {
    if (!datosFormularioCargados) {
        await obtenerDatosParaFormulario();
        mostrarDatosEnFormulario();
        datosFormularioCargados = true; // Marcar como cargados
    }
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

// Mostrar las imágenes en el formulario
// Evitar doble declaración de variables globales
// Obtener referencias solo si aún no existen en window
if (!window.inputImagen1) {
    window.inputImagen1 = document.getElementById("imagen1");
    window.inputImagen2 = document.getElementById("imagen2");
}

if (!window.preview1) {
    window.preview1 = document.getElementById("preview1");
    window.preview2 = document.getElementById("preview2");
}

// Función para mostrar la vista previa de las imágenes
function mostrarVistaPrevia(input, preview) {
    if (!input || !preview) {
        console.error("❌ Error: Elementos de imagen no encontrados.");
        return;
    }

    const archivo = input.files[0];
    if (archivo) {
        const lector = new FileReader();
        lector.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = "block";
        };
        lector.readAsDataURL(archivo);
    } else {
        preview.src = "";
        preview.style.display = "none";
    }
}

// Asegurar que los eventos solo se asignen si los elementos existen
if (window.inputImagen1 && window.preview1) {
    window.inputImagen1.addEventListener("change", function () {
        mostrarVistaPrevia(window.inputImagen1, window.preview1);
    });
}

if (window.inputImagen2 && window.preview2) {
    window.inputImagen2.addEventListener("change", function () {
        mostrarVistaPrevia(window.inputImagen2, window.preview2);
    });
}

if (!window.modal) {
    window.modal = document.getElementById("subirImagenesModal");
    window.guardarImagenesBtn = document.getElementById("guardarImagenesBtn");
}

// Función para mostrar la vista previa de las imágenes
function mostrarVistaPrevia(input, preview) {
    const archivo = input.files[0];
    if (archivo) {
        const lector = new FileReader();
        lector.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = "block";
        };
        lector.readAsDataURL(archivo);
    } else {
        preview.src = "";
        preview.style.display = "none";
    }
}

// Eventos para mostrar la vista previa al seleccionar imágenes
inputImagen1.addEventListener("change", function () {
    mostrarVistaPrevia(inputImagen1, preview1);
});

inputImagen2.addEventListener("change", function () {
    mostrarVistaPrevia(inputImagen2, preview2);
});

// Función para limpiar imágenes al cerrar el modal (solo si no se han guardado)
function limpiarImagenes() {
    if (!imagenesGuardadas) {
        inputImagen1.value = "";
        inputImagen2.value = "";
        preview1.src = "";
        preview1.style.display = "none";
        preview2.src = "";
        preview2.style.display = "none";
    }
}

// Asegurar que el evento se ejecuta en todos los cierres del modal
$(modal).on("hidden.bs.modal", function () {
    limpiarImagenes();
});

// Evento para guardar las imágenes seleccionadas
guardarImagenesBtn.addEventListener("click", function () {
    const formData = new FormData();

    if (inputImagen1.files.length) {
        formData.append("imagen1", inputImagen1.files[0]);
    }
    if (inputImagen2.files.length) {
        formData.append("imagen2", inputImagen2.files[0]);
    }

    // Marcar imágenes como guardadas para que no se borren al cerrar el modal
    imagenesGuardadas = true;

    // Opcional: Cerrar el modal después de guardar
    $('#subirImagenesModal').modal('hide');
});

// Reiniciar la variable cuando se abre el modal
$(modal).on("shown.bs.modal", function () {
    imagenesGuardadas = false; // Si el usuario vuelve a abrir, debe volver a guardar
});

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

    if (inputImagen1.files.length) {
        formData.append("archivos[]", inputImagen1.files[0]);
    }
    if (inputImagen2.files.length) {
        formData.append("archivos[]", inputImagen2.files[0]);
    }

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
