import { Router } from "express";

import { handleCron } from "../controllers/cronController";

const router = Router();

router.get("/start", handleCron);

export default router;
