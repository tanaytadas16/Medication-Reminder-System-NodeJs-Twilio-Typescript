import express, { Router } from "express";
import { initiateCall, getCallLogs } from "../controllers/callController";
import { initiateReminderCall } from "../controllers/callController";

const router: Router = express.Router();

// API endpoints for triggering calls
router.post("/calls", initiateCall);

// Add this route to your existing router setup
router.post("/initiate-reminder", initiateReminderCall);

// Optional: API endpoint for retrieving call logs
router.get("/calls", getCallLogs);

export default router;
