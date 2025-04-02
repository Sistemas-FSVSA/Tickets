import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url'; // Para manejar rutas
import * as dotenv from 'dotenv'; // Importa dotenv como un módulo
import fetch from 'node-fetch';
dotenv.config(); // Carga las variables de entorno

const app = express();


// Configuración de rutas y directorios
const __filename = fileURLToPath(import.meta.url); // Ruta del archivo actual
const __dirname = path.dirname(__filename); // Directorio del archivo actual

// Configuración del motor de plantillas
app.engine('hbs', exphbs.engine({ extname: '.hbs', defaultLayout: 'main', partialsDir: __dirname + '/views/partials/' }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(cookieParser());
app.use(express.json());

// Clave secreta para el token JWT
const secretKey = process.env.JWT_SECRET;

// Define rutas públicas correctamente
const publicRoutes = ['/', '/login', '/tickets/nuevoticket', '/tickets/infoticket', '/config.js'];

// Middleware global para proteger rutas privadas
app.use((req, res, next) => {
    const token = req.cookies.authToken;

    // Permitir acceso libre a rutas públicas
    if (publicRoutes.includes(req.path)) {
        return next();
    }

    // Si no hay token, redirigir al login
    if (!token) {
        return res.redirect('/login');
    }

    // Verificar token para rutas privadas
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.redirect('/login');
        }
        req.user = decoded;
        next();
    });
});


// Rutas públicas
app.get('/', (req, res) => {
    res.render('index', { layout: false });
});

app.get('/login', (req, res) => {
    res.render('login', { layout: false });
});

app.get('/tickets/nuevoticket', async (req, res) => {
    try {
        const ahora = new Date();
        const fechaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000); // Ajuste de zona horaria
        
        // Determinar la URL de la API según el host de la petición
        const host = req.headers.host;
        let apiUrl;

        if (host.includes(process.env.FRONTEND_HOST)) {
            apiUrl = process.env.API_URL_HOST;
        } else if (host.includes(process.env.FRONTEND_IP)) {
            apiUrl = process.env.API_URL_IP;
        } else {
            apiUrl = process.env.API_URL_IP; // Fallback si no hay coincidencias
        }

        const response = await fetch(`${apiUrl}/api/index/horario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fechaHora: fechaLocal.toISOString() }), // Enviar en ISO
            credentials: 'include'
        });

        const data = await response.json();

        if (data.estado === "true") {
            res.render('tickets/newticket', { layout: false });
        } else {
            res.redirect('/'); // Redirigir si el horario no está disponible
        }
    } catch (error) {
        console.error("Error al validar horario:", error);
        res.redirect('/'); // Redirigir en caso de error
    }
});


app.get('/tickets/infoticket', (req, res) => {
    res.render('tickets/infoticket', { layout: false });
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

app.get('/config.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');

    const host = req.headers.host; // Obtiene la URL de origen
    let apiUrl;

    if (host.includes(process.env.FRONTEND_HOST)) {
        apiUrl = process.env.API_URL_HOST;
    } else if (host.includes(process.env.FRONTEND_IP)) {
        apiUrl = process.env.API_URL_IP;
    } else {
        apiUrl = process.env.API_URL_IP; // Fallback si no hay coincidencias
    }

    res.send(`window.env = { API_URL: "${apiUrl}" };`);
});


// Iniciar el servidor
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
