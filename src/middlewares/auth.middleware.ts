import { Request, Response, NextFunction } from "express";
import { config } from "../config/config";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["authorization"];

  if (!token || token !== config.AUTH_TOKEN) {
    return res
      .status(403)
      .send({ message: "Forbidden: Everything is in control." });
  }

  next();
};
