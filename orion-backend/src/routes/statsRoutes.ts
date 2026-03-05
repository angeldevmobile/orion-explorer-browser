import { Router } from "express";
import { statsController } from "../controllers/statsController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/today", statsController.getTodayStats);
router.post("/visit", statsController.recordVisit);

export default router;