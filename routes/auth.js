const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const {generateToken} = require('../utils/auth');

router.post('/login', (req, res) => {
    const { usuario, contrasena } = req.body;
    db.query('SELECT * FROM agentes WHERE usuario = ?', [usuario], async (err, results) =>{
        if (err) throw err;
        if(results.length === 0) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos'});
        }
        const user = results[0];
        const isPasswordValid = await bcrypt.compare(contrasena, user.contrasena); //Usar el nombre del campo que hace la funcion de contraseña
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos'});
        }
        //Si el logueo es correcto la aplicacion genera un token y lo envia
        console.log({id: user.id_ag, usuario: user.usuario});
        const token = generateToken({ id: user.id_ag, usuario: user.usuario });
        res.json({ message: 'Logueo exitoso', token });
    });
});

module.exports = router;