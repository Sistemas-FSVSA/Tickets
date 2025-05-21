document.addEventListener('DOMContentLoaded', () => {
    inicializarDashboard();
});

async function inicializarDashboard() {
    inicializarUI();
    inicializarGraficos();
    llenarSelectAnios();

    // Establecer fechas predeterminadas
    const fechaActual = new Date();
    const fechaInicio = new Date(fechaActual);
    fechaInicio.setDate(fechaActual.getDate() - 6); // Una semana atrás

    document.getElementById('fechaInicio').value = fechaInicio.toISOString().split('T')[0];
    document.getElementById('fechaFin').value = fechaActual.toISOString().split('T')[0];

    await cargarTodosLosDatos();
    await cargarUsuariosMasActivos();
    //setInterval(cargarTickets, 30000);
}

function inicializarUI() {
    document.getElementById('ticketsActivos').textContent = '...';
    document.getElementById('ticketsGestionados').textContent = '...';
    document.getElementById('ticketsPendientes').textContent = '...';
    document.getElementById('equiposActivos').textContent = '...';
}

function inicializarGraficos() {
    Chart.register(ChartDataLabels);
    const customHeight = 500;
    document.getElementById('salesChart').parentElement.style.height = `${customHeight}px`;
    document.getElementById('usersChart').parentElement.style.height = `${customHeight}px`;
    document.getElementById('maintenanceChart').parentElement.style.height = `${customHeight}px`;
    document.getElementById('modificationsChart').parentElement.style.height = `${customHeight}px`;

    // Verifica si los gráficos existen antes de destruirlos
    if (window.salesChart instanceof Chart) {
        window.salesChart.destroy();
    }
    if (window.usersChart instanceof Chart) {
        window.usersChart.destroy();
    }
    if (window.maintenanceChart instanceof Chart) {
        window.maintenanceChart.destroy();
    }
    if (window.modificationsChart instanceof Chart) {
        window.modificationsChart.destroy();
    }

    window.salesChart = new Chart(document.getElementById('salesChart').getContext('2d'), {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: ['#afeeee', '#e0ffff', '#b0e0e6', '#87cefa', '#add5fa']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'left',
                    align: 'start',
                    labels: {
                        boxWidth: 20,
                        padding: 10,
                        font: { size: 14 }
                    },
                    onClick: (e, legendItem, legend) => {
                        const chart = legend.chart;
                        const index = legendItem.index;

                        // 🔄 Usamos toggleDataVisibility en lugar de modificar meta.data directamente
                        chart.toggleDataVisibility(index);

                        // 🔃 Esto redibuja el gráfico y actualiza los datalabels
                        chart.update();
                    }
                },
                datalabels: {
                    color: '#000',
                    font: { size: 12 },
                    formatter: (value, context) => {
                        const chart = context.chart;
                        const datasetIndex = context.datasetIndex;
                        const index = context.dataIndex;
                        const meta = chart.getDatasetMeta(datasetIndex);

                        const totalVisible = meta.data.reduce((sum, arc, i) => {
                            const isHidden = arc.hidden || chart._hiddenIndices?.[i]; // Verifica si está oculto
                            return !isHidden ? sum + chart.data.datasets[datasetIndex].data[i] : sum;
                        }, 0);

                        const currentValue = chart.data.datasets[datasetIndex].data[index];
                        const isCurrentHidden = meta.data[index].hidden || chart._hiddenIndices?.[index];

                        if (isCurrentHidden) {
                            return '';
                        }

                        if (totalVisible === 0) return '0%';

                        const porcentaje = (currentValue / totalVisible) * 100;
                        return `${porcentaje.toFixed(2)}%`;
                    }
                }
            },
            layout: { padding: { left: 20, right: 20 } }
        },
        plugins: [ChartDataLabels]
    });

    window.usersChart = new Chart(document.getElementById('usersChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: [], // Se llenará con los nombres de soporte
            datasets: [{
                data: [], // Se llenará con las cantidades
                backgroundColor: [
                    '#afeeee', '#e0ffff', '#b0e0e6', '#87cefa', '#add5fa',
                    '#b0c4de', '#4682b4', '#5f9ea0', '#6495ed', '#00bfff'
                ],
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            barPercentage: 0.6,  // Controla el ancho de la barra en relación al espacio disponible (0-1)
            categoryPercentage: 0.6,
            layout: {
                padding: {
                    top: 25 // Aumenta el margen superior
                }
            },
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    callbacks: {
                        // Modificamos el tooltip para mostrar solo el valor
                        label: function (context) {
                            return context.raw.toString();
                        },
                        // Opcional: puedes personalizar el título también
                        title: function (context) {
                            return context[0].label;
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: (value) => value,
                    font: {
                        weight: 'bold'
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Tipos de Soporte',
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cantidad de Tickets',
                        font: {
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });

    window.maintenanceChart = new Chart(document.getElementById('maintenanceChart').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Vigente', 'Próximos', 'Atrasados'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#4CAF50', '#FFC107', '#F44336'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '40%',
            plugins: {
                legend: {
                    position: 'left',
                    align: 'start',
                    labels: {
                        boxWidth: 20,
                        padding: 10,
                        font: {
                            size: 14,
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                        },
                        color: '#000'
                    },
                    onClick: (e, legendItem, legend) => {
                        const chart = legend.chart;
                        const index = legendItem.index;
                        chart.toggleDataVisibility(index);
                        chart.update();
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.label}: ${context.raw} equipos`;
                        }
                    }
                },
                datalabels: {
                    color: '#000',
                    font: { size: 14 },
                    formatter: (value, context) => {
                        const chart = context.chart;
                        const dataset = chart.data.datasets[context.datasetIndex];

                        // Suma solo los valores visibles usando getDataVisibility
                        let totalVisible = 0;
                        dataset.data.forEach((val, i) => {
                            if (chart.getDataVisibility(i)) totalVisible += val;
                        });

                        // Si este segmento está oculto, no mostrar nada
                        if (!chart.getDataVisibility(context.dataIndex)) return '';

                        if (totalVisible === 0) return '0%';

                        const percentage = Math.round((value / totalVisible) * 100);
                        return `${percentage}%`;
                    }
                }
            },
            layout: {
                padding: {
                    left: 20,
                    right: 20
                }
            }
        },
        plugins: [ChartDataLabels]
    });

    window.modificationsChart = new Chart(document.getElementById('modificationsChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
            datasets: [{
                label: 'Modificaciones',
                data: Array(12).fill(0),
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1, // Aumentar grosor de línea
                pointRadius: 4, // Tamaño de los puntos
                pointHoverRadius: 6 // Tamaño al hacer hover
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 40, // Aumenta el margen superior
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cantidad de Modificaciones',
                        font: {
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Meses del Año',
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Modificaciones: ${context.raw}`;
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    color: '#000',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    formatter: function (value) {
                        return value > 0 ? value : ''; // Solo mostrar valor si es mayor a 0
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function actualizarTarjetas(conteoTickets, equiposData) {
    requestAnimationFrame(() => {
        // Actualizamos directamente con los valores del conteo
        document.getElementById('ticketsActivos').textContent = conteoTickets.activos || 0;
        document.getElementById('ticketsGestionados').textContent = conteoTickets.cerrados || 0;
        document.getElementById('ticketsPendientes').textContent = conteoTickets.leidos || 0;

        // Obtén el total de equipos activos desde equiposData
        const equiposActivos = equiposData.totalEquiposActivos || equiposData.data?.totalEquiposActivos || 0;
        document.getElementById('equiposActivos').textContent = equiposActivos;
    });
}

function actualizarGraficoSales(tickets) {
    if (!tickets || !Array.isArray(tickets)) {
        return;
    }

    requestAnimationFrame(() => {
        try {
            // Contar tickets por dependencia
            const conteo = tickets.reduce((acc, ticket) => {
                if (!ticket.iddependencia || !ticket.nombreDependencia) return acc;

                const key = `${ticket.iddependencia}-${ticket.nombreDependencia}`;
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});

            // Convertir a array y formatear
            const datos = Object.entries(conteo).map(([key, count]) => {
                const [id, nombre] = key.split('-');
                return { id: parseInt(id), nombre, count };
            });

            // Ordenar y tomar top 5
            const top5 = datos.sort((a, b) => b.count - a.count).slice(0, 5);

            // Actualizar gráfico si existe
            if (window.salesChart instanceof Chart) {
                window.salesChart.data.labels = top5.map(d => d.nombre);
                window.salesChart.data.datasets[0].data = top5.map(d => d.count);
                window.salesChart.update();
            }
        } catch (error) {
            console.error('Error al actualizar gráfico de ventas:', error);
        }
    });
}

async function cargarTodosLosDatos() {
    try {
        const fechaInicio = document.getElementById('fechaInicio').value;
        const fechaFin = document.getElementById('fechaFin').value;
        const anio = document.getElementById('selectAnio').value; // Obtener el año seleccionado

        // 1. Cargar datos para las tarjetas y gráficos
        const [
            responseConteoTickets,
            responseDependencias,
            responseSoportes,
            responseEquipos,
            responseMantenimientos,
            responseModificaciones // Nueva petición para modificaciones
        ] = await Promise.all([
            fetch(`${url}/api/dashboard/obtenerEstadoTickets`, {
                method: 'GET',
                credentials: 'include'
            }),
            fetch(`${url}/api/dashboard/obtenerDependencias`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fechainicio: fechaInicio,
                    fechafin: fechaFin
                }),
                credentials: 'include'
            }),
            fetch(`${url}/api/dashboard/obtenerSoportes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fechainicio: fechaInicio,
                    fechafin: fechaFin
                }),
                credentials: 'include'
            }),
            fetch(`${url}/api/dashboard/obtenerEquipos`, {
                method: 'GET',
                credentials: 'include'
            }),
            fetch(`${url}/api/dashboard/obtenerEstadoMantenimiento`, {
                method: 'GET',
                credentials: 'include'
            }),
            fetch(`${url}/api/dashboard/obtenerModificaciones`, { // Nueva petición
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ anio }), // Enviar el año en el cuerpo de la solicitud
                credentials: 'include'
            })
        ]);

        // 2. Procesar todas las respuestas
        if (!responseConteoTickets.ok || !responseDependencias.ok ||
            !responseSoportes.ok || !responseEquipos.ok || !responseMantenimientos.ok || !responseModificaciones.ok) {
            throw new Error('Error en una o más peticiones');
        }

        const [
            conteoTickets,
            datosDependencias,
            datosSoportes,
            datosEquipos,
            datosMantenimientos,
            datosModificaciones // Nueva respuesta
        ] = await Promise.all([
            responseConteoTickets.json(),
            responseDependencias.json(),
            responseSoportes.json(),
            responseEquipos.json(),
            responseMantenimientos.json(),
            responseModificaciones.json() // Nueva respuesta
        ]);

        // 3. Actualizar componentes
        actualizarTarjetas(conteoTickets.data, datosEquipos);
        actualizarGraficoSales(datosDependencias.data || []);
        actualizarGraficoSoportes(datosSoportes.data || []);
        actualizarGraficoMantenimientos(datosMantenimientos.data);
        actualizarGraficoModificaciones(datosModificaciones.data || []); // Actualizar gráfico de modificaciones

    } catch (error) {
        console.error('Error al cargar datos:', error);
        alert('Error al cargar datos: ' + error.message);
    }
}

function actualizarGraficoSoportes(tickets) {
    requestAnimationFrame(() => {
        // Agrupar tickets por tipo de soporte
        const soportesMap = new Map();

        tickets.forEach(ticket => {
            const nombreSoporte = ticket.nombreSoporte;
            if (soportesMap.has(nombreSoporte)) {
                soportesMap.set(nombreSoporte, soportesMap.get(nombreSoporte) + 1);
            } else {
                soportesMap.set(nombreSoporte, 1);
            }
        });

        // Convertir a arrays para el gráfico
        const labels = Array.from(soportesMap.keys());
        const data = Array.from(soportesMap.values());

        // Actualizar el gráfico de barras
        if (window.usersChart) {
            window.usersChart.data.labels = labels;
            window.usersChart.data.datasets[0].data = data;
            window.usersChart.data.datasets[0].label;
            window.usersChart.update();
        }
    });
}

function actualizarGraficoMantenimientos(mantenimientosData) {
    requestAnimationFrame(() => {
        // Preparar datos para el gráfico
        const labels = ['Vigente', 'Próximos', 'Atrasados'];
        const data = [
            mantenimientosData.conteos.alDia,
            mantenimientosData.conteos.proximos,
            mantenimientosData.conteos.atrasados
        ];

        // Colores para cada estado
        const backgroundColors = ['#FFC107', '#4CAF50', '#F44336'];

        // Actualizar el gráfico de doughnut
        if (window.maintenanceChart) {
            window.maintenanceChart.data.labels = labels;
            window.maintenanceChart.data.datasets[0].data = data;
            window.maintenanceChart.data.datasets[0].backgroundColor = backgroundColors;
            window.maintenanceChart.update();
        }

        // Actualizar la barra de progreso
        const progresoText = document.getElementById('progresoText');
        const progresoBar = document.getElementById('progresoBar');
        const progresoDetail = document.getElementById('progresoDetail');

        // Extraer el valor de progreso (eliminando el % si existe)
        const progreso = parseInt(mantenimientosData.progreso) || 0;
        const equiposProximoAno = mantenimientosData.equiposProximoAno || 0;
        const totalEquipos = mantenimientosData.conteos.total || 0;

        progresoText.textContent = `${progreso}%`;
        progresoBar.style.width = `${progreso}%`;
        progresoBar.setAttribute('aria-valuenow', progreso);
        progresoDetail.textContent = `${equiposProximoAno} de ${totalEquipos} equipos realizados`;

        // Cambiar color según el porcentaje
        if (progreso < 30) {
            progresoBar.className = 'progress-bar bg-danger';
        } else if (progreso < 70) {
            progresoBar.className = 'progress-bar bg-warning';
        } else {
            progresoBar.className = 'progress-bar bg-success';
        }
    });
}

// Llenar select con años
function llenarSelectAnios() {
    const selectAnio = document.getElementById('selectAnio');
    const anioActual = new Date().getFullYear();
    const anioInicio = 2023; // Cambia este valor si necesitas un rango diferente

    // Limpiar el select antes de llenarlo
    selectAnio.innerHTML = '';

    // Agregar opciones de años
    for (let anio = anioActual; anio >= anioInicio; anio--) {
        const option = document.createElement('option');
        option.value = anio;
        option.textContent = anio;
        selectAnio.appendChild(option);
    }

    // Seleccionar el año actual por defecto
    selectAnio.value = anioActual;
}

function actualizarGraficoModificaciones(modificacionesData) {
    requestAnimationFrame(() => {
        // Verificar si hay datos válidos
        if (!modificacionesData || !Array.isArray(modificacionesData)) {
            console.warn('Datos de modificaciones no válidos:', modificacionesData);
            return;
        }

        // Crear array completo para los 12 meses
        const datosCompletos = Array(12).fill(0);

        // Llenar con los datos recibidos
        modificacionesData.forEach(item => {
            // Asegurarse que el mes está en rango (1-12)
            if (item.mes >= 1 && item.mes <= 12) {
                datosCompletos[item.mes - 1] = item.cantidad;
            }
        });

        // Actualizar gráfico si existe
        if (window.modificationsChart) {
            window.modificationsChart.data.datasets[0].data = datosCompletos;
            window.modificationsChart.update();
        } else {
            console.error('El gráfico de modificaciones no está inicializado');
        }
    });
}

function renderizarUsuariosMasActivos(usuarios) {
    const container = document.getElementById('usuariosMasActivosContainer');
    if (!usuarios || usuarios.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay datos de usuarios más activos.</p>';
        return;
    }

    let html = `
    <div class="table-responsive usuarios-tabla">
    <table class="table table-sm table-bordered align-middle mb-0">
        <thead class="table-light">
            <tr>
                <th>#</th>
                <th>Usuario</th>
                <th>Dependencia</th>
                <th>Cargo</th>
                <th>IP</th>
                <th>Tickets</th>
                <th>Última Fecha</th>
                <th>Último Ticket</th>
            </tr>
        </thead>
        <tbody>
    `;

    usuarios.forEach((u, idx) => {
        html += `
            <tr>
                <td>${idx + 1}</td>
                <td>${u.usuario?.nombre || '-'}</td>
                <td>${u.usuario?.dependencia || '-'}</td>
                <td>${u.usuario?.cargo || '-'}</td>
                <td>${u.estadisticas.ip || '-'}</td>
                <td>${u.estadisticas.cantidad_tickets}</td>
                <td>${formatDate(u.estadisticas.ultima_fecha)}</td>
                <td>
                    ${u.ultimo_ticket
                ? `<b>${u.ultimo_ticket.tema}</b><br>
                           <small>${u.ultimo_ticket.detalle}</small><br>
                           <span class="badge bg-secondary">${u.ultimo_ticket.estado}</span>
                           <br><small>${formatDate(u.ultimo_ticket.fecha)}</small>`
                : '-'}
                </td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

async function cargarUsuariosMasActivos() {
    try {
        const resp = await fetch(`${url}/api/dashboard/usuarioMasTickets`, {
            method: 'GET',
            credentials: 'include'
        });
        const data = await resp.json();
        renderizarUsuariosMasActivos(data.data || []);
    } catch (err) {
        console.error('Error al cargar usuarios más activos:', err);
        renderizarUsuariosMasActivos([]);
    }
}

function formatDate(date) {
    if (!date) return '-';

    const d = new Date(date);
    // Ajustar manualmente la hora sumando 5 horas (UTC → Bogotá UTC-5)
    d.setHours(d.getHours() + 5); // ← Restar 5 horas para compensar la diferencia

    return d.toLocaleString('es-CO', {
        hour12: true,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

document.getElementById('selectAnio').addEventListener('change', cargarTodosLosDatos);
document.getElementById('fechaInicio').addEventListener('change', cargarTodosLosDatos);
document.getElementById('fechaFin').addEventListener('change', cargarTodosLosDatos);

