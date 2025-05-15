// tests/integration/callFlow.test.ts
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { makeCallWithAMD } from '../../src/services/twilioService';
import { processWebhookResponse } from '../../src/controllers/callController';
import { handleCallStatus } from '../../src/controllers/callStatusHandler';

// Create mock Express request and response objects
const createMockReq = (body = {}) => ({ body });
const createMockRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    sendStatus: vi.fn().mockReturnThis(),
  };
  return res;
};

// Mock necessary services
vi.mock('../../src/services/twilioService');
vi.mock('../../src/services/deepgramService', () => ({
  transcribeAudio: vi.fn().mockResolvedValue('I have taken my medication'),
}));
vi.mock('../../src/services/elevenLabsService', () => ({
  generateSpeech: vi.fn().mockResolvedValue(Buffer.from('audio data')),
}));

describe('Complete Call Flow', () => {
  it('should successfully complete a full call flow', async () => {
    // 1. Initiate call
    vi.mocked(makeCallWithAMD).mockResolvedValueOnce({ sid: 'TEST_CALL_SID' });

    // Simulate call being answered
    const callStatusReq = createMockReq({
      CallSid: 'TEST_CALL_SID',
      CallStatus: 'in-progress',
      AnsweredBy: 'human',
    });
    const callStatusRes = createMockRes();

    await handleCallStatus(callStatusReq, callStatusRes);
    expect(callStatusRes.sendStatus).toHaveBeenCalledWith(200);

    // Simulate webhook response with speech result
    const webhookReq = createMockReq({
      CallSid: 'TEST_CALL_SID',
      SpeechResult: 'Yes I have taken all my medications',
      Confidence: '0.9',
    });
    const webhookRes = createMockRes();
    webhookRes.send = vi.fn(xml => {
      expect(xml).toContain('<Response>');
      return webhookRes;
    });

    await processWebhookResponse(webhookReq, webhookRes);
    expect(webhookRes.send).toHaveBeenCalled();

    // Simulate call completion
    const completionReq = createMockReq({
      CallSid: 'TEST_CALL_SID',
      CallStatus: 'completed',
      CallDuration: '45',
    });
    const completionRes = createMockRes();

    await handleCallStatus(completionReq, completionRes);
    expect(completionRes.sendStatus).toHaveBeenCalledWith(200);
  });
});