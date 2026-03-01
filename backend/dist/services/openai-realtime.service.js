"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMediaStream = handleMediaStream;
const ws_1 = __importDefault(require("ws"));
const prisma_1 = __importDefault(require("../prisma"));
const rag_service_1 = require("./rag.service");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
// Validate API key at module load
if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key') {
    console.warn('[OpenAI] ⚠️  OPENAI_API_KEY is not set or is a placeholder. AI voice calls will not work.');
}
// System prompt that defines the AI agent's personality and capabilities
const SYSTEM_MESSAGE = `You are a friendly, professional AI voice assistant for a business. Your job is to help callers with:
- Checking their booking/appointment status
- Rescheduling or cancelling appointments
- Answering general questions about the business

Guidelines:
- Be concise and conversational — you're on a phone call, not writing an essay.
- Confirm actions before executing them (e.g., "I'll reschedule your appointment to next Tuesday at 3 PM. Does that work?").
- If you don't have enough info (e.g., customer name or phone), ask for it politely.
- When the caller asks about company policies, services, pricing, hours, or other company-specific info, use the search_knowledge tool to look it up.
- Always cite which document the information came from when using knowledge base results.
- If you can't find the answer in the knowledge base, say: "I don't have that information available right now. Would you like me to connect you with a human agent who can help?"
- If you can't help, offer to transfer to a human agent.`;
// Voice setting for the AI
const VOICE = 'alloy';
// Tool definitions for function calling — the AI can invoke these mid-conversation
const TOOLS = [
    {
        type: 'function',
        name: 'check_booking_status',
        description: 'Look up a customer\'s booking by their phone number. Returns booking details including date, service, and status.',
        parameters: {
            type: 'object',
            properties: {
                phone: {
                    type: 'string',
                    description: 'The customer\'s phone number, e.g. +1234567890',
                },
            },
            required: ['phone'],
        },
    },
    {
        type: 'function',
        name: 'reschedule_booking',
        description: 'Reschedule a booking to a new date and time.',
        parameters: {
            type: 'object',
            properties: {
                booking_id: {
                    type: 'string',
                    description: 'The booking ID to reschedule',
                },
                new_date_time: {
                    type: 'string',
                    description: 'The new appointment date and time in ISO 8601 format, e.g. 2026-03-15T14:00:00Z',
                },
            },
            required: ['booking_id', 'new_date_time'],
        },
    },
    {
        type: 'function',
        name: 'cancel_booking',
        description: 'Cancel a booking.',
        parameters: {
            type: 'object',
            properties: {
                booking_id: {
                    type: 'string',
                    description: 'The booking ID to cancel',
                },
            },
            required: ['booking_id'],
        },
    },
    {
        type: 'function',
        name: 'search_knowledge',
        description: 'Search the company knowledge base for information about services, policies, pricing, hours, FAQs, or anything company-specific. Use this when the caller asks a question that might be answered by company documentation.',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'The search query based on what the caller is asking about',
                },
            },
            required: ['query'],
        },
    },
];
// ─── Tool Execution ────────────────────────────────────────────────
/**
 * Execute a tool call. The userId is needed for RAG search scoping (multi-tenant).
 */
