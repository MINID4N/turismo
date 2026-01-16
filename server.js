const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// importar rutas
const authRoutes = require('./routes/auth');
const turistasRoutes = require('./routes/turistas');

//Usar las rutas
app.use('/api/auth', authRoutes);
app.use('/api/turistas', turistasRoutes);

//ruta de ejemplo

app.get('/', (req, res) => {
    res.send('Hola desde el servidor Express');
});

//Inicia el servidor
app.listen(port, ()=>{
    console.log(`Servidor escuchando en el puerto ${port}`);
});