import { Request, Response } from "express";
import logger from "../config/logger";
import { CallLogModel, CallLog } from "../models/callLog";

/**
 * Handles Twilio call status callbacks
 */
export const handleCallStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { CallSid, CallStatus, CallDuration, AnsweredBy } = req.body;

  logger.info(`Call status update received for call ${CallSid}`, {
    status: CallStatus,
    duration: CallDuration,
    answeredBy: AnsweredBy,
  });

  try {
    const updates: Partial<CallLog> = {};

    type AnswerType =
      | "human"
      | "machine_end_beep"
      | "machine_end_silence"
      | "machine_end_other"
      | "fax"
      | "unknown";

    // Define mapping objects with proper types
    const amdStatusMap: Record<AnswerType, string> = {
      human: "answered_human",
      machine_end_beep: "answered_machine",
      machine_end_silence: "answered_machine",
      machine_end_other: "answered_machine",
      fax: "answered_fax",
      unknown: "answered_unknown",
    };

    type CallStatusInfo = {
      status: string;
      answeredBy?: string;
    };

    const callStatusMap: Record<string, CallStatusInfo> = {
      completed: { status: "answered", answeredBy: "human" },
      busy: { status: "busy" },
      "no-answer": { status: "voicemail", answeredBy: "voicemail" },
      canceled: { status: "rejected" },
      failed: { status: "failed" },
      ringing: { status: "ringing" },
      "in-progress": { status: "in-progress" },
      "no-response": { status: "no-response", answeredBy: "none" },
    };

    // Process AMD result if available
    if (AnsweredBy && isValidAnswerType(AnsweredBy)) {
      updates.answeredBy = AnsweredBy;
      updates.callStatus = amdStatusMap[AnsweredBy];
    }

    // Process call status (only override if not set by AMD)
    const statusInfo = callStatusMap[CallStatus] || {
      status: CallStatus.toLowerCase(),
    };

    // Apply call status (don't override AMD status)
    if (!updates.callStatus) {
      updates.callStatus = statusInfo.status;
    }

    // Apply answeredBy (don't override AMD result)
    if (!updates.answeredBy && statusInfo.answeredBy) {
      updates.answeredBy = statusInfo.answeredBy;
    }

    // Type guard function to verify the answer type
    function isValidAnswerType(value: string): value is AnswerType {
      return value in amdStatusMap;
    }

    // Only update if we have fields to update
    if (Object.keys(updates).length > 0) {
      await CallLogModel.updateByCallSid(CallSid, updates);

      logger.info(`Updated call log with status for call ${CallSid}`, {
        originalStatus: CallStatus,
        updates,
      });
    }
  } catch (error) {
    logger.error("Failed to update call log with call status", {
      error: error instanceof Error ? error.message : String(error),
      callSid: CallSid,
    });
  }

  res.sendStatus(200);
};

// import { Request, Response } from "express";
// import logger from "../config/logger";

/**
 * Handles Twilio call status callbacks
 */
// export const handleCallStatus = async (
//   req: Request,
//   res: Response,
// ): Promise<void> => {
//   const {
//     CallSid,
//     CallStatus,
//     To,
//     CallDuration,
//     Duration,
//     Direction,
//     AnsweredBy,
//   } = req.body;
//
//   // Log the call status
//   logger.info(`Call status update for ${To}`, {
//     callSid: CallSid,
//     status: CallStatus,
//     duration: CallDuration,
//     direction: Direction,
//   });
//
//   // Call is completed but was very short (user hung up)
//   if (CallStatus === "completed" && parseInt(CallDuration) < 10) {
//     logger.warning(`Patient ${To} likely hung up prematurely`, {
//       callSid: CallSid,
//       callDuration: CallDuration,
//       actualTalkDuration: Duration,
//     });
//
//     // Send a text reminder
//     // try {
//     //   await sendTextReminder(To);
//     //   logger.info(`Text reminder sent to ${To} after call hang-up`, {
//     //     callSid: CallSid,
//     //   });
//     // } catch (error) {
//     //   logger.error(`Failed to send text reminder to ${To}`, {
//     //     callSid: CallSid,
//     //     error: error instanceof Error ? error.message : String(error),
//     //   });
//     // }
//   } else if (CallStatus === "no-answer" || CallStatus === "busy") {
//     // Call was not answered or line was busy
//     logger.warning(`Patient ${To} did not answer or line was busy`, {
//       callSid: CallSid,
//       status: CallStatus,
//     });
//
//     // Send a text reminder
//     // try {
//     //   await sendTextReminder(To);
//     //   logger.info(`Text reminder sent to ${To} after ${CallStatus}`, {
//     //     callSid: CallSid,
//     //   });
//     // } catch (error) {
//     //   logger.error(`Failed to send text reminder to ${To}`, {
//     //     callSid: CallSid,
//     //     error: error instanceof Error ? error.message : String(error),
//     //   });
//     // }
//   }
//
//   // Send successful response back to Twilio
//   res.sendStatus(200);
// };
