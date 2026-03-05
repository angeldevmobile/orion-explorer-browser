import { Request, Response } from "express";
import { tasksService } from "../services/taskService";

export const tasksController = {
  async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const tasks = await tasksService.getAll(userId);
      res.json({ success: true, data: tasks });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ success: false, error: "text is required" });
      }

      const task = await tasksService.create(userId, text);
      res.status(201).json({ success: true, data: task });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async toggle(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const task = await tasksService.toggle(id, userId);
      res.json({ success: true, data: task });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      await tasksService.delete(id, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};