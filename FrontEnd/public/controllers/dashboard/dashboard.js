document.addEventListener('DOMContentLoaded', () => {

    inicializarDashboard();

});


async function inicializarDashboard() {
    inicializarUI();
    inicializarGraficos();
    llenarSelectAnios();
    const { cpuData, memData } = inicializarMonitorChart();
    initServerMonitor(cpuData, memData);

    // Establecer fechas predeterminadas
    const fechaActual = new Date();
    const fechaInicio = new Date(fechaActual);
    fechaInicio.setDate(fechaActual.getDate() - 6); // Una semana atrás

    document.getElementById('fechaInicio').value = fechaInicio.toISOString().split('T')[0];
    document.getElementById('fechaFin').value = fechaActual.toISOString().split('T')[0];

    await cargarTodosLosDatos();
    // await cargarUsuariosMasActivos();
    //setInterval(cargarTickets, 30000);
}

// Verifica que socket.io esté disponible antes de inicializar el monitor, se conecta al backend y define los id del HTML
function initServerMonitor(cpuData, memData) {
    if (typeof io === 'undefined') {
        console.error('Socket.IO no está disponible');
        return;
    }

    const socket = io(window.API_URL_IP || `http://${window.location.hostname}:3101`);

    socket.on('system-metrics', (data) => {
        // Calcula el porcentaje de memoria usada correctamente
        const memUsed = (data.totalMemMb > 0)
            ? ((data.usedMemMb / data.totalMemMb) * 100).toFixed(2)
            : 0;

        cpuData.push(parseFloat(data.cpu));
        cpuData.shift();
        memData.push(parseFloat(memUsed));
        memData.shift();

        if (window.monitorChart) {
            window.monitorChart.update();
        }

        // Mostrar info adicional
        const infoDiv = document.getElementById('monitorInfo');
        if (infoDiv) {
            infoDiv.innerHTML = `
            <b>CPU:</b> ${data.cpuModel || '-'}<br>
            <b>Núcleos:</b> ${data.cpuCount || '-'}<br>
            <b>RAM:</b> ${data.usedMemMb} MB / ${data.totalMemMb} MB<br>
            <b>Red ↓:</b> ${(data.netRx / 1024).toFixed(1)} KB/s &nbsp; 
            <b>Red ↑:</b> ${(data.netTx / 1024).toFixed(1)} KB/s
        `;
        }

        updateServerStatus(parseFloat(data.cpu), parseFloat(memUsed));
    });

    socket.on('connect_error', (err) => {
        if (window.monitorChart) {
            window.monitorChart.data.datasets[0].data = [0, 0];
            window.monitorChart.update();
        }
        updateServerStatus(0, 0, true);
    });
}