async function executeToolCall(toolName, args, userId) {
    console.log(`[Tool Call] ${toolName}`, args);
    switch (toolName) {
        case 'check_booking_status': {
            if (!userId) {
                return JSON.stringify({
                    found: false,
                    message: 'Unable to check bookings — no user context available. Please offer to connect the caller with a human agent.',
                });
            }
            const customer = await prisma_1.default.customer.findFirst({
                where: { phone: args.phone, userId },
                include: {
                    bookings: {
                        orderBy: { appointmentTime: 'desc' },
                        take: 3,
                    },
                },
            });
            if (!customer) {
                return JSON.stringify({ found: false, message: 'No customer found with that phone number.' });
            }
            return JSON.stringify({
                found: true,
                customer_name: customer.name,
                bookings: customer.bookings.map((b) => ({
                    id: b.id,
                    service: b.service,
                    appointment_time: b.appointmentTime.toISOString(),
                    status: b.status,
                })),
            });
        }
        case 'reschedule_booking': {
            if (!userId) {
                return JSON.stringify({
                    success: false,
                    error: 'Unable to reschedule — no user context available. Please offer to connect the caller with a human agent.',
                });
            }
            try {
                const result = await prisma_1.default.booking.updateMany({
                    where: { id: args.booking_id, userId },
                    data: {
                        appointmentTime: new Date(args.new_date_time),
                        status: 'RESCHEDULED',
                    },
                });
                if (result.count === 0) {
                    return JSON.stringify({ success: false, error: 'Booking not found or update failed.' });
                }
                return JSON.stringify({ success: true, new_time: args.new_date_time });
            }
            catch (e) {
                return JSON.stringify({ success: false, error: 'Booking not found or update failed.' });
            }
        }
        case 'cancel_booking': {
            if (!userId) {
                return JSON.stringify({
                    success: false,
                    error: 'Unable to cancel — no user context available. Please offer to connect the caller with a human agent.',
                });
            }
            try {
                const result = await prisma_1.default.booking.updateMany({
                    where: { id: args.booking_id, userId },
                    data: { status: 'CANCELLED' },
                });
                if (result.count === 0) {
                    return JSON.stringify({ success: false, error: 'Booking not found or cancellation failed.' });
                }
                return JSON.stringify({ success: true });
            }
            catch (e) {
                return JSON.stringify({ success: false, error: 'Booking not found or cancellation failed.' });
            }
        }
        case 'search_knowledge': {
            if (!userId) {
                return JSON.stringify({
                    found: false,
                    message: 'Unable to search knowledge base — no user context available. Please offer to connect the caller with a human agent.',
                });
            }
            try {
                const results = await (0, rag_service_1.searchKnowledge)(userId, args.query, 3);
                if (results.length === 0) {
                    return JSON.stringify({
                        found: false,
                        message: 'No relevant information found in the knowledge base. Suggest transferring to a human agent who might be able to help.',
                    });
                }
                const ragContext = (0, rag_service_1.buildRAGPrompt)(args.query, results);
                return JSON.stringify({
                    found: true,
                    answer_context: ragContext.prompt,
                    sources: ragContext.sources.map((s) => ({
                        file: s.fileName,
                        chunk: s.chunkIndex + 1,
                        relevance: `${(s.similarity * 100).toFixed(1)}%`,
                    })),
                });
            }
            catch (error) {
                console.error('[RAG] Search failed during call:', error);
                return JSON.stringify({
                    found: false,
                    message: 'Knowledge base search encountered an error. Offer to connect the caller with a human agent.',
                });
            }
        }
        default:
            return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
}
// ─── Resolve userId from Call Context ──────────────────────────────
/**
 * Try to resolve the userId from the callSid.
 * Follows: CallLog (by sid) → Booking → userId
 * Falls back to checking the phone number of the caller against customers.
 */
async function resolveUserId(callSid, calledPhone, callerPhone) {
    // Strategy 1: Look up CallLog by SID → get userId directly
    if (callSid) {
        const callLog = await prisma_1.default.callLog.findUnique({
            where: { sid: callSid },
            select: { userId: true },
        });
        if (callLog?.userId) {
            console.log(`[RAG] Resolved userId ${callLog.userId} from callSid ${callSid}`);
            return callLog.userId;
        }
    }
    // Strategy 2: Look up User by called Twilio number → get userId
    if (calledPhone) {
        const user = await prisma_1.default.user.findFirst({
            where: { twilioPhoneNumber: calledPhone },
            select: { id: true },
        });
        if (user?.id) {
            console.log(`[RAG] Resolved userId ${user.id} from called phone ${calledPhone}`);
            return user.id;
        }
    }
    // Strategy 3: Look up Customer by caller phone → get userId
    if (callerPhone) {
        const customer = await prisma_1.default.customer.findFirst({
            where: { phone: callerPhone },
            orderBy: { createdAt: 'desc' },
            select: { userId: true },
        });
        if (customer?.userId) {
            console.log(`[RAG] Resolved userId ${customer.userId} from caller phone ${callerPhone}`);
            return customer.userId;
        }
    }
    console.warn('[RAG] Could not resolve userId for this call — RAG search will be disabled');
    return undefined;
}
// ─── OpenAI Realtime Session Handler ───────────────────────────────
function connectToOpenAI(retryCount = 0) {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key') {
        console.error('[OpenAI] Cannot connect: OPENAI_API_KEY is not configured');
        return null;
    }
    try {
        return new ws_1.default('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'realtime=v1',
            },
        });
    }
    catch (error) {
        console.error(`[OpenAI] Connection attempt ${retryCount + 1} failed:`, error);
        return null;
    }
}
function handleMediaStream(twilioWs, callSid) {
    console.log(`[MediaStream] New connection established${callSid ? ` for call ${callSid}` : ''}`);
    // Connect to OpenAI Realtime API
    const maybeWs = connectToOpenAI();
    if (!maybeWs) {
        console.error('[MediaStream] Failed to connect to OpenAI. Closing Twilio stream.');
        twilioWs.close();
        return;
    }
    // After the null guard, we know this is a valid WebSocket
    const openaiWs = maybeWs;
    let streamSid = null;
    let callMetadata = {};
    const transcriptParts = [];
    let isCleanedUp = false;
    // Resolved user ID for RAG search — will be set once we know the caller
    let resolvedUserId = undefined;
    // Promise that resolves once the OpenAI WebSocket is fully open and the
    // session has been configured.  Twilio messages are held until this fires
    // so we never try to send on a CONNECTING socket.
    let resolveOpenAI;
    const openaiReady = new Promise((resolve) => {
        resolveOpenAI = resolve;
    });
    // Graceful cleanup to prevent double-close
    function cleanup() {
        if (isCleanedUp)
            return;
        isCleanedUp = true;
        if (openaiWs.readyState === ws_1.default.OPEN)
            openaiWs.close();
        saveTranscript(callSid, transcriptParts.join('\n'));
    }
    // Helper: only send if the OpenAI socket is still open
    function safeSend(payload) {
        if (openaiWs.readyState === ws_1.default.OPEN) {
            openaiWs.send(payload);
        }
    }
    // ── OpenAI WebSocket Events ──────────────────────────────────
    openaiWs.on('open', () => {
        console.log('[OpenAI] Connected to Realtime API');
        // Configure the session
        const sessionUpdate = {
            type: 'session.update',
            session: {
                turn_detection: { type: 'server_vad' }, // Let OpenAI detect when user stops talking
                input_audio_format: 'g711_ulaw', // Twilio sends µ-law audio
                output_audio_format: 'g711_ulaw', // Send µ-law back to Twilio
                voice: VOICE,
                instructions: SYSTEM_MESSAGE,
                modalities: ['text', 'audio'],
                temperature: 0.8,
                tools: TOOLS,
                input_audio_transcription: {
                    model: 'whisper-1',
                },
            },
        };
        openaiWs.send(JSON.stringify(sessionUpdate));
        // Signal that we're ready to accept Twilio messages
        resolveOpenAI();
    });
    openaiWs.on('message', (data) => {
        try {
            const event = JSON.parse(data.toString());
            switch (event.type) {
                // AI is sending audio back — forward it to Twilio
                case 'response.audio.delta':
                    if (event.delta && streamSid) {
                        const audioDelta = {
                            event: 'media',
                            streamSid,
                            media: { payload: event.delta },
                        };
                        twilioWs.send(JSON.stringify(audioDelta));
                    }
                    break;
                // AI has finished a full response turn
                case 'response.done':
                    if (event.response?.output) {
                        for (const output of event.response.output) {
                            // Collect transcript text
                            if (output.content) {
                                for (const content of output.content) {
                                    if (content.transcript) {
                                        transcriptParts.push(`Assistant: ${content.transcript}`);
                                    }
                                }
                            }
                        }
                    }
                    break;
                // User finished speaking — capture their transcript
                case 'conversation.item.input_audio_transcription.completed':
                    if (event.transcript) {
                        transcriptParts.push(`Caller: ${event.transcript}`);
                    }
                    break;
                // AI wants to call a tool
                case 'response.function_call_arguments.done': {
                    const toolName = event.name;
                    const toolCallId = event.call_id;
                    let toolArgs = {};
                    try {
                        toolArgs = JSON.parse(event.arguments);
                    }
                    catch { }
                    // Execute the tool and send result back to OpenAI
                    // Pass resolvedUserId for RAG-scoped searches
                    executeToolCall(toolName, toolArgs, resolvedUserId).then((result) => {
                        // Send the tool output back so the AI can respond
                        const toolResponse = {
                            type: 'conversation.item.create',
                            item: {
                                type: 'function_call_output',
                                call_id: toolCallId,
                                output: result,
                            },
                        };
                        openaiWs.send(JSON.stringify(toolResponse));
                        // Tell OpenAI to generate a response using the tool result
                        openaiWs.send(JSON.stringify({ type: 'response.create' }));
                    });
                    break;
                }
                case 'error':
                    console.error('[OpenAI] Error:', event.error);
                    break;
                default:
                    // Log other events at debug level
                    if (process.env.NODE_ENV === 'development') {
                        console.log(`[OpenAI] Event: ${event.type}`);
                    }
                    break;
            }
        }
        catch (error) {
            console.error('[OpenAI] Error parsing message:', error);
        }
    });
    openaiWs.on('close', () => {
        console.log('[OpenAI] Connection closed');
    });
    openaiWs.on('error', (error) => {
        console.error('[OpenAI] WebSocket error:', error);
    });
    // ── Twilio WebSocket Events ──────────────────────────────────
    twilioWs.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            switch (data.event) {
                case 'connected':
                    console.log('[Twilio] Media stream connected');
                    break;
                case 'start':
                    streamSid = data.start.streamSid;
                    callMetadata = {
                        from: data.start.customParameters?.from,
                        to: data.start.customParameters?.to,
                    };
                    // Capture callSid if it wasn't passed in the URL
                    if (!callSid && data.start.customParameters?.callSid) {
                        callSid = data.start.customParameters.callSid;
                    }
                    console.log(`[Twilio] Stream started: ${streamSid}${callSid ? ` (Call SID: ${callSid})` : ''}`);
                    // Resolve userId for RAG search (async, non-blocking)
                    resolveUserId(callSid, callMetadata.to, callMetadata.from).then((uid) => {
                        resolvedUserId = uid;
                        if (uid) {
                            console.log(`[RAG] User context ready: ${uid}`);
                        }
                    }).catch((err) => {
                        console.error('[RAG] Failed to resolve userId:', err);
                    });
                    // Wait for OpenAI to be fully connected before sending the greeting
                    openaiReady.then(() => {
                        if (isCleanedUp)
                            return; // call may have ended while we waited
                        const initialEvent = {
                            type: 'conversation.item.create',
                            item: {
                                type: 'message',
                                role: 'user',
                                content: [
                                    {
                                        type: 'input_text',
                                        text: 'Greet the caller warmly and ask how you can help them today. Keep it brief.',
                                    },
                                ],
                            },
                        };
                        safeSend(JSON.stringify(initialEvent));
                        safeSend(JSON.stringify({ type: 'response.create' }));
                    });
                    break;
                case 'media':
                    // Forward audio from Twilio → OpenAI (only after connection is ready)
                    if (openaiWs.readyState === ws_1.default.OPEN) {
                        const audioAppend = {
                            type: 'input_audio_buffer.append',
                            audio: data.media.payload, // base64 µ-law audio
                        };
                        openaiWs.send(JSON.stringify(audioAppend));
                    }
                    break;
                case 'stop':
                    console.log('[Twilio] Media stream stopped');
                    cleanup();
                    break;
                default:
                    break;
            }
        }
        catch (error) {
            console.error('[Twilio] Error parsing message:', error);
        }
    });
    twilioWs.on('close', () => {
        console.log('[MediaStream] Twilio connection closed');
        cleanup();
    });
    twilioWs.on('error', (error) => {
        console.error('[MediaStream] Twilio WebSocket error:', error);
        cleanup();
    });
}
// ─── Persist Transcript ────────────────────────────────────────────
async function saveTranscript(callSid, transcript) {
    if (!callSid || !transcript)
        return;
    try {
        const callLog = await prisma_1.default.callLog.findUnique({
            where: { sid: callSid },
        });
        if (callLog) {
            await prisma_1.default.callLog.update({
                where: { sid: callSid },
                data: { transcript },
            });
            console.log(`[Transcript] Saved for call ${callSid}`);
        }
        else {
            console.warn(`[Transcript] No CallLog found for SID ${callSid}`);
        }
    }
    catch (error) {
        console.error('[Transcript] Error saving:', error);
    }
}
