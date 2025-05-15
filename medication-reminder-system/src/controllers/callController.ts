import { Request, Response } from "express";
import VoiceResponse = require("twilio/lib/twiml/VoiceResponse");
import axios from "axios";
import logger from "../config/logger";
import { config } from "../config/env";
import { makeCallWithAMD } from "../services/twilioService";
import twilio from "twilio";
import { CallLogModel } from "../models/callLog";

/**
 * Handles incoming calls from patients
 */
export const handleIncomingCall = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { From, To, CallSid } = req.body;

  logger.info(`Incoming call received from ${From}`, {
    callSid: CallSid,
    to: To,
    from: From,
  });

  try {
    // Log the incoming call
    await CallLogModel.create({
      callSid: CallSid,
      phoneNumber: From,
      callStatus: "received",
      direction: "inbound",
      recordingUrl: "",
    });
  } catch (error) {
    logger.error("Failed to create call log for incoming call", {
      error: error instanceof Error ? error.message : String(error),
      callSid: CallSid,
    });
  }

  const twiml = new VoiceResponse();

  // Using the same gather/response pattern as outgoing calls
  const gather = twiml.gather({
    input: ["speech"],
    speechModel: "deepgram_nova-2",
    timeout: 5,
    speechTimeout: "auto",
    action: `${config.ngrokUrl}/twilio/process-response`,
    method: "POST",
  });

  gather.say(
    "Hello, this is a reminder from your healthcare provider to confirm your medications for the day. Please confirm if you have taken your Aspirin, Cardivol, and Metformin today.",
  );

  // Fallback if no response
  twiml.say("Thank you for calling. Please remember to take your medications.");
  twiml.hangup();

  res.type("text/xml");
  res.send(twiml.toString());
};

/**
 * Initiates an outbound call to a patient
 */
export const initiateCall = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    res.status(400).json({ error: "Phone number is required" });
    return;
  }
  const client = twilio(config.twilioAccountSid, config.twilioAuthToken);

  try {
    // Trigger call using Twilio API
    const call = await client.calls.create({
      url: `${config.ngrokUrl}/twilio/outgoing-call`,
      to: phoneNumber,
      from: config.twilioPhoneNumber,
      statusCallback: `${config.ngrokUrl}/call-status`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
      machineDetection: "DetectMessageEnd",
      machineDetectionTimeout: 30,
      asyncAmd: "false",
      asyncAmdStatusCallback: `${config.ngrokUrl}/twilio/amd-status`,
    });

    logger.info(`Call initiated to ${phoneNumber}`, {
      callSid: call.sid, // Fixed: Use call.sid instead of response.data.sid
    });

    res.status(200).json({
      success: true,
      callSid: call.sid,
    });
  } catch (error: unknown) {
    // Properly type the error as unknown
    logger.error("Error initiating call:", error);

    // Safely access error properties with type narrowing
    if (error instanceof Error) {
      res.status(500).json({
        error: "Failed to initiate call",
        message: error.message,
      });
    } else if (axios.isAxiosError(error) && error.response) {
      // Handle Axios-specific errors
      res.status(error.response.status).json({
        error: "Twilio API error",
        message: error.response.data,
      });
    } else {
      // Generic error handling
      res.status(500).json({
        error: "An unknown error occurred",
      });
    }
  }
};

/**
 * Processes the patient's response to a call
 */
export const processCallResponse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const twiml = new VoiceResponse();
  const { SpeechResult, CallSid } = req.body;

  if (SpeechResult) {
    // Update existing call log with the response text
    await CallLogModel.updateByCallSid(CallSid, {
      responseText: SpeechResult,
    });
  }

  // Log patient's response
  logger.info(`Call ${CallSid} - Patient response: "${SpeechResult}"`);

  if (SpeechResult && CallSid) {
    try {
      await CallLogModel.updateByCallSid(CallSid, {
        responseText: SpeechResult,
        // You can also update other fields if needed
        callStatus: "completed",
      });
    } catch (error) {
      logger.error("Failed to update call log with speech result", {
        error: error instanceof Error ? error.message : String(error),
        callSid: CallSid,
      });
    }
  }

  // TODO: Process response using NLP service or simple keyword matching
  const response = analyzeSpeechResponse(SpeechResult);

  twiml.say(response);
  twiml.hangup();

  res.type("text/xml");
  res.send(twiml.toString());
};

