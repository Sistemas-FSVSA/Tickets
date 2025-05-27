const osu = require('node-os-utils');

module.exports = {
  setupMonitor: (io) => {
    async function getMetrics() {
      try {
        const cpu = await osu.cpu.usage();
        const mem = await osu.mem.info();
        return {
          cpu: cpu.toFixed(2),
          freeMem: mem.freeMemMb.toFixed(2),
          totalMem: mem.totalMemMb.toFixed(2),
          usedMem: (mem.totalMemMb - mem.freeMemMb).toFixed(2)
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