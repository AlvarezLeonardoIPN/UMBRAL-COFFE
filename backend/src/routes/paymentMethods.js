const express = require("express");

const pool = require("../db");

const { verificarToken } = require("../middleware/auth");

const router = express.Router();



function onlyDigits(s) { return String(s || "").replace(/\D+/g, ""); }



// GET /api/payment-methods

router.get("/", verificarToken, async (req, res) => {

    try {

        const result = await pool.query(

            "SELECT id, card_holder, card_last4, exp_month, exp_year, brand FROM payment_methods WHERE user_id = $1",

            [req.user.id]

        );

        res.json(result.rows);

    } catch (e) { res.status(500).json({ error: e.message }); }

});



// POST /api/payment-methods

router.post("/", verificarToken, async (req, res) => {

    try {

        const { cardHolder, cardNumber, expMonth, expYear, cvv, brand } = req.body;

        const last4 = onlyDigits(cardNumber).slice(-4);

        const result = await pool.query(

            "INSERT INTO payment_methods (user_id, card_holder, card_last4, exp_month, exp_year, brand, cvv) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, card_last4",

            [req.user.id, cardHolder, last4, expMonth, expYear, brand, cvv]

        );

        res.status(201).json(result.rows[0]);

    } catch (e) { res.status(500).json({ error: e.message }); }

});



// DELETE /api/payment-methods/:id

router.delete("/:id", verificarToken, async (req, res) => {

    try {

        await pool.query("DELETE FROM payment_methods WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);

        res.json({ message: "Eliminado" });

    } catch (e) { res.status(500).json({ error: e.message }); }

});



module.exports = router; // <-- ESTA LÍNEA ES VITAL
