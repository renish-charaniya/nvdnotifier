import { Request, Response } from "express";
import { vulnerabilityCronJob } from "../jobs/vulnerabilityJob";

export const handleCron = async (req: Request, res: Response) => {
  console.time('vulnerabilityCronJob')
  await vulnerabilityCronJob(req, res);
  console.timeEnd('vulnerabilityCronJob')
};
