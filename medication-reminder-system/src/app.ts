import express from "express";
import bodyParser from "body-parser";
import webhookRoutes from "./routes/webhookRoutes";
import callRoutes from "./routes/callRoutes";
import logger from "./config/logger";
import callLogRoutes from "./routes/callLogRoutes";

// Initialize the Express application
const app = express();

// Configure middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Register routes

app.use("/api", callRoutes);
// app.use("/api/call-logs", callLogRoutes);
app.use("/", webhookRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    logger.error("Application error:", err);
    res.status(500).json({ error: "Internal server error" });
  },
);

export default app;