// Función para actualizar el estado del servidor
function updateServerStatus(cpuUsage, memUsage, offline = false) {
    const statusElement = document.getElementById('server-status');
    const statusIcon = document.querySelector('#server-status-icon i');
    if (!statusElement || !statusIcon) return;

    if (offline) {
        statusElement.textContent = "❌ Offline";
        statusElement.className = "card-text fs-2 text-danger";
        statusIcon.className = "fas fa-circle text-danger";
        return;
    }

    const maxUsage = Math.max(cpuUsage, memUsage);

    let statusText = '';
    let statusClass = '';
    let iconClass = '';

    if (maxUsage <= 50) {
        statusText = " Óptimo";
        statusClass = "card-text fs-2 text-success";
        iconClass = "fas fa-circle text-success";
    } else if (maxUsage <= 80) {
        statusText = " Aceptable";
        statusClass = "card-text fs-2 text-warning";
        iconClass = "fas fa-circle text-warning";
    } else {
        statusText = " Sobrecargado";
        statusClass = "card-text fs-2 text-danger";
        iconClass = "fas fa-circle text-danger";
    }

    statusElement.textContent = statusText;
    statusElement.className = statusClass;
    statusIcon.className = iconClass;
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
                backgroundColor: ['#00205C', '#8A2432', '#e0e0e0', '#4b8abe', '#b3b3b3']
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
                    color: (context) => {
                        textColors = ['#FFFFFF', '#FFFFFF', '#000000', '#FFFFFF', '#FFFFFF']
                        const datasetIndex = context.datasetIndex;
                        const index = context.dataIndex;
                        return textColors[index];
                    },
                    font: { size: 12 },
                    formatter: (value, context) => {
                        const chart = context.chart;
                        const datasetIndex = context.datasetIndex;
                        const index = context.dataIndex;
                        const meta = chart.getDatasetMeta(datasetIndex);

                        const totalVisible = meta.data.reduce((sum, arc, i) => {
                            const isHidden = arc.hidden || chart._hiddenIndices?.[i];
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
                    '#00205C', '#8A2432', '#e0e0e0', '#4b8abe', '#b3b3b3',
                    '#c14b3e', '#e27b6f', '#f7cca1', '#6495ed', '#00bfff'
                ],
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            // indexAxis: 'y',
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

    // --- Inicializar gráfico Subtemas (placeholder) ---
    try {
        // Si ya existiera, lo destruimos
        if (window.usersChartSubtemas instanceof Chart) {
            window.usersChartSubtemas.destroy();
        }
        const canvasSub = document.getElementById('usersChartSubtemas');
        if (canvasSub) {
            // ajusta el contenedor si hace falta (consistente con los otros charts)
            canvasSub.parentElement.style.height = `${customHeight}px`;
            window.usersChartSubtemas = new Chart(canvasSub.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Cargando...'],
                    datasets: [{
                        label: 'Cantidad',
                        data: [0],
                        backgroundColor: [
                            '#00205C', '#8A2432', '#e0e0e0', '#4b8abe', '#b3b3b3',
                            '#c14b3e', '#e27b6f', '#f7cca1', '#6495ed', '#00bfff'
                        ],
                        borderColor: '#fff',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Cantidad de Tickets', font: { weight: 'bold' } }
                        },
                        x: {
                            title: { display: true, text: 'Subtemas de Tickets', font: { weight: 'bold' } },
                            grid: {
                                display: false // 🔹 Oculta las líneas verticales
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        datalabels: {
                            anchor: 'end',
                            align: 'top',
                            formatter: (value) => value,
                            font: {
                                weight: 'bold'
                            }
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });



        } else {
            console.warn("Canvas usersChartSubtemas no encontrado al inicializar.");
        }
    } catch (e) {
        console.error('Error inicializando usersChartSubtemas:', e);
    }

    window.maintenanceChart = new Chart(document.getElementById('maintenanceChart').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [],
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

function inicializarMonitorChart() {
    const maxPoints = 10;
    const cpuData = Array(maxPoints).fill(0);
    const memData = Array(maxPoints).fill(0);

    // Verifica que el canvas existe
    const canvas = document.getElementById('monitorChart');
    if (!canvas) {
        console.warn('El canvas monitorChart no existe en el DOM.');
        return { cpuData, memData };
    }

    // Si ya existe un gráfico, destrúyelo antes de crear uno nuevo
    if (window.monitorChart instanceof Chart) {
        window.monitorChart.destroy();
    }

    window.monitorChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: Array.from({ length: maxPoints }, () => ''),
            datasets: [
                {
                    label: 'CPU (%)',
                    data: cpuData,
                    borderColor: '#42a5f5',
                    backgroundColor: 'rgba(66,165,245,0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Memoria (%)',
                    data: memData,
                    borderColor: '#66bb6a',
                    backgroundColor: 'rgba(102,187,106,0.1)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                datalabels: {
                    anchor: 'end',      // Ancla la etiqueta al final del punto
                    align: 'top',       // La coloca arriba del punto
                    offset: 6,          // Ajusta la distancia hacia arriba (aumenta para más separación)
                    font: {
                        size: 12,       // Tamaño de la fuente
                    },
                    color: '#222',      // Color del texto
                    formatter: (value) => value ? value.toFixed(1) + '%' : ''
                }
            },
            scales: {
                y: { min: 0, max: 100, title: { display: true, text: '%' } }
            }
        }
    });

    return { cpuData, memData };
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
        // 📅 Fechas de ejemplo para obtener datos
        const fechaInicio = document.getElementById('fechaInicio')?.value || '';
        const fechaFin = document.getElementById('fechaFin')?.value || '';
        const anio = document.getElementById('selectAnio')?.value || '';

        console.log('Valor de url:', url);
        console.log('URLs usadas:', {
            conteoTickets: `${url}/api/dashboard/obtenerEstadoTickets`,
            dependencias: `${url}/api/dashboard/obtenerDependencias`,
            soportes: `${url}/api/dashboard/obtenerSoportes`,
            equipos: `${url}/api/dashboard/obtenerEquipos`,
            mantenimientos: `${url}/api/dashboard/obtenerEstadoMantenimiento`,
            modificaciones: `${url}/api/dashboard/obtenerModificaciones`,
            temas: `${url}/api/dashboard/temas-solicitados`,
            subtemas: `${url}/api/dashboard/subtemas-solicitados`
        });

        // 📡 Ejecutar todas las peticiones en paralelo
        const [
            responseConteoTickets,
            responseDependencias,
            responseSoportes,
            responseEquipos,
            responseMantenimientos,
            responseModificaciones,
            responseTemas,
            responseSubtemas
        ] = await Promise.all([
            fetch(`${url}/api/dashboard/obtenerEstadoTickets`, {
                method: 'GET',
                credentials: 'include'
            }),
            fetch(`${url}/api/dashboard/obtenerDependencias`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fechainicio: fechaInicio, fechafin: fechaFin }),
                credentials: 'include'
            }),
            fetch(`${url}/api/dashboard/obtenerSoportes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fechainicio: fechaInicio, fechafin: fechaFin }),
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
            fetch(`${url}/api/dashboard/obtenerModificaciones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ anio }),
                credentials: 'include'
            }),
            fetch(`${url}/api/dashboard/temas-solicitados`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fechainicio: fechaInicio, fechafin: fechaFin }),
                credentials: 'include'
            }),
            fetch(`${url}/api/dashboard/subtemas-solicitados`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fechainicio: fechaInicio, fechafin: fechaFin }),
                credentials: 'include'
            })
        ]);

        console.log('Subtemas Response:', responseSubtemas.status, responseSubtemas.statusText);

        // ❌ Verificar que todas las respuestas sean OK
        if (!responseConteoTickets.ok || !responseDependencias.ok ||
            !responseSoportes.ok || !responseEquipos.ok || !responseMantenimientos.ok ||
            !responseModificaciones.ok || !responseTemas.ok || !responseSubtemas.ok) {
            throw new Error('Error en una o más peticiones. Estados: ' +
                `Conteo:${responseConteoTickets.status}, Dep:${responseDependencias.status}, Sop:${responseSoportes.status}, ` +
                `Eq:${responseEquipos.status}, Mant:${responseMantenimientos.status}, Mod:${responseModificaciones.status}, ` +
                `Tem:${responseTemas.status}, Sub:${responseSubtemas.status}`);
        }

        // 📦 Procesar datos JSON
        const [
            conteoTickets,
            datosDependencias,
            datosSoportes,
            datosEquipos,
            datosMantenimientos,
            datosModificaciones,
            datosTemas,
            datosSubtemas
        ] = await Promise.all([
            responseConteoTickets.json(),
            responseDependencias.json(),
            responseSoportes.json(),
            responseEquipos.json(),
            responseMantenimientos.json(),
            responseModificaciones.json(),
            responseTemas.json(),
            responseSubtemas.json()
        ]);

        console.log('Subtemas Data detallado:', JSON.stringify(datosSubtemas, null, 2));

        // 📊 Actualizar dashboard
        actualizarTarjetas(conteoTickets.data, datosEquipos);
        actualizarGraficoSales(datosDependencias.data || []);
        actualizarGraficoTemas(datosTemas.data || []);
        actualizarGraficoSubtemas(datosSubtemas.data || []); // ← Aquí ya se actualiza el gráfico de subtemas
        actualizarGraficoMantenimientos(datosMantenimientos.data);
        actualizarGraficoModificaciones(datosModificaciones.data || []);

    } catch (error) {
        console.error('Error al cargar datos:', error);
        alert('Error al cargar datos: ' + error.message);
    }
}


