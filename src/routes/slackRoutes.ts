import { Request, Response, Router } from "express";

import connectDB from "../db/connection";

import { SlackController } from "../controllers/slackController";

const router = Router();
const slackController = new SlackController();

router.post(
  "/slack/actions",
  slackController.handleSlackInteraction.bind(slackController)
);
router.get(
  "/slack/authorize",
  slackController.handleAuthorize.bind(slackController)
);
router.get(
  "/slack/callback",
  slackController.handleAuthCallback.bind(slackController)
);

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
