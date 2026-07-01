require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Importar rutas
const librosRoutes = require("./routes/libros");

// Ruta principal
app.get("/", (req, res) => {
    res.json({
        mensaje: "API Biblioteca funcionando 🚀"
    });
});

// Usar rutas
app.use("/libros", librosRoutes);

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});