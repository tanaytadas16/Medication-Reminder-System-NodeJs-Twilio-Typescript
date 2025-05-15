import express, { Router } from "express";
import {
  handleOutgoingCall,
  processWebhookResponse as webhookProcessResponse,
  handleNoResponse as webhookHandleNoResponse,
} from "../controllers/webhookController";
import {
  handleIncomingCall,
  processCallResponse as callProcessResponse,
  handleAmdStatus,
  handleNoResponse as callHandleNoResponse,
} from "../controllers/callController";
import { handleCallStatus } from "../controllers/callStatusHandler";
import { initiateReminderCall } from "../controllers/callController";

const router: Router = express.Router();

// Call status and metadata routes
// This route is missing the handler function
// router.post("/twilio/call-status", handleCallStatus);
// Temporarily comment it out or implement the missing function

// Audio processing routes
// router.post("/twilio/audio-stream", handleAudioStream);

// TwiML instruction routes
router.post("/twilio/incoming-call", handleIncomingCall);
router.post("/twilio/outgoing-call", handleOutgoingCall);
router.post("/twilio/process-response", callProcessResponse);
router.post("/twilio/no-response", webhookHandleNoResponse);

// Add the new AMD status callback route
router.post("/twilio/amd-status", handleAmdStatus);

// Callback routes for call status updates
router.post("/call-status", handleCallStatus);

router.post("/initiate-reminder", initiateReminderCall);

export default router;
