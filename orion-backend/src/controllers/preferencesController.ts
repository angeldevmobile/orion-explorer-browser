import { Request, Response } from "express";
import { preferencesService } from "../services/preferentService";

export const preferencesController = {
  async get(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const prefs = await preferencesService.get(userId);
      res.json({ success: true, data: prefs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const prefs = await preferencesService.update(userId, req.body);
      res.json({ success: true, data: prefs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};