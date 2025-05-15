// tests/integration/webhookRoutes.test.ts
import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../../src/app";
import logger from "../../src/utils/logger";

vi.mock("../../src/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Webhook Routes", () => {
  it("should handle call status updates", async () => {
    const response = await request(app).post("/api/webhooks/call-status").send({
      CallSid: "CALL123",
      CallStatus: "completed",
      From: "+1234567890",
      To: "+0987654321",
      CallDuration: "60",
      Direction: "outbound-api",
    });

    expect(response.status).toBe(200);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Call status update"),
      expect.objectContaining({
        callSid: "CALL123",
        status: "completed",
      }),
    );
  });

  it("should handle short calls appropriately", async () => {
    const response = await request(app).post("/api/webhooks/call-status").send({
      CallSid: "CALL123",
      CallStatus: "completed",
      From: "+1234567890",
      To: "+0987654321",
      CallDuration: "5", // Short call
      Direction: "outbound-api",
    });

    expect(response.status).toBe(200);
    expect(logger.warning).toHaveBeenCalledWith(
      expect.stringContaining("hung up prematurely"),
      expect.objectContaining({
        callSid: "CALL123",
        callDuration: "5",
      }),
    );
  });

  it("should handle speech recognition results", async () => {
    const response = await request(app).post("/api/webhooks/voice").send({
      CallSid: "CALL123",
      SpeechResult: "Yes, I have taken my medication",
      Confidence: "0.8",
    });

    expect(response.status).toBe(200);
    // Test that TwiML is returned
    expect(response.text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(response.text).toContain("<Response>");
  });
});
