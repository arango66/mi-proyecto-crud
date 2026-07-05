require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta actual
app.use(express.static(path.join(__dirname)));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:3333/crud_db'
});

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

// Rutas de la API
app.get('/usuarios', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM usuarios ORDER BY id ASC');
        res.json(resultado.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/usuarios', async (req, res) => {
    const { nombre, email } = req.body;
    try {
        const nuevo = await pool.query('INSERT INTO usuarios (nombre, email) VALUES ($1, $2) RETURNING *', [nombre, email]);
        res.status(201).json(nuevo.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, email } = req.body;
    try {
        const actualizado = await pool.query('UPDATE usuarios SET nombre = $1, email = $2 WHERE id = $3 RETURNING *', [nombre, email, id]);
        res.json(actualizado.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/usuarios/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
        res.json({ mensaje: "Usuario eliminado" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Fallback para el frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));