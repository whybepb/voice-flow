"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleOutboundCall = exports.handleIncomingCall = void 0;
/**
 * TwiML endpoint for incoming/outgoing calls.
 * Responds with instructions telling Twilio to connect the call audio
 * to our WebSocket server for real-time AI processing.
 */
const handleIncomingCall = (req, res) => {
    const host = req.headers.host;
    const protocol = host?.includes('localhost') ? 'ws' : 'wss';
    const callerPhone = req.body.From || 'unknown';
    const calledPhone = req.body.To || 'unknown';
    const callSid = req.body.CallSid || '';
    console.log(`[TwiML] Incoming call from ${callerPhone} to ${calledPhone} (SID: ${callSid})`);
    // Respond with TwiML that connects the call to our WebSocket media stream
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="${protocol}://${host}/media-stream">
            <Parameter name="callSid" value="${callSid}" />
            <Parameter name="from" value="${callerPhone}" />
            <Parameter name="to" value="${calledPhone}" />
        </Stream>
    </Connect>
</Response>`;
    res.type('text/xml');
    res.send(twiml);
};
exports.handleIncomingCall = handleIncomingCall;
/**
 * TwiML endpoint specifically for outbound campaign calls.
 * Same logic, but can be customized with campaign-specific system prompts later.
 */
const handleOutboundCall = (req, res) => {
    const host = req.headers.host;
    const protocol = host?.includes('localhost') ? 'ws' : 'wss';
    const callSid = req.body.CallSid || '';
    console.log(`[TwiML] Outbound call connected (SID: ${callSid})`);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="${protocol}://${host}/media-stream">
            <Parameter name="callSid" value="${callSid}" />
        </Stream>
    </Connect>
</Response>`;
    res.type('text/xml');
    res.send(twiml);
};
exports.handleOutboundCall = handleOutboundCall;
