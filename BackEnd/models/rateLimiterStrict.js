const rateLimit = require('express-rate-limit');

const rateLimiterStrict = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 1, // Máximo 1 solicitud por minuto
  standardHeaders: true, // Enviar cabeceras con info del rate limit
  legacyHeaders: false, // Deshabilitar cabeceras X-RateLimit
  handler: (req, res) => {
    res.status(429).json({ error: "Demasiadas solicitudes. Intenta nuevamente en un minuto." });
  }
});

module.exports = rateLimiterStrict;
