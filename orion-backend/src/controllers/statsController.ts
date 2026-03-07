import { Response } from "express";
import { statsService } from "../services/statsService";
import { AuthenticatedRequest } from "../types/authType";

export const statsController = {
  async getTodayStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
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
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, error: message });
    }
  },

  async recordVisit(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { domain, minutes } = req.body;
      await statsService.recordSiteVisit(userId, domain, minutes || 1);
      res.json({ success: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, error: message });
    }
  },
};