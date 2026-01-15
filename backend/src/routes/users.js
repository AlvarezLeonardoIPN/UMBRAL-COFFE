const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { verificarToken, requiereRol } = require("../middleware/auth");

const router = express.Router();

// CONFIGURACIÓN DEL SUPERADMIN
const SUPERADMIN_ID = 4; 

function normEmail(s){ return String(s || "").trim().toLowerCase(); }
function normRole(s){ return String(s || "").trim().toLowerCase(); }

const ROLES_VALIDOS = ["admin", "cliente", "inventarios"];

// =====================
// PERFIL (cliente)
// =====================

router.get("/me", verificarToken, async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: "Usuario no encontrado." });
    return res.json(r.rows[0]);
  } catch (e) {
    return res.status(500).json({ error: "No se pudo cargar perfil.", detail: e.message });
  }
});

router.put("/me", verificarToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const name = String(req.body.name || "").trim();
    const email = normEmail(req.body.email);

    if (!name) return res.status(400).json({ error: "Nombre requerido." });
    if (!email) return res.status(400).json({ error: "Email requerido." });

    const ex = await pool.query("SELECT id FROM users WHERE email = $1 AND id <> $2", [email, userId]);
    if (ex.rows.length) return res.status(400).json({ error: "Ese email ya existe." });

    const r = await pool.query(
      "UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING id, name, email, role",
      [name, email, userId]
    );
    return res.json(r.rows[0]);
  } catch (e) {
    return res.status(500).json({ error: "No se pudo actualizar perfil.", detail: e.message });
  }
});

router.post("/change-password", verificarToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const oldPassword = String(req.body.oldPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Faltan campos." });
    }

    const r = await pool.query("SELECT password_hash FROM users WHERE id = $1", [userId]);
    if (!r.rows.length) return res.status(404).json({ error: "Usuario no encontrado." });

    const ok = await bcrypt.compare(oldPassword, r.rows[0].password_hash);
    if (!ok) return res.status(400).json({ error: "Contrasena actual incorrecta." });

    if (newPassword.length < 8) return res.status(400).json({ error: "Nueva contrasena minimo 8." });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, userId]);

    return res.json({ message: "Contrasena actualizada." });
  } catch (e) {
    return res.status(500).json({ error: "No se pudo cambiar contrasena.", detail: e.message });
  }
});

// =====================
// DIRECCIONES (cliente)
// =====================

router.get("/addresses", verificarToken, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, street, ext_number, int_number, neighborhood, postal_code, city, state, country, created_at
       FROM addresses
       WHERE user_id=$1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json(r.rows);
  } catch (e) {
    return res.status(500).json({ error: "No se pudieron obtener direcciones.", detail: e.message });
  }
});

