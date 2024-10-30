import "reflect-metadata";
import express from "express";
import slackRoutes from "./routes/slackRoutes";
import cronRoutes from "./routes/cronRoutes";
import { connectDB } from "./db/connection";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connectDB();

app.use("/api", slackRoutes);
app.use("/", slackRoutes);
app.use("/cron", cronRoutes);

// vulnerabilityJob.start();

export default app;
