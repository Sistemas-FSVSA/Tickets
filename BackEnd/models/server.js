const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const { createServer } = require("http");
const socketIo = require("socket.io");

class Server {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);

    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map(origin => origin.trim())
      : [];

    this.io = socketIo(this.server, {
      cors: {
        origin: function (origin, callback) {
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
    this.monitorSetup();
  }

  middlewares() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map(origin => origin.trim())
      : [];

    this.app.use(
      cors({
        origin: function (origin, callback) {
          if (!origin) {
            return callback(null, true);
          }

          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Origen no permitido por CORS'));
          }
        },
        methods: ["POST", "GET", "PUT", "DELETE", "PATCH", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
      })
    );

    this.app.use(cookieParser());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

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
    const { setupMonitor } = require("../controllers/dashboard/monitorController");
    setupMonitor(this.io);
  }

  listen() {
    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`Servidor escuchando en puerto ${this.port}`);
    });
  }
}

module.exports = Server;