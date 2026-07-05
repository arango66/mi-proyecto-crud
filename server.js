require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(cors());
app.use(express.json());

// 1. CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS
// Intenta servir desde la raíz del proyecto o desde carpetas comunes (public/frontend)
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'frontend')));

// CONFIGURACIÓN DE BASE DE DATOS (Render o Local)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:3333/crud_db'
});

// Inicializar tabla si no existe
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL
            );
        `);
        console.log("Tabla 'usuarios' verificada.");
    } catch (err) {
        console.error("Error base de datos:", err);
    }
};
initDb();

// ================= RUTAS DE LA API =================

// Obtener usuarios
app.get('/usuarios', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM usuarios ORDER BY id ASC');
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crear usuario
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

// Actualizar usuario
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

// Eliminar usuario
app.delete('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
        res.json({ mensaje: "Usuario eliminado correctamente" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= MANEJO DEL FRONTEND =================

// Si entra a la raíz o cualquier otra ruta que no sea la API, le manda el index.html
app.get('*', (req, res) => {
    // Busca el index en la raíz
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
        if (err) {
            // Si no está en la raíz, lo busca en 'public'
            res.sendFile(path.join(__dirname, 'public', 'index.html'), (err2) => {
                if (err2) {
                    // Si no, lo busca en 'frontend'
                    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
                }
            });
        }
    });
});

// Levantar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});