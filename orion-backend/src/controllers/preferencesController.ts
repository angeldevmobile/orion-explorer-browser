import { Request, Response } from "express";
import { preferencesService } from "../services/preferentService";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export const preferencesController = {
  async get(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const prefs = await preferencesService.get(userId);
      res.json({ success: true, data: prefs });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const prefs = await preferencesService.update(userId, req.body);
      res.json({ success: true, data: prefs });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
  },
};