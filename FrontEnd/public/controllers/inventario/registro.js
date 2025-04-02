// Función para obtener datos del servidor (Inventario)
async function obtenerDatosInventario() {
    try {
        const response = await fetch(`${url}/api/inventario/obtenerDatos`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (response.ok) {
            const data = await response.json();
            mostrarDatosEnInterfazInventario(data);
        } else {
            console.error("Error al obtener los datos del inventario");
            alert("Error al obtener los datos");
        }
    } catch (error) {
        console.error("Error de conexión con el servidor:", error);
        alert("Error de conexión con el servidor");
    }
}

// Función para mostrar datos en la interfaz
function mostrarDatosEnInterfazInventario(data) {
    function agregarDatosATabla(tablaId, datos, claveNombre, claveEstado, claveId) {
        const table = document.getElementById(tablaId);
        if (!table) return; // Evitar errores si la tabla no existe en la vista actual

        const tableBody = table.getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';

        datos.forEach(item => {
            const row = tableBody.insertRow();
            row.insertCell(0).textContent = item[claveNombre];

            const estadoCell = row.insertCell(1);
            const tipo = tablaId.replace('Table', '').toLowerCase();
            estadoCell.innerHTML = `
                <div class="custom-control custom-switch">
                    <input type="checkbox" class="custom-control-input switch-estado" 
                        id="switch-${tipo}-${item[claveId]}" 
                        ${item[claveEstado] ? "checked" : ""} 
                        data-id="${item[claveId]}"
                        data-tipo="${tipo}">
                    <label class="custom-control-label" for="switch-${tipo}-${item[claveId]}"></label>
                </div>
            `;
        });
    }

    if (data.dependencia) agregarDatosATabla('dependenciaTable', data.dependencia, 'nombre', 'estado', 'iddependencia');
    if (data.marca) agregarDatosATabla('marcaTable', data.marca, 'marca', 'estado', 'idmarca');
    if (data.formato) agregarDatosATabla('formatoTable', data.formato, 'formato', 'estado', 'idformato');
    if (data.actividad) agregarDatosATabla('actividadTable', data.actividad, 'nombre', 'estado', 'idactividad');
    if (data.ram) agregarDatosATabla('ramTable', data.ram, 'ram', 'estado', 'idram');
    if (data.almacenamiento) agregarDatosATabla('almacenamientoTable', data.almacenamiento, 'almacenamiento', 'estado', 'idalmacenamiento');
}

// Evento para cargar datos solo cuando se abra un modal en la vista de inventario
$(document).on('shown.bs.modal', function (event) {
    const modalId = $(event.target).attr('id');
    const modalesInventario = ['nuevaDependenciaModal', 'nuevaMarcaModal', 'nuevoFormatoModal', 'nuevoActividadModal', 'nuevaRamModal', 'nuevoAlmacenamientoModal'];

    if (modalesInventario.includes(modalId)) {
        obtenerDatosInventario();
    }
});


// Función para actualizar el estado (activar/desactivar)
document.addEventListener("change", async (event) => {
    if (event.target.classList.contains("switch-estado")) {
        const switchInput = event.target;
        const id = switchInput.getAttribute("data-id");
        const tipo = switchInput.getAttribute("data-tipo");

        console.log("Tipo del switch:", tipo, "ID:", id);

        // Guardar el estado ORIGINAL antes de que el usuario lo cambie
        const estadoOriginal = !switchInput.checked; // Aquí está la clave: invertimos el valor

        // Determinar el nuevo estado
        const nuevoEstado = !estadoOriginal;

        // Determinar el texto adecuado
        const nuevoEstadoTexto = nuevoEstado ? "activar" : "desactivar"; // Corregimos el texto
        console.log("Estado original:", estadoOriginal, "Nuevo estado:", nuevoEstado, "Texto:", nuevoEstadoTexto);

        // Mostrar alerta de confirmación
        const confirmar = await Swal.fire({
            title: `¿Estás seguro?`,
            text: `Vas a ${nuevoEstadoTexto} este elemento.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, confirmar",
            cancelButtonText: "Cancelar"
        });

        if (!confirmar.isConfirmed) {
            switchInput.checked = estadoOriginal; // Revertimos el cambio en la interfaz si se cancela
            return;
        }

        try {
            console.log("Enviando actualización:", { tipo, id, estado: nuevoEstado });
            const response = await fetch(`${url}/api/inventario/actualizarDatos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tipo, id, estado: nuevoEstado }),
                credentials: "include",
            });

            const responseText = await response.text();
            console.log("Respuesta del servidor:", responseText);

            if (response.ok) {
                switchInput.checked = nuevoEstado;
                await obtenerDatosInventario();
                Swal.fire("¡Actualizado!", "El estado se ha cambiado con éxito.", "success");
            } else {
                console.error("Error al actualizar:", responseText);
                switchInput.checked = estadoOriginal; // Si hay error, revertimos el cambio
                Swal.fire("Error", "No se pudo actualizar el estado.", "error");
            }

        } catch (error) {
            console.error("❌ Error en la solicitud:", error);
            switchInput.checked = estadoOriginal; // Si hay error, revertimos el cambio
            Swal.fire("Error", "Ocurrió un problema al conectar con el servidor.", "error");
        }
    }
});

document.querySelectorAll("[id^=registrar]").forEach((button) => {
    button.removeEventListener("click", registrarEvento); // Elimina eventos previos
    button.addEventListener("click", registrarEvento, { once: true });
});

async function registrarEvento() {

    const tipo = this.getAttribute("data-tipo"); // Obtener el tipo del botón
    const input = document.querySelector(`#${tipo}`); // Buscar el campo de entrada relacionado

    if (input && input.value.trim() !== "") {
        const data = {
            tipo: tipo,
            valor: input.value.trim()
        };

        console.log("Datos listos para enviar:", data);

        try {
            const response = await fetch(`${url}/api/inventario/guardarDatos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include"
            });

            const responseText = await response.text(); // Obtener respuesta como texto
            console.log("🔍 Respuesta completa del servidor:", responseText);

            if (!response.ok) {
                console.error("❌ Error en la solicitud. Estado HTTP:", response.status);
                Swal.fire("Error", `No se pudo registrar el dato. Código: ${response.status}`, "error");
                return;
            }

            // Intentar parsear la respuesta como JSON
            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (error) {
                console.error("❌ Error al convertir la respuesta a JSON:", error);
                Swal.fire("Error", "El servidor respondió con un formato inesperado.", "error");
                return;
            }

            // Verificar si hay un mensaje en la respuesta
            const mensaje = responseData.message || "Registro exitoso";

            // Mostrar mensaje de éxito
            console.log("✅ Respuesta válida:", mensaje);
            Swal.fire("¡Éxito!", mensaje, "success");

            // Limpiar el campo de entrada después del registro
            input.value = "";

            // Actualizar la tabla para ver los nuevos datos
            await obtenerDatosInventario();

        } catch (error) {
            console.error("❌ Error en la solicitud:", error);
            Swal.fire("Error", "Ocurrió un problema al conectar con el servidor.", "error");
        }
    } else {
        console.log("❌ Por favor, ingrese un nombre válido para:", tipo);
        Swal.fire("Atención", "Debe ingresar un nombre válido antes de registrar.", "warning");
    }
}
