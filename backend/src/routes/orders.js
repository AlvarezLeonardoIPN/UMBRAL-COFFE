const express = require("express");

const router = express.Router();

const pool = require("../db");



// 1. OBTENER TOTALES DE HOY (Admin)

router.get("/today", async (req, res) => {

    try {

        const query = `

            SELECT COUNT(*)::int as count, COALESCE(SUM(total), 0)::numeric(10,2) as total 

            FROM orders WHERE created_at::date = CURRENT_DATE`;

        const result = await pool.query(query);

        res.json(result.rows[0]);

    } catch (err) { res.status(500).json({ error: err.message }); }

});



// 2. OBTENER TODOS LOS PEDIDOS (Admin - Para Inventarios)

router.get("/", async (req, res) => {

    try {

        const query = `

            SELECT o.*, u.name as cliente_nombre,

            (SELECT json_agg(items) FROM (

                SELECT oi.quantity as qty, oi.unit_price as price, p.name 

                FROM order_items oi 

                JOIN products p ON oi.product_id = p.id 

                WHERE oi.order_id = o.id

            ) items) as detalles

            FROM orders o 

            LEFT JOIN users u ON o.user_id = u.id 

            ORDER BY o.created_at DESC`;

        const result = await pool.query(query);

        res.json(result.rows);

    } catch (err) { res.status(500).json({ error: err.message }); }

});



// 3. OBTENER MIS PEDIDOS (Cliente)

router.get("/user/:userId", async (req, res) => {

    try {

        const { userId } = req.params;

        const query = `

            SELECT o.*, 

            (SELECT json_agg(items) FROM (

                SELECT oi.*, p.name 

                FROM order_items oi 

                JOIN products p ON oi.product_id = p.id 

                WHERE oi.order_id = o.id

            ) items) as detalles

            FROM orders o 

            WHERE o.user_id = $1 

            ORDER BY o.created_at DESC`;



        const result = await pool.query(query, [userId]);

        res.json(result.rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({ error: err.message });

    }

});



// 4. CREAR PEDIDO (Checkout)

router.post("/", async (req, res) => {

    const client = await pool.connect();

    try {

        const { user_id, address_id, payment_method_id, total, notes, items } = req.body;

        

        await client.query('BEGIN');



        const orderRes = await client.query(

            `INSERT INTO orders (user_id, address_id, payment_method_id, total, notes, status) 

             VALUES ($1, $2, $3, $4, $5, 'pendiente') RETURNING id`,

            [

                parseInt(user_id), 

                address_id ? parseInt(address_id) : null, 

                payment_method_id ? parseInt(payment_method_id) : null, 

                parseFloat(total), 

                notes || ""

            ]

        );

        const orderId = orderRes.rows[0].id;



        for (const item of items) {

            const qty = parseInt(item.qty || item.quantity);

            const price = parseFloat(item.price || item.unit_price);

            const subtotal = qty * price;



            await client.query(

                `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) 

                 VALUES ($1, $2, $3, $4, $5)`,

                [orderId, parseInt(item.product_id), qty, price, subtotal]

            );

        }



        await client.query('COMMIT');

        res.status(201).json({ message: "Pedido creado con éxito", orderId });

    } catch (err) {

        await client.query('ROLLBACK');

        console.error("❌ ERROR POSTGRES:", err.message);

        res.status(500).json({ error: err.message });

    } finally {

        client.release();

    }

});



// 5. ACTUALIZAR ESTATUS (Admin - ESTA FALTABA)

router.put("/:id/status", async (req, res) => {

    try {

        const { id } = req.params;

        const { status } = req.body;



        if (!status) return res.status(400).json({ error: "Estatus requerido" });



        const result = await pool.query(

            "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",

            [status, id]

        );



        if (result.rowCount === 0) {

            return res.status(404).json({ error: "Pedido no encontrado" });

        }



        res.json({ message: "Estatus actualizado correctamente", order: result.rows[0] });

    } catch (err) {

        console.error(err);

        res.status(500).json({ error: err.message });

    }

});



module.exports = router;
