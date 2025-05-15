import { Twilio } from "twilio";
import logger from "../config/logger";

// Initialize Twilio client
const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

/**
 * Makes an outbound call with Answering Machine Detection
 */
export const makeCallWithAMD = async (phoneNumber: string): Promise<void> => {
  try {
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    const ngrokUrl = process.env.NGROK_URL;

    if (!twilioPhoneNumber || !ngrokUrl) {
      throw new Error(
        "Missing required environment variables: TWILIO_PHONE_NUMBER or NGROK_URL",
      );
    }

    const call = await client.calls.create({
      url: `${ngrokUrl}/twilio/voice`,
      to: phoneNumber,
      from: twilioPhoneNumber, // Now guaranteed to be a string
      statusCallback: `${ngrokUrl}/call-status`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
      machineDetection: "DetectMessageEnd",
      machineDetectionTimeout: 30,
    });

    logger.info(`Call initiated to ${phoneNumber}`, {
      callSid: call.sid,
      amdEnabled: true,
    });
  } catch (error) {
    logger.error(`Failed to initiate call to ${phoneNumber}`, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
