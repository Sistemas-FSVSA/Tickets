const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT;
    this.indexPath = "/api/index";
    this.ticketsPath = "/api/tickets";
    this.usuariosPath = "/api/usuarios";
    this.inventarioPath = "/api/inventario";
    this.mantenimientosPath = "/api/mantenimientos";
    this.automaticosPath = "/api/automaticos";
    this.modificacionesPath = "/api/modificaciones";
    this.dashboardPath = "/api/dashboard";

    this.middlewares();
    this.routes();
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

    // Servir la carpeta "uploads" como estática
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
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
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log(`Escuchando desde http://localhost:${this.port}`);
      console.log(`Archivos estáticos disponibles en http://localhost:${this.port}/uploads`);
    });
  }
}

module.exports = Server;
