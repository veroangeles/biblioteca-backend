const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

// Inicializamos el cliente de Bedrock. 
// AWS tomará automáticamente las credenciales de tus variables de entorno (.env)
const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1"
});

// POST /chat - Endpoint para interactuar con Claude en AWS Bedrock
router.post("/", async (req, res) => {
    try {
        const { pregunta } = req.body;

        if (!pregunta) {
            return res.status(400).json({ respuesta: "Por favor, escribe una pregunta válida." });
        }

        // 1. Consultar la base de datos para obtener los libros actuales
        const result = await pool.query("SELECT * FROM libros ORDER BY id ASC");
        const librosActuales = result.rows;

        // 2. Definir las instrucciones del sistema (System Prompt)
        const instruccionesContexto = `
        Eres "Biblioteco Bot", un asistente virtual amigable, experto y carismático para una biblioteca personal.
        Tu trabajo es responder preguntas del usuario basándote ÚNICAMENTE en la siguiente lista de libros actuales en formato JSON:
        ${JSON.stringify(librosActuales, null, 2)}

        Reglas importantes:
        - Si el usuario te pide una recomendación, elige uno al azar o según lo que pida y argumenta de manera divertida por qué debería leerlo.
        - Si te preguntan cosas analíticas (más viejo, más nuevo, cuántos hay), calcula la respuesta usando los datos proveídos.
        - Si el usuario pregunta por un libro o autor que NO está en la lista, dile amablemente que no se encuentra en el inventario actual, pero sugiérele de forma ingeniosa que lo agregue usando el formulario superior de la página.
        - Responde de forma clara, amigable y usando formato de texto enriquecido sutil (puedes usar negritas o emojis).
        `;

        // 3. Configurar el cuerpo de la petición para Anthropic Claude 3 / 3.5
        // Usamos el ID del modelo Claude 3.5 Sonnet (puedes cambiarlo por Claude 3 Haiku si buscas máxima economía)
        const modelId = "anthropic.claude-3-5-sonnet-20240620-v1:0"; 

        const payload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 500,
            temperature: 0.7,
            system: instruccionesContexto, // Claude recibe las instrucciones del sistema aquí
            messages: [
                {
                    role: "user",
                    content: pregunta
                }
            ]
        };

        // 4. Enviar comando a AWS Bedrock
        const command = new InvokeModelCommand({
            modelId: modelId,
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(payload)
        });

        const response = await bedrockClient.send(command);
        
        // 5. Decodificar la respuesta que devuelve AWS
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const respuestaTexto = responseBody.content[0].text;

        // Enviar al frontend
        res.json({ respuesta: respuestaTexto });

    } catch (error) {
        console.error("Error en AWS Bedrock:", error);
        res.status(500).json({ 
            respuesta: "❌ Lo siento, mi cerebro de AWS Bedrock experimentó un problema de conexión." 
        });
    }
});

module.exports = router;