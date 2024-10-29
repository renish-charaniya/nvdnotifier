import { Request, Response, Router } from "express";

import { connectDB } from "../db/connection";

import { SlackController } from "../controllers/slackController";
import path from "node:path";

const router = Router();
const slackController = new SlackController();

router.get("/", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../../public/landingpage.html"));
});

router.get(
  "/slack/authorize",
  slackController.handleAuthorize.bind(slackController)
);

router.get(
  "/slack/callback",
  slackController.handleAuthCallback.bind(slackController)
);

router.post(
  "/slack/actions",
  slackController.handleSlackInteraction.bind(slackController)
);

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
