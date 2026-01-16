const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../utils/auth");

router.get("/:id", verifyToken, (req, res) => {
    const { id } = req.params; //Esta linea calcula el id desde los parametros de la url
    const query = "SELECT * FROM turistas WHERE id_tur = ?;";
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al obtener el turistas" });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "Turistas not found" });
        }
        res.json(results[0]);
    });
});

// Método get para multiples registros con paginacion y busqueda
router.get("/", verifyToken, (req, res) => {
    //Obtener parametro de la URL
    const page = parseInt(req.query.page) || 1; // pagina actual por defecto va a ser uno
    const limit = parseInt(req.query.limit) || 10; // limite de registros por defecto 10 registro
    const offset = (page - 1) * limit; //el punto de inicio de la consulta
    const cadena = req.query.cadena;
    let whereClause = "";
    let queryParams = [];
    if (cadena) {
        whereClause =
            "where cedula like ? or nombre_tur like ? or nacionalidad like ?";
        const searchTerm = `%${cadena}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    //Consultas para obtener registros
    const countQuery = `select count(*) as total from turistas ${whereClause}`;
    db.query(countQuery, queryParams, (err, countResult) => {
        if (err) {
            console.error(err);
            return res
                .status(500)
                .json({ error: "Error al obtener total de turistas" });
        }
        const totalTuristas = countResult[0].total;
        const totalPages = Math.ceil(totalTuristas / limit);
        //Consulta para obtener los registros de la pagina
        const turistasQuery = `select * from turistas ${whereClause} LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);
        db.query(turistasQuery, queryParams, (err, turistasResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error al obtener los turistas" });
            }
            //Enviar respuestas con los datos y la informacion de paginacion
            res.json({
                totalItems: totalTuristas,
                totalPage: totalPages,
                currentPage: page,
                limit: limit,
                data: turistasResult,
            });
        });
    });
});

//Metodo POST
router.post("/", verifyToken, (req, res) => {
    //Obtener los datos
    const { cedula, nombre_tur, email_tur, edad, genero, nacionalidad } =
        req.body;
    const search_query =
        "select count(*) as contador from turistas where cedula = ?";
    db.query(search_query, [cedula], (err, result) => {
        if (err) {
            console.log(err);
            return res
                .status(500)
                .json({ error: "Error interno al verificar el turista" });
        }
        if (result[0].contador > 0) {
            return res
                .status(409)
                .json({ error: "El turista con cédula " + cedula + "ya esta" });
        }
        const query = "insert into turistas values(null, ?, ?, ?, ?, ?, ?)";
        const values = [cedula, nombre_tur, email_tur, edad, genero, nacionalidad];
        db.query(query, values, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error al insertar al turista" });
            }
            res.status(201).json({
                message: "Turista insertado correctamente",
                id_tur: result.insertId,
            });
        });
    });
});

//Metodo PUT
router.put("/:id", verifyToken, async (req, res) => {
    const { id } = req.params;
    const { cedula, nombre_tur, email_tur, edad, genero, nacionalidad } =
        req.body;
    const query =
        "update turistas set cedula = ?, nombre_tur = ?, email_tur = ?, edad = ?, genero = ?, nacionalidad = ? where id_tur = ?;";
    const values = [
        cedula,
        nombre_tur,
        email_tur,
        edad,
        genero,
        nacionalidad,
        id,
    ];
    db.query(query, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error al actualizat al turista" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Turista not found" });
        }
        res.status(200).json({
            message: "Turista actualizado correctamente",
        });
    });
});

router.delete("/:id", verifyToken, async (req, res) => {
    const { id } = req.params;
    const search_query =
        "select count(*) as contador from visitas where fk_id_tur = ?";
    db.query(search_query, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error interno al verificar a la visita" });
        }
        if (result[0].contador > 0) {
            return res.status(409).json({error: "El turista no se puede eliminar porque tiene una visita registrada "});
        }
        const query = "delete from turistas where id_tur = ?;";
        const values = [id];
        db.query(query, values, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error al eliminar al turista" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Turista not found" });
            }
            res.status(200).json({
                message: "Turista eliminado correctamente",
            });
        });
    });
});
module.exports = router;
