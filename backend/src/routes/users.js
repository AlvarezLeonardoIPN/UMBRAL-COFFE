const express = require("express");

const pool = require("../db");

const bcrypt = require("bcryptjs");

const { verificarToken, requiereRol } = require("../middleware/auth");



const router = express.Router();



// ==========================

// 1. PERFIL DE USUARIO (/me)

// ==========================

router.get("/me", verificarToken, async (req, res) => {

    try {

        // CORREGIDO: Se agregó is_active

        const r = await pool.query("SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1", [req.user.id]);

        if (!r.rows.length) return res.status(404).json({ error: "Usuario no encontrado" });

        res.json(r.rows[0]);

    } catch (e) { res.status(500).json({ error: "Error de servidor" }); }

});



router.put("/me", verificarToken, async (req, res) => {

    try {

        const { name, email } = req.body;

        await pool.query("UPDATE users SET name=$1, email=$2 WHERE id=$3", [name, email, req.user.id]);

        res.json({ message: "Perfil actualizado" });

    } catch (e) { res.status(500).json({ error: "Error al actualizar" }); }

});



router.post("/change-password", verificarToken, async (req, res) => {

    try {

        const { oldPassword, newPassword } = req.body;

        const r = await pool.query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);



        const valid = await bcrypt.compare(oldPassword, r.rows[0].password_hash);

        if (!valid) return res.status(400).json({ error: "Contraseña actual incorrecta" });



        const hash = await bcrypt.hash(newPassword, 10);

        await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, req.user.id]);

        res.json({ message: "Contraseña cambiada" });

    } catch (e) { res.status(500).json({ error: "Error al cambiar contraseña" }); }

});



// ==========================

// 2. DIRECCIONES (/addresses)

// ==========================

router.get("/addresses", verificarToken, async (req, res) => {

    try {

        const r = await pool.query("SELECT * FROM addresses WHERE user_id = $1 ORDER BY created_at DESC", [req.user.id]);

        res.json(r.rows);

    } catch (e) { res.status(500).json({ error: "Error obteniendo direcciones" }); }

});



router.post("/addresses", verificarToken, async (req, res) => {

    try {

        const { street, ext_number, neighborhood, city, state, postal_code, country } = req.body;

        await pool.query(

            "INSERT INTO addresses (user_id, street, ext_number, neighborhood, city, state, postal_code, country) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",

            [req.user.id, street, ext_number, neighborhood, city, state, postal_code, country]

        );

        res.json({ message: "Dirección agregada" });

    } catch (e) { res.status(500).json({ error: "Error guardando dirección" }); }

});



router.delete("/addresses/:id", verificarToken, async (req, res) => {

    try {

        await pool.query("DELETE FROM addresses WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);

        res.json({ message: "Dirección eliminada" });

    } catch (e) { res.status(500).json({ error: "Error eliminando dirección" }); }

});



// ==========================

// 3. MÉTODOS DE PAGO (/payment-methods)

// ==========================

router.get("/payment-methods", verificarToken, async (req, res) => {

    try {

        const r = await pool.query("SELECT id, card_last4, brand FROM payment_methods WHERE user_id = $1 ORDER BY created_at DESC", [req.user.id]);

        res.json(r.rows);

    } catch (e) { res.status(500).json({ error: "Error obteniendo tarjetas" }); }

});



router.post("/payment-methods", verificarToken, async (req, res) => {

    try {

        const { card_number, brand } = req.body;

        const last4 = card_number.slice(-4);

        await pool.query(

            "INSERT INTO payment_methods (user_id, card_last4, brand) VALUES ($1, $2, $3)",

            [req.user.id, last4, brand]

        );

        res.json({ message: "Tarjeta agregada" });

    } catch (e) { res.status(500).json({ error: "Error guardando tarjeta" }); }

});



router.delete("/payment-methods/:id", verificarToken, async (req, res) => {

    try {

        await pool.query("DELETE FROM payment_methods WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);

        res.json({ message: "Tarjeta eliminada" });

    } catch (e) { res.status(500).json({ error: "Error eliminando tarjeta" }); }

});



// ==========================

// 4. ADMIN: LISTAR Y GESTIONAR USUARIOS

// ==========================

router.get("/", verificarToken, requiereRol(["admin"]), async (req, res) => {

    try {

        // CORREGIDO: Se agregó is_active para que el frontend pueda mostrar el estatus

        const r = await pool.query("SELECT id, name, email, role, is_active FROM users ORDER BY id ASC");

        res.json(r.rows);

    } catch (e) { res.status(500).json({ error: "Error listando usuarios" }); }

});



router.put("/:id/role", verificarToken, requiereRol(["admin"]), async (req, res) => {

    const { id } = req.params;

    const { role } = req.body;



    if (!['cliente', 'inventario'].includes(role)) {

        return res.status(400).json({ error: "Rol no permitido. Solo 'cliente' o 'inventario'." });

    }



    try {

        const check = await pool.query("SELECT role FROM users WHERE id = $1", [id]);

        if (check.rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });



        if (check.rows[0].role === 'admin') {

            return res.status(403).json({ error: "Operación prohibida: No puedes modificar a un Administrador." });

        }



        const result = await pool.query(

            "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role",

            [role, id]

        );

        res.json({ message: "Rol actualizado correctamente", user: result.rows[0] });

    } catch (err) {

        res.status(500).json({ error: err.message });

    }

});



router.delete("/:id", verificarToken, requiereRol(["admin"]), async (req, res) => {

    const { id } = req.params;

    if (parseInt(id) === req.user.id) {

        return res.status(400).json({ error: "No puedes desactivar tu propia cuenta de administrador." });

    }



    try {

        const result = await pool.query(

            "UPDATE users SET is_active = false WHERE id = $1", 

            [id]

        );

        if (result.rowCount === 0) {

            return res.status(404).json({ error: "Usuario no encontrado." });

        }

        res.json({ message: "Usuario desactivado correctamente" });

    } catch (e) {

        console.error("❌ Error SQL en DELETE:", e.message);

        res.status(500).json({ error: "Error en la base de datos" });

    }

});



router.put("/:id/activate", verificarToken, requiereRol(["admin"]), async (req, res) => {

    const { id } = req.params;

    try {

        await pool.query(

            "UPDATE users SET is_active = true WHERE id = $1", 

            [id]

        );

        res.json({ message: "Usuario reactivado correctamente" });

    } catch (e) {

        console.error("❌ Error SQL en ACTIVATE:", e.message);

        res.status(500).json({ error: "Error al reactivar usuario" });

    }

});



module.exports = router;
