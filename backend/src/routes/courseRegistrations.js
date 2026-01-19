const express = require("express");

const pool = require("../db");

const { verificarToken } = require("../middleware/auth");

const router = express.Router();



router.post("/", verificarToken, async (req, res) => {

    try {

        const userId = req.user.id;

        const { courseName } = req.body;



        if (!courseName) return res.status(400).json({ error: "Curso requerido" });



        const check = await pool.query(

            "SELECT id FROM course_registrations WHERE user_id = $1 AND course_name = $2",

            [userId, courseName]

        );



        if (check.rows.length > 0) return res.status(400).json({ error: "Ya estás inscrito." });



        await pool.query(

            "INSERT INTO course_registrations (user_id, course_name) VALUES ($1, $2)",

            [userId, courseName]

        );



        res.json({ message: "Inscripción exitosa" });

    } catch (e) {

        res.status(500).json({ error: "Error al inscribirse" });

    }

});



module.exports = router;
