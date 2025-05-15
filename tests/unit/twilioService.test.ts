// tests/unit/twilioService.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import twilio from "twilio";

// Adjust the import path based on your actual file structure
import {
  makeCallWithAMD,
  sendTextReminder,
} from "../../src/services/twilioService";

// Mock the Twilio client
vi.mock("twilio", () => {
  return {
    default: vi.fn(() => ({
      calls: {
        create: vi.fn().mockResolvedValue({ sid: "MOCK_CALL_SID" }),
      },
      messages: {
        create: vi.fn().mockResolvedValue({ sid: "MOCK_MESSAGE_SID" }),
      },
    })),
  };
});

describe("Twilio Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully make a call with AMD enabled", async () => {
    // Assuming your makeCallWithAMD function takes these parameters
    // Adjust based on your actual implementation
    const result = await makeCallWithAMD("+1234567890");

    expect(twilio).toHaveBeenCalled();
    expect(result).toHaveProperty("sid", "MOCK_CALL_SID");
  });

  it("should handle errors when making calls", async () => {
    // Mock the implementation to throw an error
    vi.mocked(twilio).mockImplementationOnce(() => ({
      calls: {
        create: vi.fn().mockRejectedValue(new Error("Failed to make call")),
      },
      messages: {
        create: vi.fn(),
      },
    }));

    await expect(makeCallWithAMD("+1234567890")).rejects.toThrow(
      "Failed to make call",
    );
  });

  // Only include this test if you have implemented sendTextReminder
  it("should successfully send a text reminder", async () => {
    const result = await sendTextReminder(
      "+1234567890",
      "Medication reminder: Please take your medication.",
    );

    expect(twilio).toHaveBeenCalled();
    expect(result).toHaveProperty("sid", "MOCK_MESSAGE_SID");
  });
});
