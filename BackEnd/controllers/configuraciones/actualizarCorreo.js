const { sistemasPoolPromise } = require('../../db/conexion');

// Actualizar configuración de correo
const actualizarCorreo = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
        const pool = await sistemasPoolPromise;

        // 1. Verificar que existe el registro a actualizar
        const checkResult = await pool.request()
            .input('id', id)
            .query('SELECT idconfigemail FROM configemail WHERE idconfigemail = @id');

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Configuración de correo no encontrada'
            });
        }

        // 2. Construir la consulta dinámica basada en los campos proporcionados
        let updateQuery = 'UPDATE configemail SET ';
        const inputs = {};
        const params = [];

        if (updateData.proveedor) {
            params.push('proveedor = @proveedor');
            inputs.proveedor = updateData.proveedor;
        }

        if (updateData.correo) {
            params.push('correo = @correo');
            inputs.correo = updateData.correo;
        }

        if (updateData.password) {
            params.push('password = @password');
            inputs.password = updateData.password;
        }

        if (typeof updateData.estado !== 'undefined') {
            params.push('estado = @estado');
            inputs.estado = Number(updateData.estado); // <-- conversión explícita a número
        }

        // Si no hay campos válidos para actualizar
        if (params.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron campos válidos para actualizar'
            });
        }

        updateQuery += params.join(', ') + ' WHERE idconfigemail = @id';
        inputs.id = id;

        // 3. Ejecutar la actualización
        const request = pool.request();

        // Agregar todos los inputs a la solicitud
        Object.keys(inputs).forEach(key => {
            request.input(key, inputs[key]);
        });

        await request.query(updateQuery);

        // 4. Obtener y devolver el registro actualizado
        const updatedConfig = await pool.request()
            .input('id', id)
            .query('SELECT idconfigemail, proveedor, correo, password, estado FROM configemail WHERE idconfigemail = @id');

        res.status(200).json({
            success: true,
            message: 'Configuración actualizada correctamente',
            data: updatedConfig.recordset[0]
        });

    } catch (error) {
        console.error('Error al actualizar configuración de correo:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al actualizar configuración',
            error: error.message
        });
    }
};

module.exports = { actualizarCorreo };