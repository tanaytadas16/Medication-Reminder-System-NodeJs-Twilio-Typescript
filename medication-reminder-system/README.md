# Medication Reminder System

This document outlines how to set up and use the Medication Reminder System, a platform that makes automated phone calls to remind patients about their medications using Twilio's telephony services.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Database Setup](#database-setup)
6. [Testing](#testing)
7. [Running the Application](#running-the-application)
8. [Making Test Calls](#making-test-calls)
9. [Understanding Call Logs](#understanding-call-logs)
10. [Troubleshooting](#troubleshooting)

## Project Overview

The Medication Reminder System uses:

- **Node.js** with **TypeScript** for the backend
- **Express** as the web framework
- **PostgreSQL** for the database
- **Twilio** for telephony services
- **Speech-to-Text (STT)** via Twilio or integrated services
- **Text-to-Speech (TTS)** via Twilio's voice services
- **Vitest** for testing

## Prerequisites

- Node.js (v16 or later)
- npm (v7 or later)
- PostgreSQL (v13 or later)
- ngrok or similar for exposing local server to the internet
- Twilio account
- (Optional) Deepgram account for advanced STT features

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/medication-reminder-system.git
   cd medication-reminder-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

## Configuration

### Environment Variables

Edit the `.env` file with your credentials:
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=medication_reminder
PG_USER=youruser
PG_PASSWORD=yourpassword

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Webhook Configuration
NGROK_URL=https://your-ngrok-subdomain.ngrok.io

# Optional: For advanced STT
DEEPGRAM_API_KEY=your_deepgram_api_key

# Optional: For advanced TTS
ELEVENLABS_API_KEY=your_elevenlabs_api_key









### Twilio Configuration

1. Sign up for a [Twilio account](https://www.twilio.com/try-twilio)
2. Obtain your Account SID and Auth Token from the Twilio Console
3. Purchase a Twilio phone number with voice capabilities
4. Configure your webhook URLs in the Twilio Console:
    - Voice URL: `https://your-ngrok-url.ngrok.io/twilio/outgoing-call`
    - Status Callback URL: `https://your-ngrok-url.ngrok.io/twilio/call-status`

### Speech-to-Text (STT) Configuration

The application uses Twilio's built-in speech recognition by default. No additional configuration is needed.

For advanced use cases with Deepgram:
1. Sign up for a [Deepgram account](https://deepgram.com)
2. Create an API key in the Deepgram console
3. Add the API key to your `.env` file

### Text-to-Speech (TTS) Configuration

The application uses Twilio's built-in TTS voices. You can specify the voice in the TwiML:

```typescript
gather.say(
  {
    voice: "Polly.Joanna", // Available Twilio voices
  },
  "Your message here"
);
```

## Database Setup

1. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE medication_reminder;
   ```

2. Run database migrations:
   ```bash
   npm run migrate
   ```

## Testing

The project uses Vitest for testing:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Running the Application

1. Start ngrok to expose your local server:
   ```bash
   ngrok http 3000
   ```

2. Update your `.env` file with the ngrok URL:
   ```
   NGROK_URL=https://your-subdomain.ngrok.io
   ```

3. Start the server:
   ```bash
   # Development mode with hot reload
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

## Making Test Calls

### Using the API

Make a POST request to trigger a call:

```bash
curl -X POST http://localhost:3000/api/calls \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "patientId": "12345",
    "medications": ["Aspirin", "Cardivol", "Metformin"]
  }'
```

### Using the Test Endpoint

You can also use the included `call.http` file with REST Client in VS Code or similar IDE plugins.

## Understanding Call Logs

Call progress and patient interactions are logged to the console with different levels:

- **INFO**: Normal operation logs
- **DEBUG**: Detailed operation for troubleshooting
- **WARN**: Potential issues that didn't prevent operation
- **ERROR**: Errors that prevented normal operation

Example log output: 2025-04-07 10:15:23 INFO: Call initiated to +1234567890 (callSid: CA1234567890abcdef) 2025-04-07 10:15:30 INFO: Call status update: ringing (callSid: CA1234567890abcdef) 2025-04-07 10:15:35 INFO: Call status update: in-progress (callSid: CA1234567890abcdef) 2025-04-07 10:15:40 INFO: Call CA1234567890abcdef - Patient response: "Yes I have taken my medications" 2025-04-07 10:15:45 INFO: Call status update: completed (callSid: CA1234567890abcdef)



Call data is also stored in the PostgreSQL database for historical analysis.

## Troubleshooting

### Common Issues

1. **Missing Webhook Responses**: Ensure ngrok is running and the URL is correctly set in `.env`

2. **Voicemail Detection Issues**: Check Twilio logs in the console for AMD results

3. **Database Connection Errors**: Verify PostgreSQL credentials and connection settings

4. **"No response from undefined"**: Check your logging code for undefined variables

### Debugging

Enable debug logging by setting `NODE_ENV=development` in your `.env` file.

For more detailed Twilio debugging, enable request and response logging:

```typescript
// In your app.js or server.js
app.use((req, res, next) => {
  if (req.path.includes('/twilio')) {
    console.log('Twilio Request:', {
      path: req.path,
      method: req.method,
      body: req.body
    });
  }
  next();
});
```

---

For additional support or to report issues, please open an issue on the project repository.