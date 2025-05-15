// tests/integration/callRoutes.test.ts
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { makeCallWithAMD } from "../../src/services/twilioService";

// Mock the twilioService
vi.mock("../../src/services/twilioService", () => ({
  makeCallWithAMD: vi.fn().mockResolvedValue({ sid: "TEST_CALL_SID" }),
}));

describe("Call API Routes", () => {
  it("should initiate a reminder call", async () => {
    const response = await request(app)
      .post("/api/calls/initiate-reminder")
      .send({ phoneNumber: "+1234567890" })
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("callSid", "TEST_CALL_SID");
    expect(makeCallWithAMD).toHaveBeenCalledWith(
      "+1234567890",
      expect.any(String),
    );
  });

  it("should return 400 for invalid phone number", async () => {
    const response = await request(app)
      .post("/api/calls/initiate-reminder")
      .send({ phoneNumber: "invalid" })
      .set("Accept", "application/json");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(makeCallWithAMD).not.toHaveBeenCalled();
  });

  it("should handle service errors gracefully", async () => {
    vi.mocked(makeCallWithAMD).mockRejectedValueOnce(
      new Error("Service error"),
    );

    const response = await request(app)
      .post("/api/calls/initiate-reminder")
      .send({ phoneNumber: "+1234567890" })
      .set("Accept", "application/json");

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("error");
  });
});
