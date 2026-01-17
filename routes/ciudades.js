const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../utils/auth');

//Método get para registro unico
router.get('/:id', verifyToken, (req, res) => {
    const { id } = req.params; //capturar el id desde los parametros de la url
    const query = 'SELECT * FROM ciudades WHERE id_ciu = ?;';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener la ciudad' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Ciudad no encontrado' });
        }
        res.json(results[0]);
    });
});


//Método Get para multiples registros con paginación y busqueda
router.get('/', verifyToken, (req, res) => {
    //Obtener parámetros de la URL  
    const page = parseInt(req.query.page) || 1; //pagina actual por defecto, va a ser 1
    const limit = parseInt(req.query.limit) || 10; //limite de registros, por defecto 10
    const offset = (page - 1) * limit; //El punto de inicio de la consulta
    const cadena = req.query.cadena; //
    let whereClause = '';
    let queryParams = [];
    if (cadena) {
        whereClause = 'where nombre_ciu like ? or idioma like ? or moneda like ?';
        const searchTerm = `%${cadena}%`; //incrustar la cadena
        queryParams.push(searchTerm, searchTerm, searchTerm);
    }


    //consultas para obtener total registros
    const countQuery = `select count(*) as total from ciudades ${whereClause}`;
    db.query(countQuery, queryParams, (err, countResult) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener total de ciudades' });
        }
        const totalCiudades = countResult[0].total;
        const totalPages = Math.ceil(totalCiudades / limit); //redondear hacia arriba
        //consulta para obtener los registros  de la página
        const ciudadesQuery = `select * from ciudades ${whereClause} LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);
        db.query(ciudadesQuery, queryParams, (err, ciudadesResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al obtener las ciudades' });
            }
            //Enviar respuesta con los datos y la información de paginación 
            res.json({
                totalItems: totalCiudades,
                totalPage: totalPages,
                currentPage: page,
                limit: limit,
                data: ciudadesResult
            });
        });
    });
});

//Metodo POST
router.post('/', verifyToken, (req, res) => {
    //Obtener los datos
    const { nombre_ciu, pais, descripcion_ciu, idioma, moneda } = req.body;
    const search_query = 'select count(*) as contador from ciudades where nombre_ciu = ?';
    db.query(search_query, [nombre_ciu], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error interno al verificar la ciudad' });
        }
        if (result[0].contador > 0) {
            return res.status(409).json({ error: 'La ciudad ' + nombre_ciu + ' ya está registrada' });
        }
        const query = 'insert into ciudades values(null, ?, ?, ?, ?, ?)';
        const values = [nombre_ciu, pais, descripcion_ciu, idioma, moneda];
        db.query(query, values, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: 'Error al insertar la ciudad' });
            }

            res.status(201).json({
                message: 'Ciudad insertada correctamente',
                id_ciu: result.insertId
            });
        });
    });
});


//Metodo put
router.put('/:id', verifyToken, (req, res) => {
    // Obtener el ID de la ciudad desde los parámetros de la URL
    const { id } = req.params;
    // Obtener los datos del cuerpo de la solicitud
    const { nombre_ciu, pais, descripcion_ciu, idioma, moneda } = req.body;

    // Consulta SQL para actualizar la ciudad
    const query = 'UPDATE ciudades SET nombre_ciu = ?, pais = ?, descripcion_ciu = ?, idioma = ?, moneda = ? WHERE id_ciu = ?';
    const values = [nombre_ciu, pais, descripcion_ciu, idioma, moneda, id];

    db.query(query, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error al actualizar la ciudad' });
        }
        // Verificar si se actualizó alguna fila
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Ciudad no encontrada' });
        }
        res.status(200).json({
            message: 'Ciudad actualizada correctamente',
        });
    });
});

//Metodo delete
router.delete('/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const search_query = 'select count(*) as contador from lugares where fk_id_ciu = ?';

    db.query(search_query, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error interno al verificar el lugar' });
        }
        if (result[0].contador > 0) {
            return res.status(409).json({ error: 'Esta ciudad ya tiene un lugar registrado, no se puede eliminar' });
        }
        const query = 'DELETE FROM ciudades WHERE id_ciu = ?;';
        const values = [id];
        db.query(query, values, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: 'Error al eliminar la ciudad' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Ciudad no encontrada' });
            }
            res.status(200).json({
                message: 'Ciudad eliminada correctamente',
            });
        });
    });

});
module.exports = router;