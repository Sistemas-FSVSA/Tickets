document.addEventListener("DOMContentLoaded", function () {
    obtenerDatosParaFormulario();
    cargarDatosEnFormulario();
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
            const data = await response.json();
            cargarDatosEnFormulario(data);
        } else {
            console.error("Error al obtener los datos del inventario");
            alert("Error al obtener los datos");
        }
    } catch (error) {
        console.error("Error de conexión con el servidor:", error);
        alert("Error de conexión con el servidor");
    }
}

// Función para cargar los datos en los <select> del formulario (solo registros con estado true)
function cargarDatosEnFormulario(data) {
    function llenarSelect(selectId, datos, claveId, claveNombre) {
        const select = document.getElementById(selectId);
        if (!select) {
            console.error(`No se encontró el select con ID: ${selectId}`);
            return;
        }
    
        // Verificar que realmente es un <select>
        if (select.tagName !== "SELECT") {
            console.error(`El elemento con ID ${selectId} no es un <select>, es un ${select.tagName}`);
            return;
        }
    
        select.innerHTML = '<option value="">Seleccionar</option>'; // Opción predeterminada
    
        // Filtrar los registros que tienen estado true
        const datosFiltrados = datos.filter(item => item.estado === true);
    
        datosFiltrados.forEach(item => {
            const option = document.createElement("option");
            option.value = item[claveId];
            option.textContent = item[claveNombre];
            select.appendChild(option);
        });
    }    

    if (data.dependencia) llenarSelect('dependencia', data.dependencia, 'iddependencia', 'nombre');
    if (data.marca) llenarSelect('marca', data.marca, 'idmarca', 'marca');
    if (data.formato) llenarSelect('formatoequipo', data.formato, 'idformato', 'formato');
    if (data.ram) llenarSelect('tiporam', data.ram, 'idram', 'ram');
    if (data.almacenamiento) llenarSelect('tipoalmacenamiento', data.almacenamiento, 'idalmacenamiento', 'almacenamiento');
}

// Mostrar las imágenes en el formulario
const inputImagen1 = document.getElementById("imagen1");
const inputImagen2 = document.getElementById("imagen2");
const preview1 = document.getElementById("preview1");
const preview2 = document.getElementById("preview2");
const modal = document.getElementById("subirImagenesModal");
const guardarImagenesBtn = document.getElementById("guardarImagenesBtn");

// Variable para controlar si las imágenes fueron guardadas
let imagenesGuardadas = false;

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

    // Simulación de envío al servidor (puedes usar fetch aquí)
    console.log("Imágenes listas para enviar.");

    // Marcar imágenes como guardadas para que no se borren al cerrar el modal
    imagenesGuardadas = true;

    // Opcional: Cerrar el modal después de guardar
    $('#subirImagenesModal').modal('hide');
});

// Reiniciar la variable cuando se abre el modal
$(modal).on("shown.bs.modal", function () {
    imagenesGuardadas = false; // Si el usuario vuelve a abrir, debe volver a guardar
});

document.getElementById("guardarEquipoBtn").addEventListener("click", enviarEquipo);

async function enviarEquipo() {
    const formData = new FormData();

    // Obtener valores de los inputs y agregarlos a FormData
    const equipoData = [
        "sn", "ip", "mac", "datos", "procesador", "tiporam", "cantidadram", 
        "tipoalmacenamiento", "cantidadalmacenamiento", "formatoequipo", "marca",
        "so", "nombreequipo", "sistemas", "dependencia", "responsable", "usuario",
        "cargousuario", "mantenimiento", "observaciones"
    ];

    equipoData.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            formData.append(id, input.value);
        }
    });

    // Agregar el idusuario (suponiendo que lo tienes en localStorage o sessionStorage)
    const idusuario = sessionStorage.getItem("idusuario");
    if (idusuario) {
        formData.append("idusuario", idusuario);
    } else {
        console.error("ID de usuario no encontrado.");
        alert("No se encontró el ID del usuario.");
        return;
    }

    // Obtener imágenes
    const inputImagen1 = document.getElementById("imagen1");
    const inputImagen2 = document.getElementById("imagen2");

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
            alert("Equipo registrado exitosamente");
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
