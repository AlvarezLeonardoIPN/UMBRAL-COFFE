const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();

// ID de cliente Google
const GOOGLE_CLIENT_ID = "459725717130-9p33qepue979tpon38bnb8j9h3rthatk.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Clave secreta centralizada
const SECRET = process.env.JWT_SECRET || "una_frase_larga_y_secreta_umbral_2025";

// 1. LOGIN NORMAL
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Faltan datos" });

        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) return res.status(400).json({ error: "Credenciales inválidas" });

        const user = result.rows[0];
        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) return res.status(400).json({ error: "Credenciales inválidas" });

        // Generamos Token (usamos SECRET)
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            SECRET,
            { expiresIn: "8h" }
        );

        delete user.password_hash;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error de servidor" });
    }
});

// 2. REGISTRO
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const exists = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (exists.rows.length > 0) return res.status(400).json({ error: "El email ya existe" });

        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'cliente') RETURNING *",
            [name, email, hash]
        );
        
        const user = result.rows[0];
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role }, 
            SECRET, 
            { expiresIn: "1d" }
        );
        
        res.status(201).json({ message: "Usuario creado", token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error al registrar" });
    }
});

// 3. LOGIN CON GOOGLE
router.post("/google", async (req, res) => {
    try {
        const { token: googleToken } = req.body; // Cambiamos nombre para evitar conflicto
        
        const ticket = await client.verifyIdToken({
            idToken: googleToken,
            audience: GOOGLE_CLIENT_ID, 
        });
        const payload = ticket.getPayload();
        const { email, name } = payload;

        let result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        let user = result.rows[0];

        if (!user) {
            const randomPass = Math.random().toString(36).slice(-8);
            const hash = await bcrypt.hash(randomPass, 10);
            const newUser = await pool.query(
                "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'cliente') RETURNING *",
                [name, email, hash]
            );
            user = newUser.rows[0];
        }

        // Token de sesión propio de Umbral
        const sessionToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            SECRET,
            { expiresIn: "8h" }
        );

        // La respuesta lleva la llave "token" para que el frontend no cambie
        res.json({ 
            token: sessionToken, 
            user: { id: user.id, name: user.name, role: user.role } 
        });
    } catch (e) {
        console.error("DETALLE TÉCNICO GOOGLE:", e);
        res.status(400).json({ error: "Error de Google: " + e.message });
    }
});

module.exports = router;