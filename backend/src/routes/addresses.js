const express = require("express");

const pool = require("../db");

const { verificarToken } = require("../middleware/auth");

const router = express.Router();



// GET /api/addresses

router.get("/", verificarToken, async (req, res) => {

    try {

        const result = await pool.query(

            "SELECT * FROM addresses WHERE user_id = $1 ORDER BY id DESC",

            [req.user.id]

        );

        res.json(result.rows);

    } catch (e) { res.status(500).json({ error: e.message }); }

});



// POST /api/addresses

router.post("/", verificarToken, async (req, res) => {

    try {

        const { street, ext_number, neighborhood, cp } = req.body;

        const result = await pool.query(

            "INSERT INTO addresses (user_id, street, ext_number, neighborhood, postal_code) VALUES ($1, $2, $3, $4, $5) RETURNING *",

            [req.user.id, street, ext_number, neighborhood, cp]

        );

        res.status(201).json(result.rows[0]);

    } catch (e) { res.status(500).json({ error: e.message }); }

});



// DELETE /api/addresses/:id

router.delete("/:id", verificarToken, async (req, res) => {

    try {

        await pool.query("DELETE FROM addresses WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);

        res.json({ message: "Eliminado" });

    } catch (e) { res.status(500).json({ error: e.message }); }

});



module.exports = router; // <-- ESTA LÍNEA ES VITAL
