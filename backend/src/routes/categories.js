const express = require("express");
const pool = require("../db");
const { verificarToken, requiereRol } = require("../middleware/auth");
const router = express.Router();

// GET /api/categories - Público para que el formulario pueda llenarse
router.get("/", async (req, res) => {
  try {
    const r = await pool.query("SELECT id, name FROM categories ORDER BY name ASC");
    res.json(r.rows);
  } catch (e) {
    console.error("Error en GET categories:", e);
    res.status(500).json({ error: "No se pudieron cargar categorías." });
  }
});

// CRUD simplificado
router.post("/", verificarToken, requiereRol(["admin"]), async (req, res) => {
  try {
    const { name } = req.body;
    const r = await pool.query("INSERT INTO categories (name) VALUES ($1) RETURNING *", [name]);
    res.status(201).json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Error al crear categoría." });
  }
});

module.exports = router;