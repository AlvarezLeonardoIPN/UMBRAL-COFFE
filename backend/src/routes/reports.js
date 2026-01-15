// src/routes/reports.js
const express = require("express");
const pool = require("../db");
const { verificarToken, requiereRol } = require("../middleware/auth");

const router = express.Router();

/*
GET /api/reports/daily?days=14
Admin: ventas por dia (ultimos N dias)
*/
router.get("/daily", verificarToken, requiereRol(["admin"]), async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days || 14)));

    const q = `
      SELECT
        (o.created_at::date) AS day,
        COUNT(*)::int AS orders,
        COALESCE(SUM(o.total), 0)::numeric(10,2) AS total
      FROM orders o
      WHERE o.created_at >= (CURRENT_DATE - $1::int)
      GROUP BY (o.created_at::date)
      ORDER BY day DESC
    `;

    const r = await pool.query(q, [days]);
    return res.json(r.rows);
  } catch (e) {
    return res.status(500).json({
      error: "No se pudo generar reporte diario.",
      detail: e.message
    });
  }
});

/*
GET /api/reports/monthly?months=12
Admin: ventas por mes (ultimos N meses)
*/
router.get("/monthly", verificarToken, requiereRol(["admin"]), async (req, res) => {
  try {
    const months = Math.max(1, Math.min(60, Number(req.query.months || 12)));

    // desde el primer dia del mes (hace N-1 meses)
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const fromISO = from.toISOString();

    const q = `
      SELECT
        to_char(date_trunc('month', o.created_at), 'YYYY-MM') AS month,
        COUNT(*)::int AS orders,
        COALESCE(SUM(o.total), 0)::numeric(10,2) AS total
      FROM orders o
      WHERE o.created_at >= $1::timestamptz
      GROUP BY date_trunc('month', o.created_at)
      ORDER BY month DESC
    `;

    const r = await pool.query(q, [fromISO]);
    return res.json(r.rows);
  } catch (e) {
    return res.status(500).json({
      error: "No se pudo generar reporte mensual.",
      detail: e.message
    });
  }
});

/*
GET /api/reports/top-products?months=12
Admin: producto mas vendido por mes (unidades)
*/
router.get("/top-products", verificarToken, requiereRol(["admin"]), async (req, res) => {
  try {
    const months = Math.max(1, Math.min(60, Number(req.query.months || 12)));

    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const fromISO = from.toISOString();

    const q = `
      WITH monthly AS (
        SELECT
          to_char(date_trunc('month', o.created_at), 'YYYY-MM') AS month,
          oi.product_id,
          p.name AS product_name,
          SUM(oi.quantity)::int AS units
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON p.id = oi.product_id
        WHERE o.created_at >= $1::timestamptz
        GROUP BY 1, 2, 3
      ),
      ranked AS (
        SELECT
          month, product_id, product_name, units,
          ROW_NUMBER() OVER (PARTITION BY month ORDER BY units DESC, product_id ASC) AS rn
        FROM monthly
      )
      SELECT month, product_id, product_name, units
      FROM ranked
      WHERE rn = 1
      ORDER BY month DESC
    `;

    const r = await pool.query(q, [fromISO]);
    return res.json(r.rows);
  } catch (e) {
    return res.status(500).json({
      error: "No se pudo generar top productos.",
      detail: e.message
    });
  }
});

module.exports = router;
