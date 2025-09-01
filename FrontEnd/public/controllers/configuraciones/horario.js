document.addEventListener('DOMContentLoaded', function () {
    InicializarHorario();
});

function InicializarHorario() {
    cargarHorarios();
    configurarEventosHorarios();
}

// Función para formatear horas en formato HH:MM a HH:MM AM/PM
function formatearHora(horaString) {
    try {
        // Asumimos que horaString está en formato HH:MM
        const [hours, minutes] = horaString.split(':');
        const horas = parseInt(hours, 10);
        const minutos = minutes || '00';

        const isPM = horas >= 12;
        const horas12 = horas % 12 || 12;
        const periodo = isPM ? 'PM' : 'AM';

        return `${String(horas12).padStart(2, '0')}:${minutos.padStart(2, '0')} ${periodo}`;
    } catch (error) {
        console.error('Error al formatear hora:', error);
        return horaString; // Devuelve el valor original si hay error
    }
}

async function cargarHorarios() {
    try {
        const response = await fetch(`${url}/api/configuraciones/obtenerHorario`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const result = await response.json();
        const tbody = document.getElementById('tbodyHorarios');
        tbody.innerHTML = '';

        if (result.success && result.horarios.length > 0) {
            result.horarios.forEach(horario => {
                const tr = document.createElement('tr');
                tr.dataset.id = horario.id;
                // Formatear las horas
                const horaInicioFormateada = formatearHora(horario.inicia);
                const horaFinFormateada = formatearHora(horario.fin);
                tr.innerHTML = `
                    <td>${horario.diaNombre}</td>
                    <td class="hora-inicio-col">
                        <span class="hora-texto">${horaInicioFormateada}</span>
                        <input type="time" class="form-control form-control-sm hora-input d-none" value="${horario.inicia}">
                    </td>
                    <td class="hora-fin-col">
                        <span class="hora-texto">${horaFinFormateada}</span>
                        <input type="time" class="form-control form-control-sm hora-input d-none" value="${horario.fin}">
                    </td>
                    <td>
                        <div class="custom-control custom-switch">
                            <input type="checkbox" class="custom-control-input toggle-estado" 
                                   id="estado-${horario.id}" ${horario.estado ? 'checked' : ''}
                                   data-id="${horario.id}">
                            <label class="custom-control-label" for="estado-${horario.id}"></label>
                        </div>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-fsvsaoff btn-editar" data-id="${horario.id}">
                            <i class="fas fa-pen mr-1"></i>Editar
                        </button>
                        <button class="btn btn-sm btn-fsvsaon btn-guardar d-none" data-id="${horario.id}">
                            <i class="fas fa-save mr-1"></i>Guardar
                        </button>
                        <button class="btn btn-sm btn-fsvsaoff btn-cancelar d-none" data-id="${horario.id}">
                            <i class="fas fa-times mr-1"></i>Cancelar
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay horarios registrados</td></tr>';
        }
    } catch (error) {
        console.error('Error al cargar horarios:', error);
        mostrarError('No se pudieron cargar los horarios');
    }
}

function configurarEventosHorarios() {
    const tbody = document.getElementById('tbodyHorarios');

    if (!tbody) {
        console.error('Elemento tbodyHorarios no encontrado');
        return;
    }

    // Evento para iniciar edición
    tbody.addEventListener('click', function (e) {
        if (e.target.closest('.btn-editar')) {
            const id = e.target.closest('.btn-editar').dataset.id;
            iniciarEdicion(id);
        }

        if (e.target.closest('.btn-guardar')) {
            const id = e.target.closest('.btn-guardar').dataset.id;
            confirmarCambios(id);
        }

        if (e.target.closest('.btn-cancelar')) {
            const id = e.target.closest('.btn-cancelar').dataset.id;
            cancelarEdicion(id);
        }
    });

    // Evento para cambiar estado (fuera del modo edición)
    tbody.addEventListener('change', function (e) {
        if (e.target.classList.contains('toggle-estado')) {
            const tr = e.target.closest('tr');
            // Verificamos si estamos en modo edición (si el botón guardar está visible)
            const estaEnModoEdicion = !tr.querySelector('.btn-guardar').classList.contains('d-none');

            if (!estaEnModoEdicion) {
                const id = e.target.dataset.id;
                const estado = e.target.checked ? 1 : 0;
                confirmarCambioEstado(id, estado);
            }
        }
    });
}

// Nueva función para confirmar cambio de estado (fuera del modo edición)
async function confirmarCambioEstado(id, estado) {
    try {
        const result = await Swal.fire({
            title: '¿Confirmar cambio de estado?',
            text: '¿Estás seguro de que deseas actualizar el estado de este horario?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, actualizar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            await actualizarHorarioBackend(id, { estado });
            mostrarExito('Estado actualizado correctamente');
        } else {
            // Revertir el cambio visual si cancela
            const checkbox = document.querySelector(`#estado-${id}`);
            if (checkbox) checkbox.checked = !checkbox.checked;
        }
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        mostrarError('No se pudo actualizar el estado');
    }
}

// Nueva función para confirmar cambios (en modo edición)
async function confirmarCambios(id) {
    try {
        const tr = document.querySelector(`tr[data-id="${id}"]`);
        if (!tr) return;

        const result = await Swal.fire({
            title: '¿Confirmar cambios?',
            text: '¿Estás seguro de que deseas guardar los cambios realizados?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, guardar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            await guardarCambios(id);
        }
    } catch (error) {
        console.error('Error al confirmar cambios:', error);
    }
}

function iniciarEdicion(id) {
    const tr = document.querySelector(`tr[data-id="${id}"]`);
    if (!tr) return;

    // Guardar el estado original del switch
    const checkbox = tr.querySelector('.toggle-estado');
    tr.dataset.estadoOriginal = checkbox.checked.toString();

    // Mostrar inputs y ocultar textos
    tr.querySelectorAll('.hora-texto').forEach(el => el.classList.add('d-none'));
    tr.querySelectorAll('.hora-input').forEach(el => el.classList.remove('d-none'));

    // Mostrar botones de guardar y cancelar
    tr.querySelector('.btn-editar').classList.add('d-none');
    tr.querySelector('.btn-guardar').classList.remove('d-none');
    tr.querySelector('.btn-cancelar').classList.remove('d-none');
}

// Función modificada para guardar cambios (ahora solo hace el guardado)
async function guardarCambios(id) {
    try {
        const tr = document.querySelector(`tr[data-id="${id}"]`);
        if (!tr) return;

        const horaInicio = tr.querySelector('.hora-inicio-col .hora-input').value;
        const horaFin = tr.querySelector('.hora-fin-col .hora-input').value;
        const estado = tr.querySelector('.toggle-estado').checked ? 1 : 0;

        // Construye el objeto con los campos a actualizar
        const campos = { horaInicio, horaFin, estado };

        await actualizarHorarioBackend(id, campos);

        // Actualizar visualmente la fila
        tr.querySelector('.hora-inicio-col .hora-texto').textContent = horaInicio;
        tr.querySelector('.hora-fin-col .hora-texto').textContent = horaFin;

        // Ocultar inputs y mostrar textos
        tr.querySelectorAll('.hora-texto').forEach(el => el.classList.remove('d-none'));
        tr.querySelectorAll('.hora-input').forEach(el => el.classList.add('d-none'));

        // Restaurar botones
        tr.querySelector('.btn-editar').classList.remove('d-none');
        tr.querySelector('.btn-guardar').classList.add('d-none');
        tr.querySelector('.btn-cancelar').classList.add('d-none');

        mostrarExito('Horario actualizado correctamente');
    } catch (error) {
        console.error('Error al guardar cambios:', error);
        mostrarError('No se pudo actualizar el horario');
    }
}

function cancelarEdicion(id) {
    const tr = document.querySelector(`tr[data-id="${id}"]`);
    if (!tr) return;

    // Obtener valores originales (en formato AM/PM)
    const horaInicioAMPM = tr.querySelector('.hora-inicio-col .hora-texto').textContent;
    const horaFinAMPM = tr.querySelector('.hora-fin-col .hora-texto').textContent;
    
    // Convertir de AM/PM a formato 24 horas para los inputs
    const horaInicio24 = convertirAMPMa24Horas(horaInicioAMPM);
    const horaFin24 = convertirAMPMa24Horas(horaFinAMPM);
    
    const estadoOriginal = tr.dataset.estadoOriginal === 'true';

    // Restaurar valores en los inputs (en formato 24 horas)
    tr.querySelector('.hora-inicio-col .hora-input').value = horaInicio24;
    tr.querySelector('.hora-fin-col .hora-input').value = horaFin24;

    // Restaurar estado original del switch
    const checkbox = tr.querySelector('.toggle-estado');
    if (checkbox) {
        checkbox.checked = estadoOriginal;
    }

    // Ocultar inputs y mostrar textos
    tr.querySelectorAll('.hora-texto').forEach(el => el.classList.remove('d-none'));
    tr.querySelectorAll('.hora-input').forEach(el => el.classList.add('d-none'));

    // Restaurar botones
    tr.querySelector('.btn-editar').classList.remove('d-none');
    tr.querySelector('.btn-guardar').classList.add('d-none');
    tr.querySelector('.btn-cancelar').classList.add('d-none');
}

// Función para convertir formato AM/PM a 24 horas
function convertirAMPMa24Horas(horaAMPM) {
    try {
        const [horaMinuto, periodo] = horaAMPM.split(' ');
        let [horas, minutos] = horaMinuto.split(':');
        
        horas = parseInt(horas, 10);
        minutos = minutos || '00';
        
        if (periodo === 'PM' && horas < 12) {
            horas += 12;
        } else if (periodo === 'AM' && horas === 12) {
            horas = 0;
        }
        
        return `${String(horas).padStart(2, '0')}:${minutos}`;
    } catch (error) {
        console.error('Error al convertir hora:', error);
        return horaAMPM; // Devuelve el original si hay error
    }
}

// Función reutilizable para llamar al backend
async function actualizarHorarioBackend(id, campos) {
    const response = await fetch(`${url}/api/configuraciones/actualizarHorario/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(campos)
    });

    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

    const result = await response.json();

    if (!result.success) throw new Error(result.message || 'Error al actualizar horario');

    mostrarExito('Horario actualizado correctamente');
    // Recarga la tabla o actualiza la fila si lo deseas
    cargarHorarios();
}

function mostrarError(mensaje) {
    Swal.fire('Error', mensaje, 'error');
}

function mostrarExito(mensaje) {
    Swal.fire('Éxito', mensaje, 'success');
}