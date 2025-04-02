document.addEventListener('DOMContentLoaded', () => {
    inicializarDashboard();
});
async function inicializarDashboard() {
    inicializarUI();
    inicializarGraficos();
    await cargarTicketsDashboard();
    //setInterval(cargarTickets, 30000);
}

function inicializarUI() {
    document.getElementById('ticketsActivos').textContent = '...';
    document.getElementById('ticketsGestionados').textContent = '...';
    document.getElementById('ticketsPendientes').textContent = '...';
}

function inicializarGraficos() {
    if (typeof Chart === 'undefined') {
        console.error('Error: Chart.js no está cargado correctamente.');
        return;
    }

    if (typeof ChartDataLabels === 'undefined') {
        console.error('Error: El plugin ChartDataLabels no está cargado.');
        return;
    }

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

    window.salesChart = new Chart(document.getElementById('salesChart').getContext('2d'), {
        type: 'pie',
        data: { labels: [], datasets: [{ data: [], backgroundColor: ['#afeeee', '#e0ffff', '#b0e0e6', '#87cefa', '#add5fa'] }] },
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
                    }
                },
                datalabels: {
                    color: '#000',
                    font: { size: 12 },
                    formatter: (value, context) => {
                        const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        return `${((value / total) * 100).toFixed(2)}%`;
                    }
                }
            },
            layout: { padding: { left: 20, right: 20 } }
        }
    });

    window.usersChart = new Chart(document.getElementById('usersChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Norte', 'Sur', 'Este', 'Oeste'],
            datasets: [{ label: 'Usuarios', data: [15, 20, 10, 30], backgroundColor: ['#afeeee', '#e0ffff', '#b0e0e6', '#87cefa'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
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

function actualizarTarjetas(tickets) {
    requestAnimationFrame(() => {
        document.getElementById('ticketsActivos').textContent = tickets.filter(ticket => ticket.estado === "CREADO").length;
        document.getElementById('ticketsGestionados').textContent = tickets.filter(ticket => ticket.estado === "CERRADO").length;
        document.getElementById('ticketsPendientes').textContent = tickets.filter(ticket => ticket.estado === "LEIDO").length;
    });
}

function actualizarGraficoSales(tickets) {
    requestAnimationFrame(() => {
        const fechaActual = new Date();
        const fechaHace6Dias = new Date();
        fechaHace6Dias.setDate(fechaActual.getDate() - 6);

        const ticketsFiltrados = tickets.filter(ticket => {
            const fechaInicioTicket = new Date(ticket.fechainicio);
            return fechaInicioTicket >= fechaHace6Dias && fechaInicioTicket <= fechaActual;
        });

        const dependenciasMap = new Map();
        ticketsFiltrados.forEach(ticket => {
            const iddependencia = ticket.iddependencia;
            const nombreDependencia = ticket.nombreDependencia;
            if (dependenciasMap.has(iddependencia)) {
                dependenciasMap.set(iddependencia, {
                    count: dependenciasMap.get(iddependencia).count + 1,
                    nombreDependencia,
                });
            } else {
                dependenciasMap.set(iddependencia, { count: 1, nombreDependencia });
            }
        });

        const dependenciasArray = Array.from(dependenciasMap, ([iddependencia, data]) => ({
            iddependencia,
            count: data.count,
            nombreDependencia: data.nombreDependencia,
        }));

        dependenciasArray.sort((a, b) => b.count - a.count);
        const top5Dependencias = dependenciasArray.slice(0, 5);

        if (window.salesChart) {
            window.salesChart.data.labels = top5Dependencias.map(dep => dep.nombreDependencia);
            window.salesChart.data.datasets[0].data = top5Dependencias.map(dep => dep.count);
            window.salesChart.update();
        } else {
            console.error("Error: salesChart no está definido.");
        }
    });
}

// if (!window.dashboardInicializado) {
//     window.dashboardInicializado = true;
//     inicializarDashboard();
// } else {
//     console.log("dashboard.js ya fue ejecutado, evitando duplicación.");
// }
