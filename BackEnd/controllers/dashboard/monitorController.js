const osu = require('node-os-utils');
const si = require('systeminformation');

module.exports = {
  setupMonitor: (io) => {
    async function getMetrics() {
      try {
        const cpu = await osu.cpu.usage();
        const mem = await osu.mem.info();
        const cpuCount = osu.cpu.count(); // núcleos
        const cpuModel = osu.cpu.model(); // modelo (puede ser básico)
        // node-os-utils no da consumo de red por segundo, para eso usa 'systeminformation'

        // Consumo de red
        const netStats = await si.networkStats();
        const netRx = netStats[0]?.rx_sec || 0; // bytes recibidos por segundo
        const netTx = netStats[0]?.tx_sec || 0; // bytes enviados por segundo

        return {
          cpu: cpu.toFixed(2),
          freeMemMb: mem.freeMemMb.toFixed(2),
          totalMemMb: mem.totalMemMb.toFixed(2),
          usedMemMb: (mem.totalMemMb - mem.freeMemMb).toFixed(2),
          cpuCount,
          cpuModel,
          netRx,
          netTx
        };
      } catch (error) {
        console.error('Error obteniendo métricas:', error);
        return null;
      }
    }

    // Enviar métricas cada 2 segundos
    const interval = setInterval(async () => {
      const metrics = await getMetrics();
      if (metrics) {
        io.emit('system-metrics', metrics);
      }
    }, 2000);

    // Manejar conexiones de Socket.io
    io.on('connection', (socket) => {
      console.log(`Cliente conectado al monitor: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
      });

      // Opcional: Manejar eventos personalizados
      socket.on('request-metrics', async () => {
        const metrics = await getMetrics();
        socket.emit('current-metrics', metrics);
      });
    });

    // Limpiar intervalo al cerrar
    process.on('SIGINT', () => {
      clearInterval(interval);
    });
  }
};