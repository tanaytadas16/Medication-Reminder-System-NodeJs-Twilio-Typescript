import dotenv from "dotenv";
dotenv.config();

function validateEnv() {
  const requiredEnvVars = [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER",
    "NGROK_URL",
  ];

  const missingVars = requiredEnvVars.filter(
    (variable) => !process.env[variable],
  );

  if (missingVars.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missingVars.join(", ")}`,
    );
    process.exit(1);
  }
}

// Validate environment variables
validateEnv();

// Export config with fallbacks
export const config = {
  port: parseInt(process.env.PORT || "3000"),
  nodeEnv: process.env.NODE_ENV || "development",

  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID!,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN!,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER!,

  ngrokUrl: process.env.NGROK_URL!,
};