router.post("/addresses", verificarToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { street, ext_number, int_number, neighborhood, postal_code, city, state, country } = req.body;

    if (!street || !ext_number || !neighborhood || !postal_code || !city || !state || !country) {
      return res.status(400).json({ error: "Faltan campos obligatorios de direccion." });
    }

    const r = await pool.query(
      `INSERT INTO addresses (user_id, street, ext_number, int_number, neighborhood, postal_code, city, state, country)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [userId, street, ext_number, int_number || null, neighborhood, postal_code, city, state, country]
    );

    return res.status(201).json(r.rows[0]);
  } catch (e) {
    return res.status(500).json({ error: "No se pudo guardar direccion.", detail: e.message });
  }
});

router.delete("/addresses/:id", verificarToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await pool.query(
      "DELETE FROM addresses WHERE id=$1 AND user_id=$2 RETURNING id",
      [id, req.user.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: "Direccion no encontrada." });
    return res.json({ message: "Direccion eliminada." });
  } catch (e) {
    return res.status(500).json({ error: "No se pudo eliminar direccion.", detail: e.message });
  }
});

// =====================
// METODOS DE PAGO (cliente)
// =====================

router.get("/payment-methods", verificarToken, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, card_holder, card_last4, exp_month, exp_year, brand, created_at
       FROM payment_methods
       WHERE user_id=$1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json(r.rows);
  } catch (e) {
    return res.status(500).json({ error: "No se pudieron obtener metodos de pago.", detail: e.message });
  }
});

router.post("/payment-methods", verificarToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { card_number, exp_month, exp_year, brand, cvv } = req.body;
    const holder = String(req.body.holder || req.body.card_holder || "").trim();
    const cleanCard = String(card_number || "").replace(/\s+/g, "");

    // Validacion dinámica del año (2026 - 2035)
    const currentYear = new Date().getFullYear();

    if (!holder || !cleanCard || !exp_month || !exp_year || !brand || !cvv) {
      return res.status(400).json({ error: "Faltan campos de tarjeta." });
    }

    // --- VALIDACIÓN ESTRICTA (REALISMO) ---
    // Solo números
    if (!/^\d+$/.test(cleanCard)) {
        return res.status(400).json({ error: "La tarjeta solo puede contener números." });
    }
    // Longitud exacta: 15 (Amex) o 16 (Visa/Master)
    if (cleanCard.length !== 15 && cleanCard.length !== 16) {
      return res.status(400).json({ error: "La tarjeta debe tener 15 o 16 dígitos." });
    }

    if (!(exp_month >= 1 && exp_month <= 12)) return res.status(400).json({ error: "Mes invalido." });
    if (exp_year < currentYear || exp_year > 2035) {
        return res.status(400).json({ error: `Año inválido. Debe ser entre ${currentYear} y 2035.` });
    }
    
    // CVV: 3 o 4 dígitos
    if (!/^\d{3,4}$/.test(cvv)) {
        return res.status(400).json({ error: "CVV inválido (debe tener 3 o 4 dígitos)." });
    }

    const last4 = cleanCard.slice(-4);

    const r = await pool.query(
      `INSERT INTO payment_methods (user_id, card_holder, card_last4, exp_month, exp_year, brand)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, card_holder, card_last4, exp_month, exp_year, brand, created_at`,
      [userId, holder, last4, exp_month, exp_year, brand]
    );

    return res.status(201).json(r.rows[0]);
  } catch (e) {
    return res.status(500).json({ error: "No se pudo guardar metodo de pago.", detail: e.message });
  }
});

router.delete("/payment-methods/:id", verificarToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await pool.query(
      "DELETE FROM payment_methods WHERE id=$1 AND user_id=$2 RETURNING id",
      [id, req.user.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: "Metodo no encontrado." });
    return res.json({ message: "Metodo eliminado." });
  } catch (e) {
    return res.status(500).json({ error: "No se pudo eliminar metodo.", detail: e.message });
  }
});

// =====================
// ADMIN: CRUD USERS
// =====================

router.get("/", verificarToken, requiereRol(["admin"]), async (req, res) => {
  try {
    const r = await pool.query("SELECT id, name, email, role, created_at FROM users ORDER BY id ASC");
    return res.json(r.rows);
  } catch (e) {
    return res.status(500).json({ error: "No se pudieron listar usuarios.", detail: e.message });
  }
});

router.post("/", verificarToken, requiereRol(["admin"]), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const nEmail = normEmail(email);
    const nRole = normRole(role || "cliente");

    if (!name || !nEmail || password.length < 6) return res.status(400).json({ error: "Datos invalidos." });

    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1,$2,$3,$4)
       RETURNING id, name, email, role, created_at`,
      [name, nEmail, hash, nRole]
    );
    return res.status(201).json(r.rows[0]);
  } catch (e) {
    return res.status(500).json({ error: "No se pudo crear usuario.", detail: e.message });
  }
});

router.put("/:id", verificarToken, requiereRol(["admin"]), async (req, res) => {
  try {
    const idParaEditar = Number(req.params.id);
    if (!idParaEditar) return res.status(400).json({ error: "Id invalido." });

    const name = req.body.name !== undefined ? String(req.body.name || "").trim() : undefined;
    const email = req.body.email !== undefined ? normEmail(req.body.email) : undefined;
    const role = req.body.role !== undefined ? normRole(req.body.role) : undefined;

    // --- PROTECCIÓN SUPERADMIN ---
    if (idParaEditar === SUPERADMIN_ID && role !== undefined && role !== 'admin') {
        return res.status(403).json({ error: "No se puede quitar el rol de administrador al Superadmin." });
    }

    const fields = [];
    const vals = [];
    let i = 1;

    if (name) { fields.push(`name=$${i++}`); vals.push(name); }
    if (email) { fields.push(`email=$${i++}`); vals.push(email); }
    if (role) { fields.push(`role=$${i++}`); vals.push(role); }

    if (!fields.length) return res.status(400).json({ error: "Sin cambios." });

    vals.push(idParaEditar);
    const r = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id=$${i}
       RETURNING id, name, email, role, created_at`,
      vals
    );

    if (!r.rows.length) return res.status(404).json({ error: "Usuario no encontrado." });
    return res.json(r.rows[0]);
  } catch (e) {
    return res.status(500).json({ error: "No se pudo actualizar usuario.", detail: e.message });
  }
});

router.delete("/:id", verificarToken, requiereRol(["admin"]), async (req, res) => {
  try {
    const idParaEliminar = Number(req.params.id);
    
    // --- PROTECCIÓN SUPERADMIN ---
    if (idParaEliminar === SUPERADMIN_ID) {
        return res.status(403).json({ error: "El Superadmin es irremovible y no puede ser eliminado." });
    }
    // Autoprotección
    if (idParaEliminar === req.user.id) {
        return res.status(400).json({ error: "No puedes eliminar tu propia cuenta desde aquí." });
    }

    const r = await pool.query("DELETE FROM users WHERE id=$1 RETURNING id", [idParaEliminar]);
    if (!r.rows.length) return res.status(404).json({ error: "Usuario no encontrado." });

    return res.json({ message: "Usuario eliminado correctamente." });
  } catch (e) {
    return res.status(500).json({ error: "No se pudo eliminar usuario.", detail: e.message });
  }
});

module.exports = router;