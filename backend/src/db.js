const { Pool } = require("pg");

const path = require("path");



// Forzamos la carga del .env por si acaso

require('dotenv').config({ path: path.join(__dirname, '../.env') });



const pool = new Pool({

  user: "umbral_app",

  host: "localhost",

  database: "umbral_db",

  password: "umbral123", // Contraseña directa para evitar el error de "string"

  port: 5432,

});



module.exports = {

  query: (text, params) => pool.query(text, params),

  connect: () => pool.connect(),

};
