require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path"); // 1. Importamos path para manejar carpetas

const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const productsRouter = require("./routes/products");
const categoriesRouter = require("./routes/categories");
const reviewsRouter = require("./routes/reviews");
const addressesRouter = require("./routes/addresses");
const paymentMethodsRouter = require("./routes/paymentMethods");
const ordersRouter = require("./routes/orders");
const reportsRouter = require("./routes/reports");
const courseRegistrationsRoutes = require('./routes/courseRegistrations');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: 'http://127.0.0.1:5500' }));
app.use(express.json());

// 2. HACER PÚBLICA LA CARPETA DE IMÁGENES
// Esto permite que si alguien entra a http://localhost:3000/uploads/foto.jpg la pueda ver
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

app.get("/api/status", (req, res) => res.json({ ok: true, name: "UMBRAL API" }));

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/addresses", addressesRouter);
app.use("/api/payment-methods", paymentMethodsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/inscripciones-cursos", courseRegistrationsRoutes);


app.get("/", (req, res) => {
  res.send("UMBRAL API viva ⚜️");
});

app.listen(PORT, () => {
  console.log(`UMBRAL API en http://localhost:${PORT}`);
});