/**
 * Handles scenario when patient doesn't respond
 */
export const handleNoResponse = (req: Request, res: Response): void => {
  const twiml = new VoiceResponse();

  // Message when no response is received
  twiml.say(
    "I didn't hear your response. We'll try again later. Please remember to take your medications as prescribed.",
  );
  twiml.hangup();

  res.type("text/xml");
  res.send(twiml.toString());
};

/**
 * Simple function to analyze speech response
 * In a real application, this could be replaced with an NLP service
 */
/**
 * Simple function to analyze speech response
 * In a real application, this could be replaced with an NLP service
 */
function analyzeSpeechResponse(speech: string): string {
  // Convert to lowercase and trim whitespace
  speech = speech.toLowerCase().trim();

  // Check for affirmative responses
  const affirmativeResponses = [
    "yes",
    "yeah",
    "yep",
    "correct",
    "i did",
    "i have",
  ];
  const isAffirmative = affirmativeResponses.some(
    (response) => speech === response || speech.includes(response),
  );

  if (isAffirmative) {
    return "Thank you for confirming that you've taken your medications. Have a great day!";
  }

  // Check for negative responses
  const negativeResponses = [
    "no",
    "nope",
    "haven't",
    "i haven't",
    "not yet",
    "didn't",
  ];
  const isNegative = negativeResponses.some(
    (response) => speech === response || speech.includes(response),
  );

  if (isNegative) {
    return "I'm noting that you haven't taken your medications yet. Please remember to take them as prescribed by your doctor.";
  }

  // Default response for unclear answers
  return "I'm not sure I understood your response. Please remember to take your medications as prescribed by your doctor.";
}

/**
 * Retrieves call logs from Twilio API
 */
export const getCallLogs = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Get call logs from Twilio API
    const response = await axios.get(
      `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Calls.json`,
      {
        auth: {
          username: config.twilioAccountSid,
          password: config.twilioAuthToken,
        },
      },
    );

    logger.info(`Retrieved ${response.data.calls.length} call logs`);
    res.status(200).json(response.data.calls);
  } catch (error: unknown) {
    logger.error("Error retrieving call logs:", error);

    if (error instanceof Error) {
      res.status(500).json({
        error: "Failed to retrieve call logs",
        message: error.message,
      });
    } else if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json({
        error: "Twilio API error",
        message: error.response.data,
      });
    } else {
      res.status(500).json({
        error: "An unknown error occurred",
      });
    }
  }
};

export const handleAmdStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { CallSid, AnsweredBy } = req.body;

  console.log("amd json", req.body);
  logger.info(`Voicemail detected for call ${CallSid}`);
  try {
    let formattedAnsweredBy: string;
    let callStatus: string;

    if (AnsweredBy === "human") {
      formattedAnsweredBy = "human";
      callStatus = "answered";
    } else if (
      AnsweredBy === "machine_start" ||
      AnsweredBy === "machine_end_beep" ||
      AnsweredBy === "machine_end_silence" ||
      AnsweredBy === "machine_end_other" ||
      AnsweredBy?.startsWith("machine")
    ) {
      formattedAnsweredBy = "voicemail";
      callStatus = "voicemail";
    } else if (AnsweredBy === "fax") {
      formattedAnsweredBy = "fax";
      callStatus = "fax";
    } else {
      formattedAnsweredBy = "unknown";
      callStatus = "unknown";
    }

    // Update the call log with AMD results
    await CallLogModel.updateByCallSid(CallSid, {
      answeredBy: formattedAnsweredBy,
      callStatus: callStatus,
    });

    logger.info(`Updated call log with AMD status for call ${CallSid}`);
  } catch (error) {
    logger.error("Failed to update call log with AMD status", {
      error: error instanceof Error ? error.message : String(error),
      callSid: CallSid,
    });
  }

  // For now, just log that voicemail was detected

  const callDetailsResponse = await axios.get(
    `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Calls/${CallSid}.json`,
    {
      auth: {
        username: config.twilioAccountSid,
        password: config.twilioAuthToken,
      },
      timeout: 5000,
    },
  );

  const phoneNumber = callDetailsResponse.data.to;

  const client = twilio(config.twilioAccountSid, config.twilioAuthToken);

  await client.calls(CallSid).update({
    twiml: `
          <Response>
            <Pause length="2"/>
            <Say voice="alice">Hello, this is your medication reminder service. It's time to take your prescribed medication. Please don't forget to take the correct dosage. If you have any questions, please contact your healthcare provider. Thank you.</Say>
          </Response>
        `,
  });

  await sendVoicemailBackupSms(phoneNumber);

  // Always respond with success to Twilio
  res.sendStatus(200);
};

