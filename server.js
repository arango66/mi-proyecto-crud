require('dotenv').config(); // Intenta cargar el archivo .env si está disponible
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// CONFIGURACIÓN DINÁMICA: Usa Render en producción o tu localhost en casa
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:3333/crud_db'
});

// Crear la tabla si no existe al iniciar el servidor
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL
            );
        `);
        console.log("Tabla 'usuarios' verificada/creada con éxito.");
    } catch (err) {
        console.error("Error al crear la tabla:", err);
    }
};
initDb();

// 1. LEER (GET) - Obtener todos los usuarios
app.get('/usuarios', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM usuarios ORDER BY id ASC');
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. CREAR (POST) - Añadir un nuevo usuario
app.post('/usuarios', async (req, res) => {
    const { nombre, email } = req.body;
    try {
        const nuevoUsuario = await pool.query(
            'INSERT INTO usuarios (nombre, email) VALUES ($1, $2) RETURNING *',
            [nombre, email]
        );
        res.status(201).json(nuevoUsuario.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. ACTUALIZAR (PUT) - Editar un usuario por ID
app.put('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, email } = req.body;
    try {
        const usuarioActualizado = await pool.query(
            'UPDATE usuarios SET nombre = $1, email = $2 WHERE id = $3 RETURNING *',
            [nombre, email, id]
        );
        res.json(usuarioActualizado.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. ELIMINAR (DELETE) - Borrar un usuario por ID
app.delete('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
        res.json({ mensaje: "Usuario eliminado correctamente" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});