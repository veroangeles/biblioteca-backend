const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// "Base de datos" temporal
//let libros = [
//    { id: 1, titulo: "1984", autor: "George Orwell", anio: 1949 },
//    { id: 2, titulo: "Don Quijote", autor: "Cervantes", anio: 1605 }
//];

// GET - listar libros
router.get("/", async (req, res) => {
    const result = await pool.query("SELECT * FROM libros ORDER BY id ASC");
    res.json(result.rows);
});

// POST - crear libro
router.post("/", async (req, res) => {
    const { titulo, autor, anio } = req.body;

    const result = await pool.query(
        "INSERT INTO libros (titulo, autor, anio) VALUES ($1, $2, $3) RETURNING *",
        [titulo, autor, anio]
    );

    res.status(201).json(result.rows[0]);
});

// PUT update book
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { titulo, autor, anio } = req.body;

    const result = await pool.query(
        "UPDATE libros SET titulo=$1, autor=$2, anio=$3 WHERE id=$4 RETURNING *",
        [titulo, autor, anio, id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ mensaje: "Libro no encontrado" });
    }

    res.json(result.rows[0]);
});


//DELETE book
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
        "DELETE FROM libros WHERE id=$1 RETURNING *",
        [id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ mensaje: "Libro no encontrado" });
    }

    res.json(result.rows[0]);
});

module.exports = router;
