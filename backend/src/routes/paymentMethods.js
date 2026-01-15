// src/routes/payment_methods.js
const express = require("express");
const pool = require("../db");
const { verificarToken } = require("../middleware/auth");

const router = express.Router();

function onlyDigits(s) {
  return String(s || "").replace(/\D+/g, "");
}

// GET /api/payment-methods/mine
router.get("/mine", verificarToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, card_holder, card_last4, exp_month, exp_year, brand, created_at
       FROM payment_methods
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET /payment-methods/mine:", err);
    res.status(500).json({ error: "No se pudieron obtener tus metodos de pago." });
  }
});

// POST /api/payment-methods
// Body: { card_holder, card_number, exp_month, exp_year, cvv, brand }
router.post("/", verificarToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { card_holder, card_number, exp_month, exp_year, cvv, brand } = req.body;

    if (!card_holder || !card_number || !exp_month || !exp_year) {
      return res.status(400).json({ error: "Faltan campos: card_holder, card_number, exp_month, exp_year." });
    }

    // Validacion CVV (profe) - NO se guarda
    if (cvv !== undefined && cvv !== null && String(cvv).trim() !== "") {
      const c = onlyDigits(cvv);
      if (!(c.length === 3 || c.length === 4)) {
        return res.status(400).json({ error: "CVV invalido (3 o 4 digitos)." });
      }
    }

    const num = onlyDigits(card_number);
    if (num.length < 12) return res.status(400).json({ error: "Numero de tarjeta invalido." });

    const last4 = num.slice(-4);
    const m = Number(exp_month);
    const y = Number(exp_year);

    if (!Number.isFinite(m) || m < 1 || m > 12) return res.status(400).json({ error: "Mes invalido." });
    if (!Number.isFinite(y) || y < 2020 || y > 2100) return res.status(400).json({ error: "Anio invalido." });

    const result = await pool.query(
      `INSERT INTO payment_methods (user_id, card_holder, card_last4, exp_month, exp_year, brand)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, card_holder, card_last4, exp_month, exp_year, brand, created_at`,
      [userId, String(card_holder).trim(), last4, m, y, brand ? String(brand).trim() : null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /payment-methods:", err);
    res.status(500).json({ error: "No se pudo guardar el metodo de pago.", detail: err.message });
  }
});

// PUT /api/payment-methods/:id  (editar mi metodo)
// Body: { card_holder, exp_month, exp_year, brand, cvv }
router.put("/:id", verificarToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Id invalido." });

    const { card_holder, exp_month, exp_year, brand, cvv } = req.body;

    // CVV (profe) - NO se guarda
    if (cvv !== undefined && cvv !== null && String(cvv).trim() !== "") {
      const c = onlyDigits(cvv);
      if (!(c.length === 3 || c.length === 4)) {
        return res.status(400).json({ error: "CVV invalido (3 o 4 digitos)." });
      }
    }

    const fields = [];
    const values = [];
    let i = 1;

    const add = (f, v) => { fields.push(`${f} = $${i++}`); values.push(v); };

    if (card_holder !== undefined) add("card_holder", String(card_holder || "").trim() || null);

    if (exp_month !== undefined) {
      const m = Number(exp_month);
      if (!Number.isFinite(m) || m < 1 || m > 12) return res.status(400).json({ error: "Mes invalido." });
      add("exp_month", m);
    }

    if (exp_year !== undefined) {
      const y = Number(exp_year);
      if (!Number.isFinite(y) || y < 2020 || y > 2100) return res.status(400).json({ error: "Anio invalido." });
      add("exp_year", y);
    }

    if (brand !== undefined) add("brand", brand ? String(brand).trim() : null);

    if (!fields.length) return res.status(400).json({ error: "Sin cambios." });

    values.push(id, userId);

    const q = `
      UPDATE payment_methods
      SET ${fields.join(", ")}
      WHERE id = $${i++} AND user_id = $${i}
      RETURNING id, card_holder, card_last4, exp_month, exp_year, brand, created_at
    `;

    const r = await pool.query(q, values);
    if (!r.rows.length) return res.status(404).json({ error: "Metodo no encontrado." });

    res.json(r.rows[0]);
  } catch (err) {
    console.error("PUT /payment-methods/:id:", err);
    res.status(500).json({ error: "No se pudo actualizar el metodo de pago.", detail: err.message });
  }
});

// DELETE /api/payment-methods/:id  (borrar mi metodo)
router.delete("/:id", verificarToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Id invalido." });

    const r = await pool.query(
      "DELETE FROM payment_methods WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );

    if (!r.rows.length) return res.status(404).json({ error: "Metodo no encontrado." });
    res.json({ message: "Metodo eliminado." });
  } catch (err) {
    console.error("DELETE /payment-methods/:id:", err);
    res.status(500).json({ error: "No se pudo eliminar el metodo de pago.", detail: err.message });
  }
});

module.exports = router;

