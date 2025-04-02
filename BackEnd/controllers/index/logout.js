const logout = (req, res) => {
    try {
        // Borrar la cookie 'authToken'
        res.clearCookie('authToken', {
            httpOnly: true, // Asegura que solo se puede acceder desde el backend
            secure: false,  // Cambiar a `true` si usas HTTPS
            sameSite: 'strict', // Igual que cuando se creó
            path: '/', // Asegúrate de que el path sea igual
        });

        // Respuesta indicando que el cierre de sesión fue exitoso
        res.status(200).json({ estado: 'ok', mensaje: 'Sesión cerrada correctamente.' });
    } catch (error) {
        console.error('Error durante el logout:', error);
        res.status(500).json({ estado: 'error', mensaje: 'Ocurrió un error al cerrar sesión.' });
    }
};

module.exports = { logout };

