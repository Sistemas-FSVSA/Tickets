import express from "express";
import exphbs from "express-handlebars";
import path from "path";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url"; // Para manejar rutas
import * as dotenv from "dotenv"; // Importa dotenv como un módulo
import fetch from "node-fetch";
dotenv.config(); // Carga las variables de entorno

const app = express();

// Configuración de rutas y directorios
const __filename = fileURLToPath(import.meta.url); // Ruta del archivo actual
const __dirname = path.dirname(__filename); // Directorio del archivo actual

// Configuración del motor de plantillas
app.engine(
  "hbs",
  exphbs.engine({
    extname: ".hbs",
    defaultLayout: "main",
    partialsDir: __dirname + "/views/partials/",
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Middleware
app.use(cookieParser());
app.use(express.json());

// Clave secreta para el token JWT
const secretKey = process.env.JWT_SECRET;

// Define rutas públicas correctamente
const publicRoutes = [
  "/",
  "/login",
  "/tickets/nuevoticket",
  "/tickets/infoticket",
  "/config.js",
];

// Middleware global para proteger rutas privadas
app.use((req, res, next) => {
  const token = req.cookies.authToken;

  // Permite el acceso sin token a rutas públicas
  if (publicRoutes.includes(req.path)) {
    // Si el usuario está en '/' (login) y tiene un token válido, redirigir a '/inicio'
    if (req.path === "/login" && token) {
      return jwt.verify(token, secretKey, (err) => {
        if (!err) {
          return res.redirect("/dashboard/dashboard");
        }
        next();
      });
    }
    return next();
  }

  // Validar el token para rutas privadas
  if (!token) {
    return res.redirect("/login"); // Redirige al login si no hay token
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
        return res.redirect('/login'); // Redirige si el token no es válido
    }
    req.user = decoded; // Almacena la información del token decodificado
    next(); // Continúa al siguiente middleware o controlador
});
});

// Rutas públicas
app.get("/", (req, res) => {
  res.render("index", { layout: false });
});

app.get("/login", (req, res) => {
  res.render("login", { layout: false });
});

// NOTA: se quitó la validación de horario (llamaba a `${apiUrl}/api/index/horario`,
// endpoint que ya no existe en el backend nuevo). Ahora la vista se renderiza
// directo. Si en algún momento se necesita restringir el horario de creación
// de tickets, habría que reimplementarlo contra un endpoint real del backend
// actual (no hay ninguno documentado para esto todavía).
app.get("/tickets/nuevoticket", (req, res) => {
  res.render("tickets/newticket", { layout: false });
});

app.get("/tickets/infoticket", (req, res) => {
  res.render("tickets/infoticket", { layout: false });
});

// Rutas privadas (protegidas automáticamente)
app.get("/tickets/tickets", (req, res) => {
  if (req.xhr) {
    return res.render("tickets/tickets", { layout: false }); // Solo la vista
  }
  res.render("tickets/tickets");
});

app.get("/dashboard/dashboard", (req, res) => {
  if (req.xhr) {
    return res.render("dashboard/dashboard", { layout: false }); // Solo la vista
  }
  res.render("dashboard/dashboard");
});

app.get("/tickets/consultastickets", (req, res) => {
  if (req.xhr) {
    return res.render("tickets/consultastickets", { layout: false }); // Solo la vista
  }
  res.render("tickets/consultastickets");
});

app.get("/tickets/registrotickets", (req, res) => {
  if (req.xhr) {
    return res.render("tickets/registrotickets", { layout: false }); // Solo la vista
  }
  res.render("tickets/registrotickets");
});

app.get("/usuarios/usuarios/", (req, res) => {
  if (req.xhr) {
    return res.render("usuarios/usuarios", { layout: false }); // Solo la vista
  }
  res.render("usuarios/usuarios");
});

app.get("/usuarios/usuario/", (req, res) => {
  if (req.xhr) {
    return res.render("usuarios/usuario", { layout: false }); // Solo la vista
  }
  res.render("usuarios/usuario");
});

app.get("/inventario/consultainventario", (req, res) => {
  if (req.xhr) {
    return res.render("inventario/consultainventario", { layout: false }); // Solo la vista
  }
  res.render("inventario/consultainventario");
});

app.get("/inventario/registro", (req, res) => {
  if (req.xhr) {
    return res.render("inventario/registro", { layout: false }); // Solo la vista
  }
  res.render("inventario/registro");
});

app.get("/mantenimientos/mantenimiento", (req, res) => {
  if (req.xhr) {
    return res.render("mantenimientos/mantenimiento", { layout: false }); // Solo la vista
  }
  res.render("mantenimientos/mantenimiento");
});

app.get("/mantenimientos/hvc", (req, res) => {
  if (req.xhr) {
    return res.render("mantenimientos/hvc", { layout: false }); // Solo la vista
  }
  res.render("mantenimientos/hvc");
});

app.get("/modificaciones/modificaciones", (req, res) => {
  if (req.xhr) {
    return res.render("modificaciones/modificaciones", { layout: false }); // Solo la vista
  }
  res.render("modificaciones/modificaciones");
});

app.get("/configuraciones/consultarcorreo", (req, res) => {
  if (req.xhr) {
    return res.render("configuraciones/consultarcorreo", { layout: false }); // Solo la vista
  }
  res.render("configuraciones/consultarcorreo");
});

app.get("/configuraciones/festivos", (req, res) => {
  if (req.xhr) {
    return res.render("configuraciones/festivos", { layout: false }); // Solo la vista
  }
  res.render("configuraciones/festivos");
});

app.get("/configuraciones/horario", (req, res) => {
  if (req.xhr) {
    return res.render("configuraciones/horario", { layout: false }); // Solo la vista
  }
  res.render("configuraciones/horario");
});

app.get("/bodega/consultarbodega", (req, res) => {
  if (req.xhr) {
    return res.render("bodega/consultarbodega", { layout: false }); // Solo la vista
  }
  res.render("bodega/consultarbodega");
});

app.get("/config.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");

  const host = req.headers.host; // Obtiene la URL de origen
  let apiUrl;

  if (host.includes(process.env.FRONTEND_HOST)) {
    apiUrl = process.env.API_URL_HOST;
  } else if (host.includes(process.env.FRONTEND_IP)) {
    apiUrl = process.env.API_URL_IP;
  } else {
    apiUrl = process.env.API_URL_IP; // Fallback si no hay coincidencias
  }

  // Backend NUEVO (solo para los endpoints de tickets que ya migraron:
  // /system/tickets, /system/tickets/topics, /system/tickets/subtopics,
  // /auth/dependency). El resto del sitio sigue usando API_URL de arriba,
  // que apunta al backend viejo — por eso es una variable aparte y no un
  // reemplazo de "apiUrl".
  const ticketsApiUrl = process.env.TICKETS_API_URL_IP;

  res.send(`window.env = { API_URL: "${apiUrl}", TICKETS_API_URL: "${ticketsApiUrl}" };`);
});

app.get("/bodega/registrobodega", (req, res) => {
  if (req.xhr) {
    return res.render("bodega/registrobodega", { layout: false }); // Vista sin layout (AJAX)
  }
  res.render("bodega/registrobodega"); // Vista con el layout principal
});


// Iniciar el servidor
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});