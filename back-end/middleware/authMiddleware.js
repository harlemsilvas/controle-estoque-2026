// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.error("Token não fornecido.");
    return res.status(401).json({ error: "Acesso negado. Token ausente." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("Erro ao verificar token:", err.message);
      return res.status(403).json({ error: "Token inválido." });
    }
    req.user = user;
    console.log("🚀 ~ jwt.verify ~ user:", user);
    next();
  });
};

module.exports = authenticateToken;
