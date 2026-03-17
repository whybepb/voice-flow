"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMediaStream = handleMediaStream;
const ws_1 = __importDefault(require("ws"));
const prisma_1 = __importDefault(require("../prisma"));
const rag_service_1 = require("./rag.service");
const secret_crypto_1 = require("../utils/secret-crypto");
const background_job_handlers_1 = require("./background-job-handlers");
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
const VOICE = "alloy";
// Tool definitions for function calling — the AI can invoke these mid-conversation
const TOOLS = [
    {
        type: "function",
        name: "check_booking_status",
        description: "Look up a customer's booking by their phone number. Returns booking details including date, service, and status.",
        parameters: {
            type: "object",
            properties: {
                phone: {
                    type: "string",
                    description: "The customer's phone number, e.g. +1234567890",
                },
            },
            required: ["phone"],
        },
    },
    {
        type: "function",
        name: "reschedule_booking",
        description: "Reschedule a booking to a new date and time.",
        parameters: {
            type: "object",
            properties: {
                booking_id: {
                    type: "string",
                    description: "The booking ID to reschedule",
                },
                new_date_time: {
                    type: "string",
                    description: "The new appointment date and time in ISO 8601 format, e.g. 2026-03-15T14:00:00Z",
                },
            },
            required: ["booking_id", "new_date_time"],
        },
    },
    {
        type: "function",
        name: "cancel_booking",
        description: "Cancel a booking.",
        parameters: {
            type: "object",
            properties: {
                booking_id: {
                    type: "string",
                    description: "The booking ID to cancel",
                },
            },
            required: ["booking_id"],
        },
    },
    {
        type: "function",
        name: "search_knowledge",
        description: "Search the company knowledge base for information about services, policies, pricing, hours, FAQs, or anything company-specific. Use this when the caller asks a question that might be answered by company documentation.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "The search query based on what the caller is asking about",
                },
            },
            required: ["query"],
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
        case "check_booking_status": {
            if (!userId) {
                return JSON.stringify({
                    found: false,
                    message: "Unable to check bookings — no user context available. Please offer to connect the caller with a human agent.",
                });
            }
            const customer = await prisma_1.default.customer.findFirst({
                where: { phone: args.phone, userId },
                include: {
                    bookings: {
                        orderBy: { appointmentTime: "desc" },
                        take: 3,
                    },
                },
            });
            if (!customer) {
                return JSON.stringify({
                    found: false,
                    message: "No customer found with that phone number.",
                });
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
        case "reschedule_booking": {
            if (!userId) {
                return JSON.stringify({
                    success: false,
                    error: "Unable to reschedule — no user context available. Please offer to connect the caller with a human agent.",
                });
            }
            try {
                const result = await prisma_1.default.booking.updateMany({
                    where: { id: args.booking_id, userId },
                    data: {
                        appointmentTime: new Date(args.new_date_time),
                        status: "RESCHEDULED",
                    },
                });
                if (result.count === 0) {
                    return JSON.stringify({
                        success: false,
                        error: "Booking not found or update failed.",
                    });
                }
                return JSON.stringify({ success: true, new_time: args.new_date_time });
            }
            catch (e) {
                return JSON.stringify({
                    success: false,
                    error: "Booking not found or update failed.",
                });
            }
        }
        case "cancel_booking": {
            if (!userId) {
                return JSON.stringify({
                    success: false,
                    error: "Unable to cancel — no user context available. Please offer to connect the caller with a human agent.",
                });
            }
            try {
                const result = await prisma_1.default.booking.updateMany({
                    where: { id: args.booking_id, userId },
                    data: { status: "CANCELLED" },
                });
                if (result.count === 0) {
                    return JSON.stringify({
                        success: false,
                        error: "Booking not found or cancellation failed.",
                    });
                }
                return JSON.stringify({ success: true });
            }
            catch (e) {
                return JSON.stringify({
                    success: false,
                    error: "Booking not found or cancellation failed.",
                });
            }
        }
        case "search_knowledge": {
            if (!userId) {
                return JSON.stringify({
                    found: false,
                    message: "Unable to search knowledge base — no user context available. Please offer to connect the caller with a human agent.",
                });
            }
            try {
                const results = await (0, rag_service_1.searchKnowledge)(userId, args.query, 3);
                if (results.length === 0) {
                    return JSON.stringify({
                        found: false,
                        message: "No relevant information found in the knowledge base. Suggest transferring to a human agent who might be able to help.",
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
                console.error("[RAG] Search failed during call:", error);
                return JSON.stringify({
                    found: false,
                    message: "Knowledge base search encountered an error. Offer to connect the caller with a human agent.",
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
            orderBy: { createdAt: "desc" },
            select: { userId: true },
        });
        if (customer?.userId) {
            console.log(`[RAG] Resolved userId ${customer.userId} from caller phone ${callerPhone}`);
            return customer.userId;
        }
    }
    console.warn("[RAG] Could not resolve userId for this call — RAG search will be disabled");
    return undefined;
}
// ─── OpenAI Realtime Session Handler ───────────────────────────────
function connectToOpenAI(apiKey, retryCount = 0) {
    if (!apiKey || apiKey === "your_openai_api_key") {
        console.error("[OpenAI] Cannot connect: user OpenAI key is missing");
        return null;
    }
    try {
        return new ws_1.default("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17", {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "OpenAI-Beta": "realtime=v1",
            },
        });
    }
    catch (error) {
        console.error(`[OpenAI] Connection attempt ${retryCount + 1} failed:`, error);
        return null;
    }
}
function handleMediaStream(twilioWs, callSid) {
    console.log(`[MediaStream] New connection established${callSid ? ` for call ${callSid}` : ""}`);
    let openaiWs = null;
    let streamSid = null;
    let callMetadata = {};
    const transcriptParts = [];
    const pendingAudioFrames = [];
    let isCleanedUp = false;
    // Resolved user ID for RAG search — will be set once we know the caller
    let resolvedUserId = undefined;
    // Promise that resolves once the OpenAI WebSocket is fully open
    let resolveOpenAIWsOpen;
    const openaiWsOpenReady = new Promise((resolve) => {
        resolveOpenAIWsOpen = resolve;
    });
    // Graceful cleanup to prevent double-close
    function cleanup() {
        if (isCleanedUp)
            return;
        isCleanedUp = true;
        if (openaiWs && openaiWs.readyState === ws_1.default.OPEN)
            openaiWs.close();
        saveTranscript(callSid, transcriptParts.join("\n"));
    }
    // Helper: only send if the OpenAI socket is still open
    function safeSend(payload) {
        if (openaiWs && openaiWs.readyState === ws_1.default.OPEN) {
            openaiWs.send(payload);
        }
    }
    function attachOpenAIHandlers(ws) {
        ws.on("open", () => {
            console.log("[OpenAI] Connected to Realtime API");
            resolveOpenAIWsOpen();
        });
        ws.on("message", (data) => {
            try {
                const event = JSON.parse(data.toString());
                switch (event.type) {
                    // AI is sending audio back — forward it to Twilio
                    case "response.audio.delta":
                        if (event.delta && streamSid) {
                            const audioDelta = {
                                event: "media",
                                streamSid,
                                media: { payload: event.delta },
                            };
                            twilioWs.send(JSON.stringify(audioDelta));
                        }
                        break;
                    // AI has finished a full response turn
                    case "response.done":
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
                    case "conversation.item.input_audio_transcription.completed":
                        if (event.transcript) {
                            transcriptParts.push(`Caller: ${event.transcript}`);
                        }
                        break;
                    // AI wants to call a tool
                    case "response.function_call_arguments.done": {
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
                                type: "conversation.item.create",
                                item: {
                                    type: "function_call_output",
                                    call_id: toolCallId,
                                    output: result,
                                },
                            };
                            ws.send(JSON.stringify(toolResponse));
                            // If this is a knowledge search, inject the context explicitly to guide the response.
                            if (toolName === "search_knowledge") {
                                try {
                                    const parsed = JSON.parse(result);
                                    if (parsed?.found && parsed?.answer_context) {
                                        const contextMessage = {
                                            type: "conversation.item.create",
                                            item: {
                                                type: "message",
                                                role: "user",
                                                content: [
                                                    {
                                                        type: "input_text",
                                                        text: "Use the following knowledge base context to answer the caller. " +
                                                            "Do not read it verbatim; summarize clearly and cite the source file if possible.\n\n" +
                                                            parsed.answer_context,
                                                    },
                                                ],
                                            },
                                        };
                                        ws.send(JSON.stringify(contextMessage));
                                    }
                                }
                                catch {
                                    // If parsing fails, fall back to normal response flow.
                                }
                            }
                            // Tell OpenAI to generate a response using the tool result
                            ws.send(JSON.stringify({ type: "response.create" }));
                        });
                        break;
                    }
                    case "error":
                        console.error("[OpenAI] Error:", event.error);
                        break;
                    default:
                        // Log other events at debug level
                        if (process.env.NODE_ENV === "development") {
                            console.log(`[OpenAI] Event: ${event.type}`);
                        }
                        break;
                }
            }
            catch (error) {
                console.error("[OpenAI] Error parsing message:", error);
            }
        });
        ws.on("close", () => {
            console.log("[OpenAI] Connection closed");
        });
        ws.on("error", (error) => {
            console.error("[OpenAI] WebSocket error:", error);
        });
    }
    // ── Twilio WebSocket Events ──────────────────────────────────
    twilioWs.on("message", (message) => {
        try {
            const data = JSON.parse(message.toString());
            switch (data.event) {
                case "connected":
                    console.log("[Twilio] Media stream connected");
                    break;
                case "start":
                    streamSid = data.start.streamSid;
                    callMetadata = {
                        from: data.start.customParameters?.from,
                        to: data.start.customParameters?.to,
                    };
                    // Capture callSid if it wasn't passed in the URL
                    if (!callSid && data.start.customParameters?.callSid) {
                        callSid = data.start.customParameters.callSid;
                    }
                    console.log(`[Twilio] Stream started: ${streamSid}${callSid ? ` (Call SID: ${callSid})` : ""}`);
                    // Resolve userId for RAG search (async, non-blocking)
                    resolveUserId(callSid, callMetadata.to, callMetadata.from)
                        .then(async (uid) => {
                        resolvedUserId = uid;
                        if (uid) {
                            console.log(`[RAG] User context ready: ${uid}`);
                        }
                        const user = uid
                            ? await prisma_1.default.user.findUnique({
                                where: { id: uid },
                                select: {
                                    openaiApiKey: true,
                                    agentVoice: true,
                                    agentPrompt: true,
                                },
                            })
                            : null;
                        const apiKey = (0, secret_crypto_1.decryptSecret)(user?.openaiApiKey);
                        if (!apiKey) {
                            console.error("[OpenAI] No user API key; closing call");
                            twilioWs.close();
                            return;
                        }
                        openaiWs = connectToOpenAI(apiKey);
                        if (!openaiWs) {
                            twilioWs.close();
                            return;
                        }
                        attachOpenAIHandlers(openaiWs);
                        // Wait for OpenAI socket to be actually open
                        await openaiWsOpenReady;
                        if (isCleanedUp)
                            return;
                        const sessionUpdate = {
                            type: "session.update",
                            session: {
                                turn_detection: { type: "server_vad" },
                                input_audio_format: "g711_ulaw",
                                output_audio_format: "g711_ulaw",
                                voice: user?.agentVoice || VOICE,
                                instructions: user?.agentPrompt || SYSTEM_MESSAGE,
                                modalities: ["text", "audio"],
                                temperature: 0.8,
                                tools: TOOLS,
                                input_audio_transcription: { model: "whisper-1" },
                            },
                        };
                        safeSend(JSON.stringify(sessionUpdate));
                        while (pendingAudioFrames.length > 0) {
                            const audio = pendingAudioFrames.shift();
                            if (!audio)
                                continue;
                            safeSend(JSON.stringify({
                                type: "input_audio_buffer.append",
                                audio,
                            }));
                        }
                        // Now send initial greeting
                        const initialEvent = {
                            type: "conversation.item.create",
                            item: {
                                type: "message",
                                role: "user",
                                content: [
                                    {
                                        type: "input_text",
                                        text: "Greet the caller warmly and ask how you can help them today. Keep it brief.",
                                    },
                                ],
                            },
                        };
                        safeSend(JSON.stringify(initialEvent));
                        safeSend(JSON.stringify({ type: "response.create" }));
                    })
                        .catch((err) => {
                        console.error("[RAG] Failed to resolve userId:", err);
                    });
                    break;
                case "media":
                    // Forward audio from Twilio → OpenAI (only after connection is ready)
                    if (openaiWs && openaiWs.readyState === ws_1.default.OPEN) {
                        const audioAppend = {
                            type: "input_audio_buffer.append",
                            audio: data.media.payload, // base64 µ-law audio
                        };
                        openaiWs.send(JSON.stringify(audioAppend));
                    }
                    else if (data.media?.payload && pendingAudioFrames.length < 200) {
                        pendingAudioFrames.push(data.media.payload);
                    }
                    break;
                case "stop":
                    console.log("[Twilio] Media stream stopped");
                    cleanup();
                    break;
                default:
                    break;
            }
        }
        catch (error) {
            console.error("[Twilio] Error parsing message:", error);
        }
    });
    twilioWs.on("close", () => {
        console.log("[MediaStream] Twilio connection closed");
        cleanup();
    });
    twilioWs.on("error", (error) => {
        console.error("[MediaStream] Twilio WebSocket error:", error);
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
            select: { userId: true },
        });
        if (callLog) {
            await prisma_1.default.callLog.update({
                where: { sid: callSid },
                data: { transcript },
            });
            await (0, background_job_handlers_1.enqueuePostCallAnalysisJob)(callLog.userId, callSid);
            console.log(`[Transcript] Saved and queued post-call analysis for ${callSid}`);
        }
        else {
            console.warn(`[Transcript] No CallLog found for SID ${callSid}`);
        }
    }
    catch (error) {
        console.error("[Transcript] Error saving:", error);
    }
}
