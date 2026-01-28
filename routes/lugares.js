const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../utils/auth');

//metodo get para un solo registro
router.get('/:id', verifyToken, (req, res) => {
    const { id } = req.params; //capturar el id desde los parametros de la URL
    const query = 'SELECT * FROM lugares WHERE id_lug = ?;';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener el Lugar' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Lugar no encontrado' });
        }
        res.json(results[0]);
    })
});

//metodo get para multiples registros con paginacion y busqueda
router.get('/', verifyToken, (req, res) => {
    //obtener parametros de la URL
    const page = parseInt(req.query.page) || 1; //pagina actual por registros
    const limit = parseInt(req.query.limit) || 10; // limite de rergistros por pagina 10
    const offset = (page - 1) * limit; //punto de inicio de la consulta
    const cadena = req.query.cadena;
    let whereClause = '';
    let queryParams = [];
    if (cadena) {
        whereClause = 'where nombre_lug like ? or descripcion_lug like ? or capacidadpersonas like ?';
        const searchTerm = `%${cadena}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    //consulta para obtener total de registros
    const countQuery = `select count(*) as total from lugares ${whereClause}`;
    db.query(countQuery, queryParams, (err, countResult) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error al obtener el total de Lugares' });
        }
        const totalLugares = countResult[0].total;
        const totalPages = Math.ceil(totalLugares / limit);
        //consulta para obtener los registros de la pagina 
        //const lugaresQuery = `select * from lugares ${whereClause} Limit ? OFFSET ?`;
        const lugaresQuery = `select id_lug, nombre_lug, descripcion_lug, direccion, costoentrada, capacidadpersonas, fk_id_ciu, nombre_ciu from lugares inner join ciudades ON id_ciu = fk_id_ciu ${whereClause} Limit ? OFFSET ? `
        queryParams.push(limit, offset);
        db.query(lugaresQuery, queryParams, (err, lugaresResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al obtener Lugares' });
            }
            //enviar respuesta con los datos y la informacion de la pagina
            res.json({
                totalItems: totalLugares,
                totalPages: totalPages,
                currentPage: page,
                limit: limit,
                data: lugaresResult
            });
        });
    });
});

//Metodo POST
/*router.post('/', verifyToken, (req, res) => {
    //obtener los datos
    const { nombre_lug, descripcion_lug, direccion, costoentrada, capacidadpersona, fk_id_ciu } = req.body;
    const query = 'insert into lugares values(null, ?, ?, ?, ?, ?, ?)';
    const values = [nombre_lug, descripcion_lug, direccion, costoentrada, capacidadpersona, fk_id_ciu];
    db.query(query, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error al insertar Lugares' });
        };
        res.status(201).json({
            message: 'Lugar insertado correctamente',
            id_lug: result.insertId
        })
    });
});*/

//Metodo POST
router.post("/", verifyToken, (req, res) => {
    //Obtener los datos
    const { nombre_lug, descripcion_lug, direccion, costoentrada, capacidadpersonas, fk_id_ciu } = req.body;
    const search_query = "select count(*) as contador from lugares where nombre_lug = ?";
    db.query(search_query, [nombre_lug], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error interno al verificar el lugar" });
        }
        if (result[0].contador > 0) {
            return res.status(409).json({ error: "El Lugar con el nombre " + nombre_lug + "ya esta" });
        }
        const query = "insert into lugares values(null, ?, ?, ?, ?, ?, ?)";
        const values = [nombre_lug, descripcion_lug, direccion, costoentrada, capacidadpersonas, fk_id_ciu];
        db.query(query, values, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error al insertar al lugar" });
            }
            res.status(201).json({
                message: "Lugar insertado correctamente",
                id_tur: result.insertId,
            });
        });
    });
});


//Metodo Put
router.put('/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const { nombre_lug, descripcion_lug, direccion, costoentrada, capacidadpersonas, fk_id_ciu } = req.body;
    const query = 'update lugares set nombre_lug=?, descripcion_lug=?, direccion=?, costoentrada=?, capacidadpersonas=?, fk_id_ciu=? where id_lug=?';
    const values = [nombre_lug, descripcion_lug, direccion, costoentrada, capacidadpersonas, fk_id_ciu, id];
    db.query(query, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error al actualizar Lugares' });
        };
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Lugar no encontrado" });
        }
        res.status(200).json({
            message: 'Lugar actualizado correctamente',
        })
    });
});

//Metodo Delete
/*router.delete('/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const query = 'delete from lugares where id_lug=?'
    const values = [id];
    db.query(query, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error al eliminar Lugares' });
        };
        res.status(201).json({
            message: 'Lugar eliminado correctamente',
        });
    });
});*/


//Metodo Delete

router.delete("/:id", verifyToken, async (req, res) => {
    const { id } = req.params;
    const search_query = "select count(*) as contador from visitas where fk_id_lug = ?";
    db.query(search_query, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error interno al verificar las visitas del lugar" });
        }
        
        if (result[0].contador > 0) {
            return res.status(409).json({error: "El lugar no se puede eliminar porque tiene una o más visitas registradas"});
        }
        const delete_query = "delete from lugares where id_lug = ?;";
        const values = [id];
        
        db.query(delete_query, values, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error al eliminar el lugar" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Lugar not found" });
            }
            res.status(200).json({
                message: "Lugar eliminado correctamente",
            });
        });
    });
});

module.exports = router;
