import { Request, Response } from "express";
import { sendVulnerabilityMessage } from "../services/slackService";
import { config } from "../config/config";

export const handleSlackInteraction = async (req: Request, res: Response) => {
  const action = req.body;

  if (
    action.type === "block_actions" &&
    action.actions[0].value === "forward_vulnerability"
  ) {
    await sendVulnerabilityMessage(action, config.adminId);
  }

  res.status(200).send();
};
