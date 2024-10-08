import express from "express";
import slackRoutes from "./routes/slackRoutes";
import { vulnerabilityJob } from "./jobs/vulnerabilityJob";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add routes
app.use("/api", slackRoutes);
app.use("/", slackRoutes);

// Start the cron job
vulnerabilityJob.start();

export default app;
