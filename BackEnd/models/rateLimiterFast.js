const rateLimit = require('express-rate-limit');

const rateLimiterFast = rateLimit({
  windowMs: 1000, // 1 segundo
  max: 100, // Máximo 100 solicitudes por segundo
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: "Demasiadas solicitudes rápidas. Intenta nuevamente." });
  }
});

module.exports = rateLimiterFast;
