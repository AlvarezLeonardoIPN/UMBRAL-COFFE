const express = require("express");
const pool = require("../db");
const { verificarToken, requiereRol } = require("../middleware/auth");
const router = express.Router();

const ESTATUS_VALIDOS = ["pendiente", "en proceso", "enviado", "recibido", "cancelado"];

// 1. CREAR ÓRDEN (BLINDADO)
router.post("/", verificarToken, async (req, res) => {
    try {
        // Bloqueo de Staff
        if (req.user.role !== 'cliente') {
            return res.status(403).json({ 
                error: "Acceso denegado. El personal administrativo no puede realizar compras." 
            });
        }

        const client = await pool.connect();
        try {
            const { items, addressId, paymentMethodId, notes } = req.body;
            const userId = req.user.id;
            await client.query("BEGIN");

            let total = 0;
            const orderItems = [];

            for (const it of items) {
                const pRes = await client.query("SELECT id, name, price, stock FROM products WHERE id = $1", [it.productId]);
                const p = pRes.rows[0];
                if (!p || p.stock < it.quantity) throw new Error(`Stock insuficiente para ${p ? p.name : 'Producto'}`);
                
                const sub = Number(p.price) * it.quantity;
                total += sub;
                orderItems.push({ productId: p.id, quantity: it.quantity, unitPrice: p.price, subtotal: sub });
            }

            const orderRes = await client.query(
                "INSERT INTO orders (user_id, address_id, payment_method_id, status, total, notes) VALUES ($1,$2,$3,'pendiente',$4,$5) RETURNING id",
                [userId, addressId, paymentMethodId, total, notes || null]
            );
            const orderId = orderRes.rows[0].id;

            for (const it of orderItems) {
                await client.query("INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES ($1,$2,$3,$4,$5)", [orderId, it.productId, it.quantity, it.unitPrice, it.subtotal]);
                await client.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [it.quantity, it.productId]);
            }

            await client.query("COMMIT");
            res.status(201).json({ message: "Orden creada", orderId });
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 2. VENTAS DE HOY
router.get("/today", verificarToken, requiereRol(["inventarios", "admin"]), async (req, res) => {
    try {
        const q = `
            SELECT o.id, o.status, o.total, o.created_at, u.id AS cliente_id, u.name AS cliente_nombre,
            COALESCE((SELECT json_agg(json_build_object('nombre', p.name, 'cantidad', oi.quantity))
            FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = o.id), '[]'::json) AS detalles
            FROM orders o JOIN users u ON u.id = o.user_id
            WHERE o.created_at::date = CURRENT_DATE ORDER BY o.created_at DESC`;
        const r = await pool.query(q);
        res.json(r.rows);
    } catch (e) { res.status(500).json({ error: "Error al obtener ventas" }); }
});

// 3. ACTUALIZAR STATUS
router.put("/:id/status", verificarToken, requiereRol(["inventarios", "admin"]), async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { status, restoreStock } = req.body;
        if (!ESTATUS_VALIDOS.includes(status)) return res.status(400).json({ error: "Estatus no válido" });
        await client.query("BEGIN");
        const oldOrderRes = await client.query("SELECT status FROM orders WHERE id = $1", [id]);
        if (oldOrderRes.rows.length === 0) throw new Error("Orden no encontrada");
        const oldStatus = oldOrderRes.rows[0].status;

        if (status === 'cancelado' && oldStatus !== 'cancelado' && restoreStock) {
            const items = await client.query("SELECT product_id, quantity FROM order_items WHERE order_id = $1", [id]);
            for (const item of items.rows) {
                await client.query("UPDATE products SET stock = stock + $1 WHERE id = $2", [item.quantity, item.product_id]);
            }
        }
        if (oldStatus === 'cancelado' && status !== 'cancelado') {
            const items = await client.query("SELECT product_id, quantity FROM order_items WHERE order_id = $1", [id]);
            for (const item of items.rows) {
                const prod = await client.query("SELECT stock FROM products WHERE id = $1", [item.product_id]);
                if (prod.rows[0].stock < item.quantity) throw new Error(`No hay stock para reactivar ID ${item.product_id}`);
            }
            for (const item of items.rows) {
                await client.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [item.quantity, item.product_id]);
            }
        }
        const r = await client.query("UPDATE orders SET status=$1 WHERE id=$2 RETURNING id, status", [status, id]);
        await client.query("COMMIT");
        res.json(r.rows[0]);
    } catch (e) {
        await client.query("ROLLBACK");
        res.status(400).json({ error: e.message || "Error" });
    } finally { client.release(); }
});

// 4. DETALLES
router.get("/:id/items", verificarToken, async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT oi.*, p.name AS product_name, a.street, a.ext_number, pm.brand, pm.card_last4
            FROM order_items oi 
            LEFT JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id 
            JOIN addresses a ON o.address_id = a.id
            JOIN payment_methods pm ON o.payment_method_id = pm.id 
            WHERE oi.order_id = $1`, [req.params.id]);
        res.json(r.rows);
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

// 5. MIS PEDIDOS
router.get("/mine", verificarToken, async (req, res) => {
    try {
        const r = await pool.query("SELECT id, status, total, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC", [req.user.id]);
        res.json(r.rows);
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

module.exports = router;