function actualizarGraficoSubtemas(subtemas) {
    requestAnimationFrame(() => {
        console.log('Ejecutando actualizarGraficoSubtemas con datos:', subtemas);

        if (!Array.isArray(subtemas)) {
            console.warn('Datos de subtemas no válidos:', subtemas);
            subtemas = [];
        }

        const hasData = subtemas.length > 0;
        const labels = hasData ? subtemas.map(s => s.nombreSubtema || 'Sin nombre') : ['Sin datos'];
        const values = hasData ? subtemas.map(s => s.cantidad || 0) : [0];

        console.log('Labels:', labels);
        console.log('Data:', values);

        const canvas = document.getElementById('usersChartSubtemas');
        if (!canvas) {
            console.error('Canvas con id="usersChartSubtemas" no encontrado');
            return;
        }

        // Si por alguna razón no existió placeholder, lo creamos aquí (fallback)
        if (!window.usersChartSubtemas) {
            console.warn('usersChartSubtemas no existía — creando fallback.');
            window.usersChartSubtemas = new Chart(canvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Cantidad',
                        data: values,
                        backgroundColor: 'rgba(66, 165, 245, 0.6)',
                        borderColor: 'rgba(66, 165, 245, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Cantidad' } },
                        x: { title: { display: true, text: 'Subtemas' } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
            return; // ya quedó creado con labels/values correctos
        }

        // Asegurarnos que la estructura .data y datasets existen antes de asignar
        if (!window.usersChartSubtemas.data) window.usersChartSubtemas.data = { labels: [], datasets: [{ data: [] }] };
        if (!Array.isArray(window.usersChartSubtemas.data.datasets)) window.usersChartSubtemas.data.datasets = [{ data: [] }];
        if (!window.usersChartSubtemas.data.datasets[0]) window.usersChartSubtemas.data.datasets[0] = { data: [] };

        // Actualizar valores
        window.usersChartSubtemas.data.labels = labels;
        window.usersChartSubtemas.data.datasets[0].data = values;

        // Opcional: cambia color cuando no hay datos
        if (!hasData) {
            window.usersChartSubtemas.data.datasets[0].backgroundColor = ['#e0e0e0'];
            window.usersChartSubtemas.data.datasets[0].borderColor = ['#bdbdbd'];
        }

        window.usersChartSubtemas.update();
    });
}


