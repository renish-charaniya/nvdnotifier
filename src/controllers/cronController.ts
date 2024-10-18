import { Request, Response } from "express";
import { vulnerabilityCronJob } from "../jobs/vulnerabilityJob";

export const handleCron = async (req: Request, res: Response) => {
  await vulnerabilityCronJob(req, res);
};
