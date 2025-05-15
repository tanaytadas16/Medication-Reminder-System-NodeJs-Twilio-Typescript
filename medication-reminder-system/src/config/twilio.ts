import twilio from "twilio";
import { config } from "./env";

export const twilioClient = twilio(
  config.twilio.accountSid,
  config.twilio.authToken
);
