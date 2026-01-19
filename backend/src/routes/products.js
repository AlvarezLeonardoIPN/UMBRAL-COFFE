const express = require("express");

const pool = require("../db");

const multer = require("multer");

const path = require("path");

const auth = require("../middleware/auth");



const router = express.Router();



// DEFINIR VERIFICARTOKEN PARA QUE NO DE REFERENCEERROR

const verificarToken = auth.verificarToken;

const requiereRol = auth.requiereRol;



// USAR RUTA ABSOLUTA PARA QUE NO DE ENOENT

const UPLOADS_DIR = path.join(__dirname, "../../uploads");



const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, UPLOADS_DIR);

    },

    filename: (req, file, cb) => {

        cb(null, Date.now() + path.extname(file.originalname));

    }

});

const upload = multer({ storage });



// 1. LISTAR

router.get("/", async (req, res) => {

    try {

        const result = await pool.query(`

            SELECT p.*, 

            COALESCE(json_agg(pi.url) FILTER (WHERE pi.url IS NOT NULL), '[]') as images 

            FROM products p 

            LEFT JOIN product_images pi ON p.id = pi.product_id 

            GROUP BY p.id ORDER BY p.id ASC`);

        res.json(result.rows);

    } catch (e) { res.status(500).json({ error: e.message }); }

});



// 2. CREAR (POST)

router.post("/", verificarToken, requiereRol(["admin", "inventario"]), upload.array("images"), async (req, res) => {

    try {

        const { name, price, stock, estimated_delivery, category_id, description } = req.body;

        const result = await pool.query(

            "INSERT INTO products (name, price, stock, estimated_delivery, category_id, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",

            [name, price, stock, estimated_delivery, category_id, description]

        );

        const productId = result.rows[0].id;

        if (req.files) {

            for (const file of req.files) {

                await pool.query("INSERT INTO product_images (product_id, url) VALUES ($1, $2)", [productId, `/uploads/${file.filename}`]);

            }

        }

        res.status(201).json({ message: "Creado", id: productId });

    } catch (e) { res.status(500).json({ error: e.message }); }

});



// 3. ACTUALIZAR (PUT)

router.put("/:id", verificarToken, requiereRol(["admin", "inventario"]), upload.array("images"), async (req, res) => {

    try {

        const { id } = req.params;

        const { name, price, stock, estimated_delivery, category_id, description } = req.body;

        await pool.query(

            "UPDATE products SET name=$1, price=$2, stock=$3, estimated_delivery=$4, category_id=$5, description=$6 WHERE id=$7",

            [name, price, stock, estimated_delivery, category_id, description, id]);

        if (req.files) {

            for (const file of req.files) {

                await pool.query("INSERT INTO product_images (product_id, url) VALUES ($1, $2)", [id, `/uploads/${file.filename}`]);

            }

        }

        res.json({ message: "Actualizado" });

    } catch (e) { res.status(500).json({ error: e.message }); }

});



// 4. DETALLE

router.get("/:id", async (req, res) => {

    try {

        const p = await pool.query("SELECT * FROM products WHERE id = $1", [req.params.id]);

        const imgs = await pool.query("SELECT id, url FROM product_images WHERE product_id = $1", [req.params.id]);

        if (p.rows.length === 0) return res.status(404).json({ error: "No existe" });

        let prod = p.rows[0];

        prod.images = imgs.rows;

        res.json(prod);

    } catch (e) { res.status(500).json({ error: e.message }); }

});



// 5. ELIMINAR IMAGEN

router.delete("/images/:id", verificarToken, requiereRol(["admin"]), async (req, res) => {

    try {

        await pool.query("DELETE FROM product_images WHERE id = $1", [req.params.id]);

        res.json({ message: "Eliminada" });

    } catch (e) { res.status(500).json({ error: e.message }); }

});



// 6. ELIMINAR PRODUCTO

router.delete("/:id", verificarToken, requiereRol(["admin"]), async (req, res) => {

    try {

        await pool.query("DELETE FROM products WHERE id = $1", [req.params.id]);

        res.json({ message: "Eliminado" });

    } catch (e) { res.status(500).json({ error: e.message }); }

});



module.exports = router;
