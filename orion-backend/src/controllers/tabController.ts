import { Response } from "express";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

export class TabController {
  /**
   * GET /api/tabs - Obtener todas las tabs del usuario
   */
  static async getTabs(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;

      const tabs = await prisma.tab.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ data: tabs });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener tabs" });
    }
  }

  /**
   * POST /api/tabs - Crear una nueva tab
   */
  static async createTab(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { url, title, favicon } = req.body;

      if (!url || !title) {
        return res.status(400).json({ error: "URL y título son requeridos" });
      }

      const tab = await prisma.tab.create({
        data: {
          url,
          title,
          favicon,
          userId,
        },
      });

      res.status(201).json({ 
        message: "Tab creada exitosamente",
        data: tab 
      });
    } catch (error) {
      res.status(500).json({ error: "Error al crear tab" });
    }
  }

  /**
   * PUT /api/tabs/:id - Actualizar una tab
   */
  static async updateTab(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { url, title, favicon } = req.body;

      // Verificar que la tab pertenece al usuario
      const existingTab = await prisma.tab.findFirst({
        where: { id, userId },
      });

      if (!existingTab) {
        return res.status(404).json({ error: "Tab no encontrada" });
      }

      const tab = await prisma.tab.update({
        where: { id },
        data: { url, title, favicon },
      });

      res.json({ 
        message: "Tab actualizada exitosamente",
        data: tab 
      });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar tab" });
    }
  }

  /**
   * DELETE /api/tabs/:id - Eliminar una tab
   */
  static async deleteTab(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Verificar que la tab pertenece al usuario
      const existingTab = await prisma.tab.findFirst({
        where: { id, userId },
      });

      if (!existingTab) {
        return res.status(404).json({ error: "Tab no encontrada" });
      }

      await prisma.tab.delete({
        where: { id },
      });

      res.json({ message: "Tab eliminada exitosamente" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar tab" });
    }
  }
}