const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ error: "Acceso denegado. Token requerido." });
  }

  try {
    // Usamos la misma clave que en tus rutas de auth
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Guardamos los datos del usuario (id, role, etc)
    next();
  } catch (err) {
    console.error("Error validando token:", err.message);
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
};

const requiereRol = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({ error: "No tienes permiso para esta acción." });
    }
    next();
  };
};

module.exports = { verificarToken, requiereRol };