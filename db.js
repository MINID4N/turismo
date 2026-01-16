const mysql = require('mysql2');
require('dotenv').config();
// creamos conexion
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})

db.connect(err =>{
    if (err) {
        console.log('error al conectar con la base de datos: ', err);
        return;
    }
    console.log('Conexión exitosa con la base de datos MYSQL.');
});

module.exports = db; //expotar el objeto conexión