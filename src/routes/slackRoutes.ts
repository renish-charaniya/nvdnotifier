import { Router } from "express";
import { handleSlackInteraction } from "../controllers/slackController";

const router = Router();

router.post("/slack/actions", handleSlackInteraction);

export default router;
