import { Request, Response, Router } from "express";
import { handleSlackInteraction } from "../controllers/slackController";

const router = Router();

router.post("/slack/actions", handleSlackInteraction);
router.get("/", (_req: Request, res: Response) => {
  res.sendStatus(200);
});

export default router;
