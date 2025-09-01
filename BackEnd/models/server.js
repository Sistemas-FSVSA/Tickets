const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const { createServer } = require("http"); // Añadir
const socketIo = require("socket.io"); // Añadir

class Server {
  constructor() {
    this.app = express();
    this.server = createServer(this.app); 
    // Obtener los orígenes permitidos desde la variable de entorno y convertirlos en array
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : [];

    this.io = socketIo(this.server, {
      cors: {
      origin: function (origin, callback) {
        // Permitir solicitudes sin origen (como Postman o herramientas locales)
        if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        } else {
        callback(new Error('Origen no permitido por CORS'));
        }
      },
      methods: ["GET", "POST"],
      credentials: true
      },
      transports: ['websocket', 'polling'],
      allowUpgrades: true,
      pingInterval: 25000,
      pingTimeout: 20000
    });
    this.port = process.env.PORT;
    this.indexPath = "/api/index";
    this.ticketsPath = "/api/tickets";
    this.usuariosPath = "/api/usuarios";
    this.inventarioPath = "/api/inventario";
    this.mantenimientosPath = "/api/mantenimientos";
    this.automaticosPath = "/api/automaticos";
    this.modificacionesPath = "/api/modificaciones";
    this.dashboardPath = "/api/dashboard";
    this.configuracionesPath = "/api/configuraciones";
    this.bodegaPath = "/api/bodega";

    this.middlewares();
    this.routes();
    this.monitorSetup(); //funcion para el monitor
  }

  middlewares() {

    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : [];

    this.app.use(
      cors({
        origin: function (origin, callback) {
          // Permitir solicitudes sin origen (como Postman o herramientas locales)
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Origen no permitido por CORS'));
          }
        },
        methods: ["POST", "GET", "PUT", "DELETE", "PATCH"],
        credentials: true, // Habilita el envío de cookies y credenciales
      })
    );

    this.app.use(cookieParser());
    this.app.use(express.json());

    // Servir la carpeta "uploads" como estática desde la ruta de red
    this.app.use(
      '/uploads',
      express.static('\\\\' + process.env.UPLOAD_PATH)
    );
  }

  routes() {
    this.app.use(this.indexPath, require("../routes/index"));
    this.app.use(this.ticketsPath, require("../routes/tickets"));
    this.app.use(this.usuariosPath, require("../routes/usuarios"));
    this.app.use(this.inventarioPath, require("../routes/inventario"));
    this.app.use(this.mantenimientosPath, require("../routes/mantenimientos"));
    this.app.use(this.automaticosPath, require("../routes/automaticos"));
    this.app.use(this.modificacionesPath, require("../routes/modificaciones"));
    this.app.use(this.dashboardPath, require("../routes/dashboard"));
    this.app.use(this.configuracionesPath, require("../routes/configuraciones"));
    this.app.use(this.bodegaPath, require("../routes/bodega"));
  }

  monitorSetup() {
    // Pasamos io al controlador del dashboard
    const { setupMonitor } = require("../controllers/dashboard/monitorController");
    setupMonitor(this.io);
  }

  listen() {
    this.server.listen(this.port, () => {
      console.log(`Escuchando desde http://localhost:${this.port}`);
      console.log(`Archivos estáticos disponibles en http://localhost:${this.port}/uploads`);
    });
  }
}

module.exports = Server;