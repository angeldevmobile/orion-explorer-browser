import { Request, Response } from "express";
import { statsService } from "../services/statsService";

export const statsController = {
  async getTodayStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const stats = await statsService.getTodayStats(userId);
      const topSites = await statsService.getTopSites(userId);
      const hourlyUsage = await statsService.getHourlyUsage(userId);

      res.json({
        success: true,
        data: {
          ...stats,
          dataSavedBytes: stats.dataSavedBytes.toString(),
          topSites,
          hourlyUsage,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async recordVisit(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { domain, minutes } = req.body;
      await statsService.recordSiteVisit(userId, domain, minutes || 1);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};