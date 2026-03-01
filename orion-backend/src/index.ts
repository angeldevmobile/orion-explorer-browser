import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import prisma from "./config/prisma";
import authRoutes from "./routes/auth";
import tabRoutes from "./routes/tabRoutes";
import favoriteRoutes from "./routes/favoritesRoutes";
import historyRoutes from "./routes/historyRoutes";
import voiceRoutes from './routes/sync';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:8080"
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tabs", tabRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/history", historyRoutes);
app.use('/api/voice', voiceRoutes);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "✅ Backend Orion está funcionando", 
    timestamp: new Date(),
    database: "🔗 Conectado a PostgreSQL"
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Error Handler
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  if (typeof err === "object" && err !== null && "status" in err && "message" in err) {
    const errorObj = err as { status?: number; message?: string };
    res.status(errorObj.status || 500).json({
      error: errorObj.message || "Error interno del servidor"
    });
  } else {
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Servidor Orion corriendo en http://localhost:${PORT}`);
  console.log(`Base de datos: ${process.env.DATABASE_URL}`);
});

// Graceful Shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});