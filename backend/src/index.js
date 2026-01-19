require("dotenv").config();

const express = require("express");

const cors = require("cors");

const path = require("path");



// ImportaciÃ³n de todas tus rutas originales

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



// Ajuste de CORS para que acepte peticiones desde cualquier IP (necesario en la nube)

app.use(cors());

app.use(express.json());



// CONFIGURACIÃ“N DE CARPETA PÃšBLICA (uploads)

// En Amazon la carpeta estÃ¡ en backend/uploads, por eso usamos __dirname + "../uploads"

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));



// Tus rutas originales

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



app.get("/api/status", (req, res) => res.json({ ok: true, name: "UMBRAL API" }));

app.get("/", (req, res) => res.send("UMBRAL API viva âšœï¸"));



app.listen(PORT, () => {

  console.log(`í ½íº€ UMBRAL API corriendo en puerto ${PORT}`);

});
