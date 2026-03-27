import { Router } from "express";
import { SearchController } from "../controllers/searchController";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";

const router = Router();

// GET /api/search?q=texto — busca en historial y favoritos del usuario
router.get("/", authMiddleware, SearchController.search);

// GET /api/search/web?q=texto — busca en la web (re-ranking si hay sesión)
router.get("/web", optionalAuthMiddleware, SearchController.webSearch);

// GET /api/search/summary?q=texto — resumen IA de los resultados (requiere auth)
router.get("/summary", authMiddleware, SearchController.summarizeSearch);

export default router;
