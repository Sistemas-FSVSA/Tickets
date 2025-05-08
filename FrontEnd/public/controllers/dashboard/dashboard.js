document.addEventListener('DOMContentLoaded', () => {
    inicializarDashboard();
});

async function inicializarDashboard() {
    inicializarUI();
    inicializarGraficos();

    // Establecer fechas predeterminadas
    const fechaActual = new Date();
    const fechaInicio = new Date(fechaActual);
    fechaInicio.setDate(fechaActual.getDate() - 6); // Una semana atrás

    document.getElementById('fechaInicio').value = fechaInicio.toISOString().split('T')[0];
    document.getElementById('fechaFin').value = fechaActual.toISOString().split('T')[0];

    await cargarTicketsDashboard();
    //setInterval(cargarTickets, 30000);
}

async function cargarTicketsDashboard() {
    try {
        const response = await fetch(`${url}/api/tickets/obtenerTickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!response.ok) throw new Error(`Error al obtener tickets: ${response.statusText}`);

        const result = await response.json();
        const tickets = result.tickets || [];

        actualizarTarjetas(tickets);
        actualizarGraficoSales(tickets);

    } catch (error) {
        console.error('Error al cargar los tickets:', error);
    }
}

function inicializarUI() {
    document.getElementById('ticketsActivos').textContent = '...';
    document.getElementById('ticketsGestionados').textContent = '...';
    document.getElementById('ticketsPendientes').textContent = '...';
}

function inicializarGraficos() {
    Chart.register(ChartDataLabels);
    const customHeight = 500;
    document.getElementById('salesChart').parentElement.style.height = `${customHeight}px`;
    document.getElementById('usersChart').parentElement.style.height = `${customHeight}px`;

    // Verifica si los gráficos existen antes de destruirlos
    if (window.salesChart instanceof Chart) {
        window.salesChart.destroy();
    }
    if (window.usersChart instanceof Chart) {
        window.usersChart.destroy();
    }

    console.log('Inicializando salesChart');

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
                    
                        console.log(`Toggle visibilidad: ${legendItem.text}`);
                    
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
                            console.log(`Oculto slice: ${chart.data.labels[index]} (value: ${currentValue})`);
                            return '';
                        }

                        if (totalVisible === 0) return '0%';

                        const porcentaje = (currentValue / totalVisible) * 100;
                        console.log(`Calculando % para ${chart.data.labels[index]}: ${porcentaje.toFixed(2)}%`);
                        return `${porcentaje.toFixed(2)}%`;
                    }
                }
            },
            layout: { padding: { left: 20, right: 20 } }
        },
        plugins: [ChartDataLabels]
    });

    // window.usersChart = new Chart(document.getElementById('usersChart').getContext('2d'), {
    //     type: 'bar',
    //     data: {
    //         labels: ['Norte', 'Sur', 'Este', 'Oeste'],
    //         datasets: [{ label: 'Usuarios', data: [15, 20, 10, 30], backgroundColor: ['#afeeee', '#e0ffff', '#b0e0e6', '#87cefa'] }]
    //     },
    //     options: { responsive: true, maintainAspectRatio: false }
    // });
}

function actualizarTarjetas(tickets) {
    requestAnimationFrame(() => {
        document.getElementById('ticketsActivos').textContent = tickets.filter(ticket => ticket.estado === "CREADO").length;
        document.getElementById('ticketsGestionados').textContent = tickets.filter(ticket => ticket.estado === "CERRADO").length;
        document.getElementById('ticketsPendientes').textContent = tickets.filter(ticket => ticket.estado === "LEIDO").length;
    });
}

function actualizarGraficoSales(tickets) {
    requestAnimationFrame(() => {
        const fechaInicioInput = document.getElementById('fechaInicio').value;
        const fechaFinInput = document.getElementById('fechaFin').value;

        const fechaActual = new Date();
        const fechaFin = fechaFinInput ? new Date(fechaFinInput) : fechaActual;
        const fechaInicio = fechaInicioInput ? new Date(fechaInicioInput) : new Date(fechaActual.setDate(fechaActual.getDate() - 6));

        const ticketsFiltrados = tickets.filter(ticket => {
            const fechaInicioTicket = new Date(ticket.fechainicio);
            return fechaInicioTicket >= fechaInicio && fechaInicioTicket <= fechaFin;
        });

        const dependenciasMap = new Map();
        ticketsFiltrados.forEach(ticket => {
            const iddependencia = ticket.iddependencia;
            const nombreDependencia = ticket.nombreDependencia;
            if (dependenciasMap.has(iddependencia)) {
                dependenciasMap.get(iddependencia).count++;
            } else {
                dependenciasMap.set(iddependencia, { count: 1, nombreDependencia });
            }
        });

        const dependenciasArray = Array.from(dependenciasMap.values());
        dependenciasArray.sort((a, b) => b.count - a.count);
        const top5 = dependenciasArray.slice(0, 5);

        if (window.salesChart) {
            window.salesChart.data.labels = top5.map(dep => dep.nombreDependencia);
            window.salesChart.data.datasets[0].data = top5.map(dep => dep.count);
            window.salesChart.update();
        }
    });
}

document.getElementById('fechaInicio').addEventListener('change', cargarTicketsDashboard);
document.getElementById('fechaFin').addEventListener('change', cargarTicketsDashboard);