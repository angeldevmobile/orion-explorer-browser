import { Request, Response } from "express";
import { notesService } from "../services/notesSrvice";

export const notesController = {
  async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const notes = await notesService.getAll(userId);
      res.json({ success: true, data: notes });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { text, url, color } = req.body;

      if (!text || !url) {
        return res.status(400).json({ success: false, error: "text and url are required" });
      }

      const note = await notesService.create(userId, { text, url, color: color || "" });
      res.status(201).json({ success: true, data: note });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      await notesService.delete(id, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};