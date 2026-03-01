import { Response } from "express";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

export class SearchController {
  /**
   * GET /api/search?q=texto - Buscar en historial y favoritos
   */
  static async search(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { q } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Parámetro de búsqueda 'q' requerido" });
      }

      const searchTerm = q.trim();

      // Buscar en favoritos
      const favorites = await prisma.favorite.findMany({
        where: {
          userId,
          OR: [
            { url: { contains: searchTerm, mode: "insensitive" } },
            { title: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      });

      // Buscar en historial
      const history = await prisma.history.findMany({
        where: {
          userId,
          OR: [
            { url: { contains: searchTerm, mode: "insensitive" } },
            { title: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        take: 20,
        orderBy: { timestamp: "desc" },
      });

      res.json({
        data: {
          favorites,
          history,
          totalResults: favorites.length + history.length,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Error al buscar" });
    }
  }
}