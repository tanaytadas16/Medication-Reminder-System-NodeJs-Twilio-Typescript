// src/routes/callLogRoutes.ts
import { Router } from "express";
import {
  getCallLogs,
  getCallLogDetail,
} from "../controllers/callLogController";

const router = Router();
router.get("/", getCallLogs);
router.get("/:callSid", getCallLogDetail);

export default router;
