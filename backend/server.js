const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Conexión a MongoDB
mongoose
  .connect("mongodb://localhost:27017/capaniwa_crm")
  .then(() => console.log("🏦 ERP BACKEND CONECTADO"))
  .catch((err) => console.error("Error MongoDB:", err));

// Schema Contable
const facturaSchema = new mongoose.Schema({
  empresa: String,
  clienteNombre: String,
  monto: Number,
  cuenta: { type: String, default: "700" },
  estado: { type: String, default: "Pendiente" },
  hash_verifactu: String,
  fecha: { type: Date, default: Date.now },
});

const Factura = mongoose.model("Factura", facturaSchema);

/* ============================
   RUTAS API
============================ */

app.get("/api/finanzas/facturas", async (req, res) => {
  try {
    const facturas = await Factura.find().sort({ fecha: -1 });
    res.json(facturas);
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.post("/api/finanzas/facturas-manual", async (req, res) => {
  try {
    const hash =
      "CPNW-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    const nueva = new Factura({ ...req.body, hash_verifactu: hash });
    await nueva.save();
    res.json(nueva);
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.put("/api/finanzas/pagar/:id", async (req, res) => {
  try {
    const act = await Factura.findByIdAndUpdate(
      req.params.id,
      { estado: "Pagada" },
      { new: true },
    );
    res.json(act);
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.get("/api/finanzas/balance", async (req, res) => {
  try {
    const facts = await Factura.find();
    const ingresos = facts
      .filter((f) => f.monto > 0)
      .reduce((a, b) => a + b.monto, 0);
    const gastos = Math.abs(
      facts.filter((f) => f.monto < 0).reduce((a, b) => a + b.monto, 0),
    );
    res.json({ ingresos, gastos, ebitda: ingresos - gastos });
  } catch (err) {
    res.status(500).json({ error: "Error en balance" });
  }
});

// RUTA IA (CORREGIDA PARA EVITAR 404)
app.post("/api/finanzas/ai-gemini", async (req, res) => {
  console.log("📩 Petición para IA recibida...");
  try {
    const facturas = await Factura.find().limit(20);

    // IMPORTANTE: El nombre debe ser exactamente gemini-1.5-flash o gemini-1.5-pro
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Eres un experto CFO. Datos contables: ${JSON.stringify(facturas)}. Responde brevemente a: ${req.body.pregunta}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log("🤖 Respuesta generada!");
    res.json({ respuesta: text });
  } catch (err) {
    console.error("❌ Detalle del error:", err.message);
    res
      .status(500)
      .json({ respuesta: "La IA no está disponible ahora mismo." });
  }
});

app.listen(process.env.PORT || 5002, () =>
  console.log(`💰 ERP Server en puerto ${process.env.PORT || 5002}`),
);
