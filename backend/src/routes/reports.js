const express = require("express");

const pool = require("../db");

const { verificarToken, requiereRol } = require("../middleware/auth");

const router = express.Router();



// 1. Reporte diario para Admin

router.get("/daily", verificarToken, requiereRol(["admin"]), async (req, res) => {

  try {

    const q = `

      SELECT to_char(created_at, 'YYYY-MM-DD') AS day,

      COUNT(*)::int AS orders,

      COALESCE(SUM(total), 0)::numeric(10,2) AS total

      FROM orders WHERE created_at >= (CURRENT_DATE - INTERVAL '14 days')

      GROUP BY 1 ORDER BY 1 DESC`;

    const r = await pool.query(q);

    res.json(r.rows);

  } catch (e) {

    res.status(500).json({ error: e.message });

  }

});



// 2. GENERAR TICKET DE PEDIDO (La que faltaba)

router.get("/order/:id", async (req, res) => {

  try {

    const { id } = req.params;

    const orderQ = `

      SELECT o.*, u.name as cliente, u.email 

      FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1`;

    const itemsQ = `

      SELECT oi.*, p.name FROM order_items oi 

      JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1`;

    

    const order = await pool.query(orderQ, [id]);

    const items = await pool.query(itemsQ, [id]);



    if (order.rows.length === 0) return res.status(404).send("Pedido no encontrado");



    // Formato de Ticket Simple (puedes imprimir esto o guardarlo)

    let ticket = `--- TICKET DE VENTA UMBRAL ---\n`;

    ticket += `Orden: #${order.rows[0].id}\nFecha: ${order.rows[0].created_at}\n`;

    ticket += `Cliente: ${order.rows[0].cliente}\n`;

    ticket += `------------------------------\n`;

    items.rows.forEach(i => {

      ticket += `${i.quantity}x ${i.name} - $${i.unit_price} (Sub: $${i.subtotal})\n`;

    });

    ticket += `------------------------------\n`;

    ticket += `TOTAL: $${order.rows[0].total}\n`;

    ticket += `Notas: ${order.rows[0].notes || 'Ninguna'}\n`;

    ticket += `\nGracias por tu compra en UMBRAL.`;



    res.setHeader('Content-Type', 'text/plain');

    res.send(ticket);

  } catch (e) {

    res.status(500).send("Error al generar ticket: " + e.message);

  }

});



module.exports = router;
