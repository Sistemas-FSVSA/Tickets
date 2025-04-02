const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.cookies.authToken; // Lee el token de las cookies
    const secretKey = process.env.JWT_SECRET; // Obtiene la clave secreta del .env

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado.' });
        }

        req.user = user;  // Almacena la información del usuario en la solicitud
        next();  // Pasa al siguiente middleware
    });
};

module.exports = authenticateToken;
