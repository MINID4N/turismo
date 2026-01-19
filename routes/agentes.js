const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../utils/auth');
const bcrypt = require('bcrypt');

//Metodo Get para multiples registroscon paginación y busqueda
router.get('/:id', verifyToken, (req, res) => {
    const { id } = req.params;// Capturar el id desde los parametros de la url
    const query = 'SELECT * FROM agentes WHERE id_ag = ?;';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener los agentes' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Agente no encontrado' });
        }
        res.json(results[0]);
    });
});

router.get('/', verifyToken, (req, res) => {
    //Obtener parámetros de la URL
    const page = parseInt(req.query.page) || 1; //pagina actual por defecto va a ser 1
    const limit = parseInt(req.query.limit) || 10; //limites de registros por defecto son 10 registros
    const offset = (page - 1) * limit; // punto de inicio de la consulta
    const cadena = req.query.cadena;
    let WhereClause = '';
    let queryParams = [];
    if (cadena) {
        WhereClause = 'where nombre_ag like ? or usuario like ? or cargo like ?';
        const searchTerm = `%${cadena}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    //Consultas para obtener total de registros
    const countQuery = `select count(*) as total from agentes ${WhereClause}`;
    db.query(countQuery, queryParams, (err, countResult) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ err: 'Error al obtener total de agentes' });
        }
        const totalAgentes = countResult[0].total;
        const totalPages = Math.ceil(totalAgentes / limit);
        // consulta para obtener los registros de la página
        const agentesQuery = `select * from agentes ${WhereClause} LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);
        db.query(agentesQuery, queryParams, (err, agentesResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al obtener los agentes' });
            }
            //Enviar respuesta con los datos y la informacion de paginacion
            res.json({
                totalItems: totalAgentes,
                totalPage: totalPages,
                currentPage: page,
                limit: limit,
                data: agentesResult
            });
        });
    });
});

//Metodo POST
router.post('/', verifyToken, async (req, res) => {
    //Obtener los datos 
    const { nombre_ag, usuario, contrasena, cargo, telefono, email_ag } = req.body;
    const search_query = 'select count(*) as contador from agentes where usuario = ?';
    db.query(search_query, [usuario], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error interno al verificar el agente" });
        }
        if (result[0].contador > 0) {
            return res.status(409).json({ error: "El agente con usuario " + usuario + " Ya Existe" });
        }
    })
    const query = 'insert into agentes values(null, ?, ?, ?, ?, ?, ?)';
    try {
        const claveHasheada = await bcrypt.hash(usuario, 12);
        const values = [nombre_ag, usuario, claveHasheada, cargo, telefono, email_ag];
        db.query(query, values, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: 'Error al insertar agentes' });
                
            }
            res.status(201).json({
                message: 'Agente insertado correctamente',
                id_ag: result.insertId
            })
        })

    } catch (error) {
        //return res.status(500).json({error: 'Error al insertar agentes'});
        console.log(error);
    }

})
//MÉTODO PUT
router.put('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { nombre_ag, usuario, cargo, telefono, email_ag } = req.body;
    const query = 'update agentes set nombre_ag = ?, usuario = ?, cargo = ?, telefono = ?, email_ag = ? where id_ag = ?; ';
    const values = [nombre_ag, usuario, cargo, telefono, email_ag, id];
    db.query(query, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error al editar agentes' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Agente no encontrado" })
        }
        res.status(200).json({
            message: 'Agente actualizado correctamente',
        })
    })
});


//Método Delete para eliminar un registro
router.delete('/:id', verifyToken, (req, res) => {
    //Obtener el id
    const { id } = req.params;
    const search_query = 'select count(*) as contador from reservas where fk_id_ag = ?';
    db.query(search_query, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error interno al verificar la reserva" });
        }
        if (result[0].contador > 0) {
            return res.status(409).json({ error: "El turista no se puede eliminar porque tiene reserva" });
        }
    })
    const query = 'DELETE FROM agentes WHERE id_ag= ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error al eliminar el agente' });
        }
        if (result.affectedRows === 0) { // Si no se eliminó ningún registro affectedRows es 0
            return res.status(404).json({ message: 'Agente no encontrado' });
        }
        res.status(201).json({ message: 'Agente eliminado exitosamente' });
    });
});

module.exports = router; 
