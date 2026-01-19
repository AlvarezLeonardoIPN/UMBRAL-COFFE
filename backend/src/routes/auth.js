const express = require("express");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const pool = require("../db");

const { OAuth2Client } = require('google-auth-library');

const { verificarToken } = require("../middleware/auth");



const router = express.Router();

const GOOGLE_CLIENT_ID = "459725717130-9p33qepue979tpon38bnb8j9h3rthatk.apps.googleusercontent.com";

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const SECRET = process.env.JWT_SECRET || "una_frase_larga_y_secreta_umbral_2025";



// 1. OBTENER PERFIL ACTUAL (Ruta /me)

router.get("/me", verificarToken, async (req, res) => {

    try {

        const result = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [req.user.id]);

        if (result.rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

        res.json(result.rows[0]);

    } catch (e) {

        res.status(500).json({ error: "Error al obtener perfil" });

    }

});



// 2. LOGIN NORMAL

router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (result.rows.length === 0) return res.status(400).json({ error: "Credenciales inválidas" });



        const user = result.rows[0];

if (user.is_active === false) {
            return res.status(403).json({ error: "Tu cuenta ha sido desactivada. Contacta al administrador." });
        }

        const validPass = await bcrypt.compare(password, user.password_hash);

        if (!validPass) return res.status(400).json({ error: "Credenciales inválidas" });



        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: "8h" });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });

    } catch (e) {

        res.status(500).json({ error: "Error de servidor" });

    }

});



// 3. REGISTRO INTEGRAL (Corregido para tu DB)

router.post("/register", async (req, res) => {

    const dbClient = await pool.connect();

    try {

        const { 

            name, email, password, 

            street, ext_number, neighborhood, cp, 

            cardHolder, cardNumber, expMonth, expYear, cvv 

        } = req.body;



        await dbClient.query("BEGIN");



        // Crear Usuario

        const hash = await bcrypt.hash(password, 10);

        const userRes = await dbClient.query(

            "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'cliente') RETURNING id",

            [name, email, hash]

        );

        const userId = userRes.rows[0].id;



        // Crear Dirección (Usando nombres reales de tu tabla addresses)

        await dbClient.query(

            "INSERT INTO addresses (user_id, street, ext_number, neighborhood, postal_code) VALUES ($1, $2, $3, $4, $5)",

            [userId, street, ext_number, neighborhood, cp]

        );



        // Crear Tarjeta

        const last4 = String(cardNumber).slice(-4);

        await dbClient.query(

            "INSERT INTO payment_methods (user_id, card_holder, card_last4, exp_month, exp_year, brand, cvv) VALUES ($1, $2, $3, $4, $5, 'Visa', $6)",

            [userId, cardHolder, last4, expMonth, expYear, cvv]

        );



        await dbClient.query("COMMIT");

        res.status(201).json({ message: "Registro exitoso" });

    } catch (e) {

        await dbClient.query("ROLLBACK");

        console.error("ERROR REGISTRO:", e.message);

        res.status(500).json({ error: e.message });

    } finally {

        dbClient.release();

    }

});



// 4. LOGIN CON GOOGLE (Restaurado)

router.post("/google", async (req, res) => {

    try {

        const { token: googleToken } = req.body;

        const ticket = await client.verifyIdToken({ idToken: googleToken, audience: GOOGLE_CLIENT_ID });

        const { email, name } = ticket.getPayload();



        let result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        let user = result.rows[0];



        if (!user) {

            const hash = await bcrypt.hash(Math.random().toString(36), 10);

            const newUser = await pool.query(

                "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'cliente') RETURNING *",

                [name, email, hash]

            );

            user = newUser.rows[0];

        }



        const sessionToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: "8h" });

        res.json({ token: sessionToken, user: { id: user.id, name: user.name, role: user.role } });

    } catch (e) {

        res.status(400).json({ error: "Error de Google: " + e.message });

    }

});



module.exports = router;
