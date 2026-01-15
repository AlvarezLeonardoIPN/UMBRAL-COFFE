const express = require("express");
const pool = require("../db");
const { verificarToken } = require("../middleware/auth");
const router = express.Router();

// 1. GUARDAR RESEÑA
router.post("/", verificarToken, async (req, res) => {
  try {
    // --- BLINDAJE DE ROL ---
    // Si es Admin o Inventarios, se rechaza por conflicto de interés
    if (req.user.role === 'admin' || req.user.role === 'inventarios') {
        return res.status(403).json({ 
            error: "Acción denegada. El personal interno no puede calificar productos." 
        });
    }

    const { productId, product_id, rating, comment } = req.body;
    const finalProductId = productId || product_id;
    const user_id = req.user.id;

    if (!finalProductId || !rating) {
      return res.status(400).json({ error: "Producto y calificación son obligatorios." });
    }

    const result = await pool.query(
      "INSERT INTO reviews (user_id, product_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *",
      [user_id, finalProductId, rating, comment]
    );

    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(e);
    if (e.code === '23505') {
      return res.status(400).json({ error: "Ya calificaste este producto anteriormente." });
    }
    res.status(500).json({ error: "Error al procesar la reseña." });
  }
});

// 2. OBTENER RESEÑAS
router.get("/product/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT r.*, u.name as user_name 
      FROM reviews r 
      JOIN users u ON r.user_id = u.id 
      WHERE r.product_id = $1 
      ORDER BY r.created_at DESC
    `, [id]);
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al obtener reseñas." });
  }
});

module.exports = router;