// export const handleAmdStatus = async (
//   req: Request,
//   res: Response,
// ): Promise<void> => {
//   const {
//     CallSid,
//     AnsweredBy,
//     MachineDetectionDuration,
//     MachineDetectionStatus,
//   } = req.body;
//
//   logger.info(`AMD Status for call ${CallSid}`, {
//     answeredBy: AnsweredBy,
//     detectionDuration: MachineDetectionDuration,
//     detectionStatus: MachineDetectionStatus,
//   });
//
//   try {
//     // If call went to voicemail, you might want to handle it specially
//     if (AnsweredBy === "machine_start") {
//       // For now, just log that voicemail was detected
//
//       const callDetailsResponse = await axios.get(
//         `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Calls/${CallSid}.json`,
//         {
//           auth: {
//             username: config.twilioAccountSid,
//             password: config.twilioAuthToken,
//           },
//           timeout: 5000,
//         },
//       );
//
//       const phoneNumber = callDetailsResponse.data.to;
//
//       logger.info(`Voicemail detected for call ${CallSid}`, {
//         answeredBy: AnsweredBy,
//         phoneNumber,
//       });
//       const client = twilio(config.twilioAccountSid, config.twilioAuthToken);
//
//       await client.calls(CallSid).update({
//         twiml: `
//           <Response>
//             <Pause length="2"/>
//             <Say voice="alice">Hello, this is your medication reminder service. It's time to take your prescribed medication. Please don't forget to take the correct dosage. If you have any questions, please contact your healthcare provider. Thank you.</Say>
//           </Response>
//         `,
//       });
//
//       // Optional: Send SMS as backup
//       // Some voicemail systems might cut off messages or be unreliable
//       // So it's good practice to also send an SMS
//       // await sendVoicemailBackupSms(phoneNumber);
//     }
//   } catch (error) {
//     logger.error(`Error handling AMD status for call ${CallSid}`, {
//       error: error instanceof Error ? error.message : String(error),
//     });
//   }
//
//   // Always respond with success to Twilio
//   res.sendStatus(200);
// };

export const initiateReminderCall = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      res.status(400).json({ error: "Phone number is required" });
      return;
    }

    // Call the makeCallWithAMD function
    // await makeCallWithAMD(phoneNumber);

    res.status(200).json({ message: "Reminder call initiated" });
  } catch (error) {
    logger.error("Failed to initiate reminder call", {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: "Failed to initiate call" });
  }
};

/**
 * Send SMS as backup when a voicemail is left
 * This ensures the recipient gets the message even if the voicemail system fails
 */
export const sendVoicemailBackupSms = async (
  phoneNumber: string,
): Promise<void> => {
  try {
    const messageContent =
      "We called to check on your medication but couldn't reach you. Please call us back or take your medications if you haven't done so.";

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`,
      new URLSearchParams({
        To: phoneNumber,
        From: config.twilioPhoneNumber,
        Body: messageContent,
      }),
      {
        auth: {
          username: config.twilioAccountSid,
          password: config.twilioAuthToken,
        },
      },
    );

    logger.info(`Voicemail backup SMS sent to ${phoneNumber}`, {
      messageSid: response.data.sid,
    });
  } catch (error) {
    logger.error(`Failed to send voicemail backup SMS to ${phoneNumber}`, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
