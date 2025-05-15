import { vi } from "vitest";
import dotenv from "dotenv";

// Load environment variables from .env.test file if it exists
dotenv.config({ path: ".env.test" });

// Set up environment variables for testing
process.env.TWILIO_ACCOUNT_SID = "test_account_sid";
process.env.TWILIO_AUTH_TOKEN = "test_auth_token";
process.env.TWILIO_PHONE_NUMBER = "+15555555555";
