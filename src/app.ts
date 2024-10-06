import express from "express";
import slackRoutes from "./routes/slackRoutes";
import { vulnerabilityJob } from "./jobs/vulnerabilityJob";

const app = express();
app.use(express.json());

// Add routes
app.use("/api", slackRoutes);

// Start the cron job
vulnerabilityJob.start();

export default app;