function actualizarGraficoTemas(temas) {
    requestAnimationFrame(() => {
        if (!temas || !Array.isArray(temas)) {
            console.warn('Datos de temas no válidos:', temas);
            return;
        }

        // Extraer nombres de temas y cantidades
        const labels = temas.map(tema => tema.nombreTema);
        const data = temas.map(tema => tema.cantidad);

        // Actualizar el gráfico de barras
        if (window.usersChart) {
            window.usersChart.data.labels = labels;
            window.usersChart.data.datasets[0].data = data;
            window.usersChart.options.scales.x.title.text = 'Temas de Tickets'; // Actualizar título del eje X
            window.usersChart.update();
        } else {
            console.error('El gráfico usersChart no está inicializado');
        }
    });
}

function actualizarGraficoMantenimientos(mantenimientosData) {
    requestAnimationFrame(() => {
        // Preparar datos para el gráfico
        const labels = ['Vigente', 'Próximos', 'Atrasados'];
        const data = [
            mantenimientosData.conteos?.alDia || 0,
            mantenimientosData.conteos?.proximos || 0,
            mantenimientosData.conteos?.atrasados || 0
        ];

        // Colores para cada estado (fijos)
        const backgroundColors = ['#4CAF50', '#FFC107', '#F44336'];

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

        // Extraer el valor de progreso (admite "46%" o 46)
        const raw = mantenimientosData.progreso ?? '0';
        let progreso = parseFloat(String(raw).replace('%', '').trim());
        if (Number.isNaN(progreso)) progreso = 0;
        // Clamp entre 0 y 100
        progreso = Math.max(0, Math.min(100, Math.round(progreso)));

        const equiposProximoAno = mantenimientosData.equiposProximoAno ?? 0;
        const totalEquipos = mantenimientosData.conteos?.total ?? 0;

        // Texto y atributos ARIA
        if (progresoText) progresoText.textContent = `${progreso}%`;
        if (progresoBar) {
            progresoBar.style.width = `${progreso}%`;
            progresoBar.setAttribute('aria-valuenow', String(progreso));
            progresoBar.setAttribute('aria-valuemin', '0');
            progresoBar.setAttribute('aria-valuemax', '100');

            // Remover clases de background previas y añadir la correcta
            progresoBar.classList.remove('bg-danger', 'bg-warning', 'bg-success');
            if (progreso < 20) {
                // Menos del 20% -> rojo
                progresoBar.classList.add('bg-danger');
            } else if (progreso < 70) {
                // Del 20% (incluido) hasta menos de 70% -> amarillo
                progresoBar.classList.add('bg-warning');
            } else {
                // 70% o más -> verde
                progresoBar.classList.add('bg-success');
            }
        }

        if (progresoDetail) {
            progresoDetail.textContent = `${equiposProximoAno} de ${totalEquipos} equipos realizados`;
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

