// src/controllers/callLogController.ts
import { Request, Response } from "express";
import { CallLogModel } from "../models/callLog";
import logger from "../config/logger";

export const getCallLogs = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;
    const phoneNumber = req.query.phoneNumber as string | undefined;
    const callStatus = req.query.callStatus as string | undefined;

    const { logs, total } = await CallLogModel.getAll({
      limit,
      offset,
      startDate,
      endDate,
      phoneNumber,
      callStatus,
    });

    res.json({ success: true, data: { logs, total } });
  } catch (error) {
    logger.error("Error retrieving call logs", {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getCallLogDetail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { callSid } = req.params;
    const callLog = await CallLogModel.getByCallSid(callSid);

    if (!callLog) {
      res.status(404).json({ success: false, message: "Call log not found" });
      return;
    }

    res.json({ success: true, data: callLog });
  } catch (error) {
    logger.error("Error retrieving call log detail", {
      error: error instanceof Error ? error.message : String(error),
      callSid: req.params.callSid,
    });
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
