import { Request, Response } from "express";
import { focusService } from "../services/focusService";

// Helper para extraer mensaje de error
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

// Helper para código de error de Prisma
function getErrorCode(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "code" in err) {
    return (err as { code: string }).code;
  }
  return undefined;
}

// Interfaz para request autenticado
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

export const focusController = {
  // Blocked sites
  async getBlockedSites(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const sites = await focusService.getBlockedSites(userId);
      res.json({ success: true, data: sites });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
  },

  async addBlockedSite(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { domain } = req.body;

      if (!domain) {
        return res.status(400).json({ success: false, error: "domain is required" });
      }

      const cleaned = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const site = await focusService.addBlockedSite(userId, cleaned);
      res.status(201).json({ success: true, data: site });
    } catch (error: unknown) {
      if (getErrorCode(error) === "P2002") {
        return res.status(409).json({ success: false, error: "Site already blocked" });
      }
      res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
  },

  async removeBlockedSite(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id } = req.params;
      await focusService.removeBlockedSite(id, userId);
      res.json({ success: true });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
  },

  // Sessions
  async startSession(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { durationMs } = req.body;

      if (!durationMs || durationMs <= 0) {
        return res.status(400).json({ success: false, error: "Valid durationMs required" });
      }

      const session = await focusService.startSession(userId, durationMs);
      res.status(201).json({ success: true, data: session });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
  },

  async endSession(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id } = req.params;
      const { elapsedMs, completed } = req.body;
      await focusService.endSession(id, userId, elapsedMs, completed);
      res.json({ success: true });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
  },

  async getSessionHistory(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const sessions = await focusService.getSessionHistory(userId);
      res.json({ success: true, data: sessions });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
  },
};