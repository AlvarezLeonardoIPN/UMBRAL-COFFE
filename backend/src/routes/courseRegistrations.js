const express = require("express");
const pool = require("../db");
const { verificarToken } = require("../middleware/auth");
const router = express.Router();

router.post("/", verificarToken, async (req, res) => {
    try {
        // Bloqueo de Staff
        if (req.user.role !== 'cliente') {
            return res.status(403).json({ 
                error: "El personal administrativo no puede inscribirse a cursos públicos." 
            });
        }

        const { courseId, schedule } = req.body;
        const userId = req.user.id;

        if (!courseId || !schedule) {
            return res.status(400).json({ error: "Datos incompletos." });
        }

        const check = await pool.query(
            "SELECT id FROM course_registrations WHERE user_id = $1 AND course_id = $2",
            [userId, courseId]
        );
        if (check.rows.length > 0) {
            return res.status(400).json({ error: "Ya estás registrado." });
        }

        const result = await pool.query(
            "INSERT INTO course_registrations (user_id, course_id, schedule) VALUES ($1, $2, $3) RETURNING *",
            [userId, courseId, schedule]
        );
        res.status(201).json({ message: "¡Inscripción exitosa!", data: result.rows[0] });

    } catch (err) {
        res.status(500).json({ error: "Error servidor", detail: err.message });
    }
});

router.get("/mine", verificarToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT cr.id, cr.schedule, cr.created_at, c.title, c.image_url 
             FROM course_registrations cr
             JOIN courses c ON cr.course_id = c.id
             WHERE cr.user_id = $1
             ORDER BY cr.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

module.exports = router;