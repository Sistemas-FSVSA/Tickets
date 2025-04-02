document.addEventListener('DOMContentLoaded', () => {
    InicializarHVC();
});
async function InicializarHVC() {
    cargarVistaHVC();
    cargarActividades(); // Opcional, según necesites en esta vista.
    document.getElementById("abrirMantenimiento")?.addEventListener("click", abrirModal);
    document.getElementById("registrarMantenimiento")?.addEventListener("click", registrarMantenimientoModal);
}

async function cargarVistaHVC() {
    const urlParams = new URLSearchParams(window.location.search);
    const idInventario = urlParams.get("idinventario");

    if (idInventario) {
        try {
            const response = await fetch(`${url}/api/mantenimientos/obtenerHVC`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idinventario: idInventario }),
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Error al obtener datos del inventario");
            }

            const data = await response.json();
            llenarFormularioHVC(data);
        } catch (error) {
            console.error("Error al cargar el inventario:", error);
        }
    }
}

// funcion para llenar los campos de la hoja de vida del computo
function llenarFormularioHVC(data) {

    const equipo = data.equipo;

    // Función auxiliar para asignar valores solo si el elemento existe
    function asignarValor(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.value = valor || "";
        } else {
            console.warn(`Elemento con ID "${id}" no encontrado`);
        }
    }

    asignarValor("idInventario", equipo.idinventario);
    asignarValor("sn", equipo.sn);
    asignarValor("ip", equipo.ipequipo);
    asignarValor("mac", equipo.mac);
    asignarValor("datos", equipo.puertodatos);
    asignarValor("procesador", equipo.procesador);
    asignarValor("tiporam", equipo.nombre_tiporam);
    asignarValor("cantidadram", equipo.cantidadram);
    asignarValor("tipoalmacenamiento", equipo.nombre_tipoalmacenamiento);
    asignarValor("cantidadalmacenamiento", equipo.cantidadalmacenamiento);
    asignarValor("formatoEquipo", equipo.nombre_formato);
    asignarValor("marca", equipo.nombre_marca);
    asignarValor("so", equipo.so);
    asignarValor("nombreequipo", equipo.nombreequipo);
    asignarValor("dependencia", equipo.nombre_dependencia);
    asignarValor("responsable", equipo.responsable);
    asignarValor("usuario", equipo.nombreusuario);
    asignarValor("cargousuario", equipo.cargousuario);
    asignarValor("observaciones", equipo.observacion);

    // Renderiza mantenimientos solo si data.mantenimientos existe
    if (data.mantenimientos) {
        renderizarMantenimientos(data.mantenimientos);
    } else {
        console.warn("No hay mantenimientos en los datos recibidos");
    }
}

// funcion para cargar actividades
async function cargarActividades() {
    try {
        const response = await fetch(`${url}/api/mantenimientos/obtenerActividades`, {
            credentials: "include"
        });
        if (!response.ok) throw new Error("Error al obtener actividades");
        const data = await response.json();
        const actividades = data.actividad;
        

        if (!Array.isArray(actividades)) {
            console.error("Error: La respuesta no es un array", actividades);
            return;
        }

        // Obtener el elemento <select>
        const selectActividad = document.getElementById("tipoMantenimiento");
        if (!selectActividad) {
            console.error("Error: No se encontró el select con id 'idactividad'");
            return;
        }

        // Limpiar el select antes de llenarlo
        selectActividad.innerHTML = '<option value="">Seleccione una actividad</option>';

        // Filtrar y agregar las actividades activas
        actividades
            .filter(actividad => actividad.estado === 1) // Solo actividades activas
            .forEach(actividad => {
                const option = document.createElement("option");
                option.value = actividad.idactividad;
                option.textContent = actividad.nombre;
                selectActividad.appendChild(option);
            });

    } catch (error) {
        console.error("Error al cargar actividades:", error);
    }
}


// funcion para renderizar los mantenimiento del equipo
function renderizarMantenimientos(mantenimientos) {
    const tablaBody = document.querySelector("#tbodymantenimientos");

    tablaBody.innerHTML = ""; // Limpiar la tabla antes de insertar datos nuevos

    mantenimientos.forEach(mantenimiento => {
        const fila = document.createElement("tr");
        const fechaMantenimiento = mantenimiento.fechamantenimiento ?
            new Date(mantenimiento.fechamantenimiento).toISOString().split("T")[0] : "Fecha no disponible";

        fila.innerHTML = `
            <td>${mantenimiento.nombre_actividad}</td>
            <td>${fechaMantenimiento}</td>
            <td>${mantenimiento.observacion_hvc || "Sin observaciones"}</td>
            <td>${mantenimiento.nombre_responsable || "No disponible"}</td>
        `;
        tablaBody.appendChild(fila);
    });

    // Destruir DataTable antes de reinicializarlo
    if ($.fn.DataTable.isDataTable("#tablaMantenimientos")) {
        $("#tablaMantenimientos").DataTable().destroy();
    }

    $("#tablaMantenimientos").DataTable({
        language: { url: "https://cdn.datatables.net/plug-ins/1.10.16/i18n/Spanish.json" },
        order: [[1, "desc"]],
        pageLength: 10,
        autoWidth: false,
    });
}



// Registrar mantenimiento usando datos del formulario del modal
async function registrarMantenimientoModal() {
    const idinventario = document.getElementById("idInventario").value;
    const observacion = document.getElementById("observacionesMantenimiento").value.trim();
    const idactividad = document.getElementById("tipoMantenimiento").value;
    const idusuario = parseInt(sessionStorage.getItem("idusuario") || "0");

    if (!idinventario || !idactividad || !observacion || !idusuario) {
        console.warn("Por favor, complete todos los campos.");
        return;
    }

    const datos = {
        idinventario: parseInt(idinventario),
        observacion: observacion,
        idactividad: parseInt(idactividad),
        idusuario: parseInt(idusuario),
    };

    try {
        const response = await fetch(`${url}/api/mantenimientos/guardarMantenimientos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos),
            credentials: "include",
        });

        if (!response.ok) throw new Error("Error al registrar mantenimiento");

        // ✅ Guardar solo un estado en el historial con la URL previa
        const urlAnterior = window.history.state?.prevUrl || window.location.href;
        window.history.replaceState({ prevUrl: urlAnterior }, "", `hvc?idinventario=${idinventario}`);

        // 🔄 Recargar la vista
        location.reload();

    } catch (error) {
        console.error("Error al registrar mantenimiento:", error);
    }
}


function abrirModal(e) {
    e.preventDefault();
    const modal = new bootstrap.Modal(document.getElementById("modalMantenimiento"));
    cargarActividades().then(() => modal.show());
}
