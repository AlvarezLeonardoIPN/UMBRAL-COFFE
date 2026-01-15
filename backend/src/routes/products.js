const express = require("express");
const pool = require("../db");
const { verificarToken, requiereRol } = require("../middleware/auth");
const upload = require("../middleware/upload");
const router = express.Router();

// 1. LISTAR PRODUCTOS
router.get("/", async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT p.*, c.name AS categoria, COALESCE(AVG(r.rating), 0) AS rating_promedio
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN reviews r ON p.id = r.product_id
            WHERE p.activo = true
            GROUP BY p.id, c.name 
            ORDER BY p.id DESC
        `);
        res.json(r.rows);
    } catch (e) {
        res.status(500).json({ error: "Error al obtener productos" });
    }
});

// 2. DETALLE DE PRODUCTO (CON GALERÍA RELACIONADA)
router.get("/:id", async (req, res) => {
    try {
        const pRes = await pool.query(`
            SELECT p.*, c.name AS categoria, COALESCE(AVG(r.rating), 0) AS rating_promedio
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN reviews r ON p.id = r.product_id
            WHERE p.id = $1
            GROUP BY p.id, c.name`, [req.params.id]);

        if (pRes.rows.length === 0) return res.status(404).json({ error: "No existe" });
        const producto = pRes.rows[0];

        // Traer fotos de product_images (columna 'url')
        const imgRes = await pool.query("SELECT url FROM product_images WHERE product_id = $1", [producto.id]);
        producto.gallery = imgRes.rows.map(row => row.url);

        res.json(producto);
    } catch (e) {
        res.status(500).json({ error: "Error de servidor" });
    }
});

// 3. CREAR PRODUCTO (Múltiples imágenes)
router.post("/", verificarToken, requiereRol(["admin", "inventarios"]), upload.array('images', 10), async (req, res) => {
    const client = await pool.connect();
    try {
        const { name, price, stock, category, description, estimated_delivery_days } = req.body;
        
        const mainImgUrl = (req.files && req.files.length > 0) 
            ? `/uploads/${req.files[0].filename}` 
            : '/uploads/default.jpg';

        await client.query("BEGIN");

        const r = await client.query(
            "INSERT INTO products (name, price, stock, category_id, description, image_url, estimated_delivery_days, activo) VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *",
            [name, price, stock, category, description, mainImgUrl, estimated_delivery_days || 3]
        );
        const newProd = r.rows[0];

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const url = `/uploads/${file.filename}`;
                await client.query("INSERT INTO product_images (product_id, url) VALUES ($1, $2)", [newProd.id, url]);
            }
        }

        await client.query("COMMIT");
        res.status(201).json(newProd);
    } catch (e) {
        await client.query("ROLLBACK");
        res.status(500).json({ error: "Error al crear producto" });
    } finally {
        client.release();
    }
});

// 4. ACTUALIZAR PRODUCTO (Soporta agregar más fotos)
router.put("/:id", verificarToken, requiereRol(["admin", "inventarios"]), upload.array('images', 10), async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { name, price, stock, category, description, estimated_delivery_days } = req.body;
        
        await client.query("BEGIN");

        await client.query(
            "UPDATE products SET name=$1, price=$2, stock=$3, category_id=$4, description=$5, estimated_delivery_days=$6 WHERE id=$7",
            [name, price, stock, category, description, estimated_delivery_days || 3, id]
        );

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const url = `/uploads/${file.filename}`;
                await client.query("INSERT INTO product_images (product_id, url) VALUES ($1, $2)", [id, url]);
            }
        }

        await client.query("COMMIT");
        res.json({ message: "Producto actualizado" });
    } catch (e) {
        await client.query("ROLLBACK");
        res.status(500).json({ error: "Error al actualizar" });
    } finally {
        client.release();
    }
});

router.delete("/:id", verificarToken, requiereRol(["admin"]), async (req, res) => {
    try {
        await pool.query("UPDATE products SET activo = false WHERE id = $1", [req.params.id]);
        res.json({ message: "Producto desactivado" });
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

module.exports = router;