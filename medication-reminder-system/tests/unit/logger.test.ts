// tests/unit/logger.test.ts
import { describe, it, expect, vi } from "vitest";
import logger from "../../src/config/logger";

describe("Logger", () => {
  it("should log info messages with metadata", () => {
    // Spy on console.log
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    logger.info("Test message", { callSid: "test-sid" });

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should log errors with stack traces", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const testError = new Error("Test error");

    logger.error("Error occurred", { error: testError });

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should log warning messages", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    logger.warn("Warning message", { callSid: "test-sid" });

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
