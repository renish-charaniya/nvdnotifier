import express from "express";
import slackRoutes from "./routes/slackRoutes";
import connectDB from "./db/connection";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use("/api", slackRoutes);
app.use("/", slackRoutes);

// vulnerabilityJob.start();

export default app;
