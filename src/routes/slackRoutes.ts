import { Request, Response, Router } from "express";
import { handleSlackInteraction } from "../controllers/slackController";
import connectDB from "../db/connection";

const router = Router();

router.post("/slack/actions", handleSlackInteraction);
router.get("/", (_req: Request, res: Response) => {
  res.sendStatus(200);
});
router.get("/dbcheck", (_req: Request, res: Response) => {
  try {
    connectDB();
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
    throw new Error("!!! Error while connection to DB !!!");
  }
});

export default router;
