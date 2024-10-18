import { Request, Response, Router } from "express";
import {
  handleAuthCallback,
  handleAuthorize,
  handleSlackInteraction,
} from "../controllers/slackController";
import connectDB from "../db/connection";
import { config } from "../config/config";
import axios from "axios";

const router = Router();

router.post("/slack/actions", handleSlackInteraction);
router.get("/slack/authorize", handleAuthorize);
router.get("/slack/callback", handleAuthCallback);

router.get("/", (_req: Request, res: Response) => {
  res.sendStatus(200);
});
router.get("/dbcheck", (_req: Request, res: Response) => {
  try {
    connectDB();
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
    throw new Error(`!!! Error while connection to DB !!! ${err}`);
  }
});

export default router;
