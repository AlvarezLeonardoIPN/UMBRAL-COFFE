// src/routes/addresses.js
const express = require("express");
const pool = require("../db");
const { verificarToken } = require("../middleware/auth");

const router = express.Router();

// GET /api/addresses/mine  -> listar mis direcciones
router.get("/mine", verificarToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, street, ext_number, int_number, neighborhood,
              postal_code, city, state, country, created_at
       FROM addresses
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error en GET /addresses/mine:", err);
    res.status(500).json({ error: "No se pudieron obtener tus direcciones." });
  }
});

// POST /api/addresses  -> crear direccion
router.post("/", verificarToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      street,
      ext_number,
      int_number,
      neighborhood,
      postal_code,
      city,
      state,
      country
    } = req.body;

    // validacion minima 
    if (!street || !ext_number || !neighborhood || !postal_code || !city || !state || !country) {
      return res.status(400).json({
        error:
          "Faltan campos obligatorios: street, ext_number, neighborhood, postal_code, city, state, country."
      });
    }

    const result = await pool.query(
      `INSERT INTO addresses
       (user_id, street, ext_number, int_number, neighborhood, postal_code, city, state, country)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [userId, street, ext_number, int_number || null, neighborhood, postal_code, city, state, country]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error en POST /addresses:", err);
    res.status(500).json({ error: "No se pudo guardar la direccion." });
  }
});

// PUT /api/addresses/:id -> editar mi direccion
router.put("/:id", verificarToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    const {
      street,
      ext_number,
      int_number,
      neighborhood,
      postal_code,
      city,
      state,
      country
    } = req.body;

    const result = await pool.query(
      `UPDATE addresses
       SET street=$1, ext_number=$2, int_number=$3, neighborhood=$4,
           postal_code=$5, city=$6, state=$7, country=$8
       WHERE id=$9 AND user_id=$10
       RETURNING *`,
      [
        street || null,
        ext_number || null,
        int_number || null,
        neighborhood || null,
        postal_code || null,
        city || null,
        state || null,
        country || null,
        addressId,
        userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Direccion no encontrada." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error en PUT /addresses/:id:", err);
    res.status(500).json({ error: "No se pudo actualizar la direccion." });
  }
});

// DELETE /api/addresses/:id -> borrar mi direccion
router.delete("/:id", verificarToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    const result = await pool.query(
      `DELETE FROM addresses
       WHERE id=$1 AND user_id=$2
       RETURNING id`,
      [addressId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Direccion no encontrada." });
    }

    res.json({ message: "Direccion eliminada." });
  } catch (err) {
    console.error("Error en DELETE /addresses/:id:", err);
    res.status(500).json({ error: "No se pudo eliminar la direccion." });
  }
});

module.exports = router;
