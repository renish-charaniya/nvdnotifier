import { Router } from "express";

import { handleCron } from "../controllers/cronController";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/start", authMiddleware, handleCron);

export default router;
