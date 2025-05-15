// src/models/callLog.ts
import { query } from "../config/database";
import logger from "../config/logger";

export interface CallLog {
  id?: number;
  callSid: string;
  phoneNumber: string;
  callStatus: string;
  callDuration?: number;
  answeredBy?: string;
  direction: string;
  recordingUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  responseText?: string;
  notes?: string;
}

export class CallLogModel {
  // Create a new call log entry
  static async create(callLog: CallLog): Promise<CallLog> {
    const {
      callSid,
      phoneNumber,
      callStatus,
      callDuration,
      answeredBy,
      direction,
      recordingUrl,
      responseText,
      notes,
    } = callLog;

    const sql = `
      INSERT INTO call_logs (
        call_sid, phone_number, call_status, call_duration, 
        answered_by, direction,recording_url, response_text, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      callSid,
      phoneNumber,
      callStatus,
      callDuration || null,
      answeredBy || null,
      direction,
      recordingUrl || null,
      responseText || null,
      notes || null,
    ];

    try {
      const result = await query(sql, values);
      logger.info("Created new call log", { callSid });
      return result.rows[0];
    } catch (error) {
      logger.error("Failed to create call log", {
        error: error instanceof Error ? error.message : String(error),
        callSid,
      });
      throw error;
    }
  }

  // Update an existing call log
  static async updateByCallSid(
    callSid: string,
    updates: Partial<CallLog>,
  ): Promise<CallLog | null> {
    // Create dynamic update query based on provided fields
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Add each field that needs to be updated
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== "callSid" && key !== "id") {
        // Convert camelCase to snake_case for DB columns
        const dbField = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        updateFields.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    // Always set updated_at to current time
    updateFields.push(`updated_at = NOW()`);

    // Add callSid to where clause
    values.push(callSid);

    const sql = `
      UPDATE call_logs
      SET ${updateFields.join(", ")}
      WHERE call_sid = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await query(sql, values);
      if (result.rows.length === 0) {
        logger.warn("Call log not found for update", { callSid });
        return null;
      }

      logger.info("Updated call log", { callSid });
      return result.rows[0];
    } catch (error) {
      logger.error("Failed to update call log", {
        error: error instanceof Error ? error.message : String(error),
        callSid,
      });
      throw error;
    }
  }

  // Get all call logs with optional filtering and pagination
  static async getAll(
    options: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      phoneNumber?: string;
      callStatus?: string;
    } = {},
  ): Promise<{ logs: CallLog[]; total: number }> {
    const {
      limit = 100,
      offset = 0,
      startDate,
      endDate,
      phoneNumber,
      callStatus,
    } = options;

    let whereClause = "";
    const whereConditions: string[] = [];
    const values: any[] = [limit, offset];
    let paramIndex = 3;

    // Add filters if provided
    if (startDate) {
      whereConditions.push(`created_at >= $${paramIndex++}`);
      values.push(startDate);
    }

    if (endDate) {
      whereConditions.push(`created_at <= $${paramIndex++}`);
      values.push(endDate);
    }

    if (phoneNumber) {
      whereConditions.push(`phone_number = $${paramIndex++}`);
      values.push(phoneNumber);
    }

    if (callStatus) {
      whereConditions.push(`call_status = $${paramIndex++}`);
      values.push(callStatus);
    }

    if (whereConditions.length > 0) {
      whereClause = `WHERE ${whereConditions.join(" AND ")}`;
    }

    // Query to get paginated results
    const sql = `
      SELECT * FROM call_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    // Query to get total count
    const countSql = `
      SELECT COUNT(*) as total FROM call_logs
      ${whereClause}
    `;

    try {
      const [result, countResult] = await Promise.all([
        query(sql, values),
        query(countSql, values.slice(2)), // Skip limit and offset parameters
      ]);

      return {
        logs: result.rows,
        total: parseInt(countResult.rows[0].total),
      };
    } catch (error) {
      logger.error("Failed to retrieve call logs", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Get a single call log by call SID
  static async getByCallSid(callSid: string): Promise<CallLog | null> {
    const sql = "SELECT * FROM call_logs WHERE call_sid = $1";

    try {
      const result = await query(sql, [callSid]);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      logger.error("Failed to retrieve call log", {
        error: error instanceof Error ? error.message : String(error),
        callSid,
      });
      throw error;
    }
  }
}
