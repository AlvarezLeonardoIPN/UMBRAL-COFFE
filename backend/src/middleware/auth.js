const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "una_frase_larga_y_secreta_umbral_2025";



// 1. Función para validar que el usuario está logueado (soporta PDF por URL)

const verificarToken = (req, res, next) => {

    let token = req.header("Authorization");

    

    if (token) {

        token = token.replace("Bearer ", "");

    } 

    else if (req.query.token) {

        token = req.query.token;

    }



    if (!token) {

        return res.status(401).json({ error: "Acceso denegado. Token requerido." });

    }



    try {

        const verificado = jwt.verify(token, SECRET);

        req.user = verificado;

        next();

    } catch (e) {

        res.status(400).json({ error: "Token no válido o expirado." });

    }

};



// 2. Función para validar el rol (Admin/Cliente/Inventario) - LA QUE FALTABA

const requiereRol = (rolesPermitidos) => {

    return (req, res, next) => {

        if (!req.user || !rolesPermitidos.includes(req.user.role)) {

            return res.status(403).json({ error: "No tienes permisos para realizar esta acción." });

        }

        next();

    };

};



module.exports = { verificarToken, requiereRol };
