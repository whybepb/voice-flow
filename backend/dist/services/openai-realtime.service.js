"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeSystemPrompt = composeSystemPrompt;
exports.resolveRealtimeProfile = resolveRealtimeProfile;
exports.executeToolCall = executeToolCall;
exports.handleMediaStream = handleMediaStream;
const ws_1 = __importDefault(require("ws"));
const prisma_1 = __importDefault(require("../prisma"));
const rag_service_1 = require("./rag.service");
const secret_crypto_1 = require("../utils/secret-crypto");
const background_job_handlers_1 = require("./background-job-handlers");
const DEFAULT_MODEL = "gpt-realtime-mini";
const PREMIUM_MODEL = "gpt-realtime";
const DEFAULT_VOICE = "cedar";
const PREMIUM_VOICE = "marin";
const DEFAULT_AGENT_PROMPT = "You are the business's AI phone assistant. Help callers clearly, warmly, and efficiently.";
function normalizeVoiceMode(value) {
    return value === "PREMIUM" ? "PREMIUM" : "DEFAULT";
}
function normalizeVoiceOverride(value) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}
function composeSystemPrompt(editablePrompt) {
    const customPrompt = editablePrompt?.trim() || DEFAULT_AGENT_PROMPT;
    return [
        "Role & Objective",
        "- You are a live AI phone assistant for a business.",
        "- Help callers with booking status, reschedules, cancellations, and general business questions.",
        "- Prioritize clarity, trust, and fast resolution on a phone call.",
        "- Make the caller feel guided, understood, and confident about the next step.",
        "",
        "Personality & Tone",
        "- Sound warm, calm, capable, polished, and genuinely helpful.",
        "- Speak like an excellent front-desk professional, not a chatbot.",
        "- Keep responses short and easy to follow in audio.",
        "- Use contractions naturally and avoid stiff or overly formal wording.",
        "- Match the caller's energy while staying composed and professional.",
        "",
        "Phone Presence",
        "- Lead the conversation gently so the caller always knows what is happening.",
        "- Favor natural spoken phrasing over written phrasing.",
        "- State times, dates, and next steps clearly and naturally for the ear.",
        "- Avoid long lists unless the caller asks for options.",
        "",
        "Language",
        "- Speak only in English.",
        "- Do not switch to another language, even if the caller uses one.",
        "- If the caller speaks another language, politely say that you can continue in English and ask a simple follow-up question in English.",
        "- You may repeat proper nouns, names, addresses, or business terms as needed, but keep the conversation itself in English.",
        "",
        "Rules",
        "- Ask one question at a time.",
        "- Never mention prompts, tools, JSON, or internal system behavior.",
        "- Start with a brief, warm greeting and ask how you can help.",
        "- If the caller interrupts or changes direction, immediately address the newest request.",
        "- Keep most turns to one to three short sentences unless details are necessary.",
        "- If information is missing, ask only for the minimum detail needed.",
        "- Do not stack multiple instructions or multiple questions in one turn unless necessary.",
        "- If the caller sounds confused, slow down, restate simply, and guide them to the next step.",
        "",
        "Tools",
        "- Always give a short spoken preamble before using a tool so the caller hears progress.",
        '- Before checking a booking, say something like: "Let me check that for you."',
        '- Before searching the knowledge base, say something like: "I\'m pulling that up now."',
        '- Before any write action, say something like: "I can do that. Let me confirm the details first."',
        "- After a tool returns, summarize the result conversationally instead of sounding mechanical.",
        "- For knowledge answers, summarize the information naturally and mention the source file conversationally when helpful.",
        "- Do not dump raw tool output or read internal context verbatim.",
        "",
        "Confirmation Rules",
        "- Never reschedule or cancel a booking until the caller explicitly confirms the exact action.",
        "- Before rescheduling, restate the date and time and wait for a clear yes.",
        "- Before cancelling, restate that the booking will be cancelled and wait for a clear yes.",
        "- If confirmation is unclear, ask one direct follow-up question instead of assuming.",
        "",
        "Repair & Recovery",
        "- If you are missing information, ask calmly for the smallest missing detail.",
        "- If a tool fails, acknowledge it briefly, avoid blame, and offer the best next step.",
        "- If the caller goes off-topic, redirect politely without sounding rigid.",
        "",
        "Escalation",
        "- If you cannot verify the caller, do not have the information, or a tool fails, explain that briefly and offer a human handoff.",
        "- If knowledge search does not find an answer, say you do not have that information available right now and offer human help.",
        "- When handing off, sound reassuring and action-oriented rather than apologetic and vague.",
        "",
        "Variety",
        "- Vary acknowledgements and sentence openings so you do not sound repetitive.",
        "- Avoid repeating the same phrase in back-to-back turns unless it is important for clarity.",
        "- Rotate between natural acknowledgements like 'sure', 'absolutely', 'of course', 'one moment', or 'happy to help' when appropriate.",
        "- Keep the conversation sounding fresh, but never at the expense of clarity.",
        "",
        "Client Instructions",
        customPrompt,
    ].join("\n");
}
function resolveRealtimeProfile(input) {
    const voiceMode = normalizeVoiceMode(input.voiceMode);
    const model = voiceMode === "PREMIUM" ? PREMIUM_MODEL : DEFAULT_MODEL;
    const fallbackVoice = voiceMode === "PREMIUM" ? PREMIUM_VOICE : DEFAULT_VOICE;
    const voice = normalizeVoiceOverride(input.voiceOverride) ||
        normalizeVoiceOverride(input.userVoice) ||
        fallbackVoice;
    return {
        model,
        voice,
        instructions: composeSystemPrompt(input.userPrompt),
    };
}
const TOOLS = [
    {
        type: "function",
        name: "check_booking_status",
        description: "Look up a customer's booking by phone number. Use this after telling the caller you are checking. Returns booking details including date, service, and status.",
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
        description: "Reschedule a booking to a new ISO 8601 date and time. Only call this after the caller explicitly confirms the exact new time.",
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
                confirmed: {
                    type: "boolean",
                    description: "Set to true only after the caller explicitly confirms the exact new appointment time.",
                },
            },
            required: ["booking_id", "new_date_time", "confirmed"],
        },
    },
    {
        type: "function",
        name: "cancel_booking",
        description: "Cancel a booking. Only call this after the caller explicitly confirms that they want to cancel it.",
        parameters: {
            type: "object",
            properties: {
                booking_id: {
                    type: "string",
                    description: "The booking ID to cancel",
                },
                confirmed: {
                    type: "boolean",
                    description: "Set to true only after the caller explicitly confirms they want to cancel the booking.",
                },
            },
            required: ["booking_id", "confirmed"],
        },
    },
    {
        type: "function",
        name: "search_knowledge",
        description: "Search the company knowledge base for services, policies, pricing, hours, FAQs, or other company-specific questions. Use this after telling the caller you are pulling it up.",
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
function buildToolFollowupInstruction(toolName) {
    switch (toolName) {
        case "check_booking_status":
            return "Use a brief progress preamble, then explain the booking result clearly in natural phone language. If there are multiple bookings, guide the caller through the most relevant one first.";
        case "search_knowledge":
            return "Use a brief progress preamble, then answer in a polished, conversational way. Summarize the result instead of reading the raw context, and mention the source naturally when it helps build trust.";
        case "reschedule_booking":
        case "cancel_booking":
            return "If the action succeeded, confirm it clearly, restate the important detail, and offer the next helpful step. If it failed because confirmation was missing or another issue occurred, explain that simply and guide the caller on what to confirm next.";
        default:
            return null;
    }
}
async function executeToolCall(toolName, args, userId) {
    console.log(`[Tool Call] ${toolName}`, args);
    switch (toolName) {
        case "check_booking_status": {
            if (!userId) {
                return JSON.stringify({
                    found: false,
                    message: "Unable to check bookings because no account context is available. Offer a human handoff.",
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
                bookings: customer.bookings.map((booking) => ({
                    id: booking.id,
                    service: booking.service,
                    appointment_time: booking.appointmentTime.toISOString(),
                    status: booking.status,
                })),
            });
        }
        case "reschedule_booking": {
            if (!userId) {
                return JSON.stringify({
                    success: false,
                    error: "Unable to reschedule because no account context is available. Offer a human handoff.",
                });
            }
            if (!args.confirmed) {
                return JSON.stringify({
                    success: false,
                    confirmation_required: true,
                    error: "The caller has not explicitly confirmed the new appointment time yet.",
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
                return JSON.stringify({
                    success: true,
                    new_time: args.new_date_time,
                });
            }
            catch {
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
                    error: "Unable to cancel because no account context is available. Offer a human handoff.",
                });
            }
            if (!args.confirmed) {
                return JSON.stringify({
                    success: false,
                    confirmation_required: true,
                    error: "The caller has not explicitly confirmed the cancellation yet.",
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
            catch {
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
                    message: "Unable to search the knowledge base because no account context is available. Offer a human handoff.",
                });
            }
            try {
                const results = await (0, rag_service_1.searchKnowledge)(userId, args.query, 3);
                if (results.length === 0) {
                    return JSON.stringify({
                        found: false,
                        message: "No relevant information was found in the knowledge base. Offer a human handoff.",
                    });
                }
                const ragContext = (0, rag_service_1.buildRAGPrompt)(args.query, results);
                return JSON.stringify({
                    found: true,
                    answer_context: ragContext.prompt,
                    sources: ragContext.sources.map((source) => ({
                        file: source.fileName,
                        chunk: source.chunkIndex + 1,
                        relevance: `${(source.similarity * 100).toFixed(1)}%`,
                    })),
                });
            }
            catch (error) {
                console.error("[RAG] Search failed during call:", error);
                return JSON.stringify({
                    found: false,
                    message: "Knowledge base search failed. Offer a human handoff.",
                });
            }
        }
        default:
            return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
}
async function resolveCallContext(callSid, calledPhone, callerPhone) {
    if (callSid) {
        const callLog = await prisma_1.default.callLog.findUnique({
            where: { sid: callSid },
            select: {
                userId: true,
                user: {
                    select: {
                        openaiApiKey: true,
                        agentVoice: true,
                        agentPrompt: true,
                    },
                },
                booking: {
                    select: {
                        campaign: {
                            select: {
                                voiceMode: true,
                                agentVoiceOverride: true,
                            },
                        },
                    },
                },
            },
        });
        if (callLog?.userId) {
            console.log(`[RAG] Resolved userId ${callLog.userId} from callSid ${callSid}`);
            return {
                userId: callLog.userId,
                openaiApiKey: callLog.user.openaiApiKey,
                userPrompt: callLog.user.agentPrompt,
                userVoice: callLog.user.agentVoice,
                voiceMode: normalizeVoiceMode(callLog.booking?.campaign?.voiceMode),
                voiceOverride: callLog.booking?.campaign?.agentVoiceOverride,
            };
        }
    }
    if (calledPhone) {
        const user = await prisma_1.default.user.findFirst({
            where: { twilioPhoneNumber: calledPhone },
            select: {
                id: true,
                openaiApiKey: true,
                agentVoice: true,
                agentPrompt: true,
            },
        });
        if (user?.id) {
            console.log(`[RAG] Resolved userId ${user.id} from called phone ${calledPhone}`);
            return {
                userId: user.id,
                openaiApiKey: user.openaiApiKey,
                userPrompt: user.agentPrompt,
                userVoice: user.agentVoice,
                voiceMode: "DEFAULT",
            };
        }
    }
    if (callerPhone) {
        const customer = await prisma_1.default.customer.findFirst({
            where: { phone: callerPhone },
            orderBy: { createdAt: "desc" },
            select: {
                userId: true,
                user: {
                    select: {
                        openaiApiKey: true,
                        agentVoice: true,
                        agentPrompt: true,
                    },
                },
            },
        });
        if (customer?.userId) {
            console.log(`[RAG] Resolved userId ${customer.userId} from caller phone ${callerPhone}`);
            return {
                userId: customer.userId,
                openaiApiKey: customer.user.openaiApiKey,
                userPrompt: customer.user.agentPrompt,
                userVoice: customer.user.agentVoice,
                voiceMode: "DEFAULT",
            };
        }
    }
    console.warn("[RAG] Could not resolve account context for this call. Realtime tools will be limited.");
    return {
        voiceMode: "DEFAULT",
    };
}
function connectToOpenAI(apiKey, model) {
    if (!apiKey || apiKey === "your_openai_api_key") {
        console.error("[OpenAI] Cannot connect: user OpenAI key is missing");
        return null;
    }
    try {
        return new ws_1.default(`wss://api.openai.com/v1/realtime?model=${model}`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "OpenAI-Beta": "realtime=v1",
            },
        });
    }
    catch (error) {
        console.error("[OpenAI] Connection attempt failed:", error);
        return null;
    }
}
function handleMediaStream(twilioWs, callSid) {
    console.log(`[MediaStream] New connection established${callSid ? ` for call ${callSid}` : ""}`);
    let openaiWs = null;
    let streamSid = null;
    let callMetadata = {};
    let resolvedContext = { voiceMode: "DEFAULT" };
    const transcriptParts = [];
    const pendingAudioFrames = [];
    let isCleanedUp = false;
    let resolveOpenAIWsOpen;
    let rejectOpenAIWsOpen;
    let openaiWsIsReady = false;
    const openaiWsOpenReady = new Promise((resolve, reject) => {
        resolveOpenAIWsOpen = resolve;
        rejectOpenAIWsOpen = reject;
    });
    function cleanup() {
        if (isCleanedUp)
            return;
        isCleanedUp = true;
        if (openaiWs && openaiWs.readyState === ws_1.default.OPEN) {
            openaiWs.close();
        }
        saveTranscript(callSid, transcriptParts.join("\n"));
    }
    function safeSend(payload) {
        if (openaiWs && openaiWs.readyState === ws_1.default.OPEN) {
            openaiWs.send(payload);
        }
    }
    function attachOpenAIHandlers(ws) {
        ws.on("open", () => {
            console.log("[OpenAI] Connected to Realtime API");
            openaiWsIsReady = true;
            resolveOpenAIWsOpen?.();
        });
        ws.on("message", (data) => {
            try {
                const event = JSON.parse(data.toString());
                switch (event.type) {
                    case "response.audio.delta":
                    case "response.output_audio.delta":
                        if (event.delta && streamSid) {
                            twilioWs.send(JSON.stringify({
                                event: "media",
                                streamSid,
                                media: { payload: event.delta },
                            }));
                        }
                        break;
                    case "response.done":
                        if (event.response?.output) {
                            for (const output of event.response.output) {
                                if (!output.content)
                                    continue;
                                for (const content of output.content) {
                                    if (content.transcript) {
                                        transcriptParts.push(`Assistant: ${content.transcript}`);
                                    }
                                    else if (content.text) {
                                        transcriptParts.push(`Assistant: ${content.text}`);
                                    }
                                }
                            }
                        }
                        break;
                    case "conversation.item.input_audio_transcription.completed":
                        if (event.transcript) {
                            transcriptParts.push(`Caller: ${event.transcript}`);
                        }
                        break;
                    case "response.function_call_arguments.done": {
                        const toolName = event.name;
                        const toolCallId = event.call_id;
                        let toolArgs = {};
                        try {
                            toolArgs = JSON.parse(event.arguments);
                        }
                        catch {
                            toolArgs = {};
                        }
                        executeToolCall(toolName, toolArgs, resolvedContext.userId)
                            .then((result) => {
                            safeSend(JSON.stringify({
                                type: "conversation.item.create",
                                item: {
                                    type: "function_call_output",
                                    call_id: toolCallId,
                                    output: result,
                                },
                            }));
                            if (toolName === "search_knowledge") {
                                try {
                                    const parsed = JSON.parse(result);
                                    if (parsed?.found && parsed?.answer_context) {
                                        const sourceFiles = Array.isArray(parsed.sources)
                                            ? parsed.sources
                                                .map((source) => source.file)
                                                .filter(Boolean)
                                                .join(", ")
                                            : "";
                                        safeSend(JSON.stringify({
                                            type: "conversation.item.create",
                                            item: {
                                                type: "message",
                                                role: "user",
                                                content: [
                                                    {
                                                        type: "input_text",
                                                        text: "Use the following knowledge base context to answer the caller. " +
                                                            "Summarize it naturally instead of reading it verbatim." +
                                                            (sourceFiles
                                                                ? ` Mention these source files conversationally when helpful: ${sourceFiles}.`
                                                                : "") +
                                                            `\n\n${parsed.answer_context}`,
                                                    },
                                                ],
                                            },
                                        }));
                                    }
                                }
                                catch {
                                    // Fall back to the normal response path if the result is not JSON.
                                }
                            }
                            const followupInstruction = buildToolFollowupInstruction(toolName);
                            if (followupInstruction) {
                                safeSend(JSON.stringify({
                                    type: "conversation.item.create",
                                    item: {
                                        type: "message",
                                        role: "user",
                                        content: [
                                            {
                                                type: "input_text",
                                                text: followupInstruction,
                                            },
                                        ],
                                    },
                                }));
                            }
                            safeSend(JSON.stringify({ type: "response.create" }));
                        })
                            .catch((error) => {
                            console.error("[Tool Call] Execution failed:", error);
                        });
                        break;
                    }
                    case "error":
                        console.error("[OpenAI] Error:", event.error);
                        break;
                    default:
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
            if (!openaiWsIsReady) {
                rejectOpenAIWsOpen?.(new Error("OpenAI connection closed before opening"));
            }
        });
        ws.on("error", (error) => {
            console.error("[OpenAI] WebSocket error:", error);
            if (!openaiWsIsReady) {
                rejectOpenAIWsOpen?.(error instanceof Error ? error : new Error("OpenAI websocket error"));
            }
        });
    }
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
                    if (!callSid && data.start.customParameters?.callSid) {
                        callSid = data.start.customParameters.callSid;
                    }
                    console.log(`[Twilio] Stream started: ${streamSid}${callSid ? ` (Call SID: ${callSid})` : ""}`);
                    resolveCallContext(callSid, callMetadata.to, callMetadata.from)
                        .then(async (context) => {
                        resolvedContext = context;
                        if (context.userId) {
                            console.log(`[RAG] User context ready: ${context.userId}`);
                        }
                        const realtimeProfile = resolveRealtimeProfile(context);
                        const apiKey = (0, secret_crypto_1.decryptSecret)(context.openaiApiKey);
                        if (!apiKey) {
                            console.error("[OpenAI] No user API key; closing call");
                            twilioWs.close();
                            return;
                        }
                        openaiWs = connectToOpenAI(apiKey, realtimeProfile.model);
                        if (!openaiWs) {
                            twilioWs.close();
                            return;
                        }
                        attachOpenAIHandlers(openaiWs);
                        await openaiWsOpenReady;
                        if (isCleanedUp)
                            return;
                        safeSend(JSON.stringify({
                            type: "session.update",
                            session: {
                                instructions: realtimeProfile.instructions,
                                modalities: ["audio", "text"],
                                turn_detection: {
                                    type: "semantic_vad",
                                    eagerness: "medium",
                                    create_response: true,
                                    interrupt_response: true,
                                },
                                input_audio_format: "g711_ulaw",
                                output_audio_format: "g711_ulaw",
                                voice: realtimeProfile.voice,
                                tools: TOOLS,
                                input_audio_transcription: { model: "whisper-1" },
                            },
                        }));
                        while (pendingAudioFrames.length > 0) {
                            const audio = pendingAudioFrames.shift();
                            if (!audio)
                                continue;
                            safeSend(JSON.stringify({
                                type: "input_audio_buffer.append",
                                audio,
                            }));
                        }
                        safeSend(JSON.stringify({
                            type: "conversation.item.create",
                            item: {
                                type: "message",
                                role: "user",
                                content: [
                                    {
                                        type: "input_text",
                                        text: "Give a warm, polished phone greeting in English. Introduce yourself as the business assistant, sound natural and welcoming, and ask how you can help in one brief sentence.",
                                    },
                                ],
                            },
                        }));
                        safeSend(JSON.stringify({ type: "response.create" }));
                    })
                        .catch((error) => {
                        console.error("[RAG] Failed to resolve call context:", error);
                        twilioWs.close();
                    });
                    break;
                case "media":
                    if (openaiWs && openaiWs.readyState === ws_1.default.OPEN) {
                        openaiWs.send(JSON.stringify({
                            type: "input_audio_buffer.append",
                            audio: data.media.payload,
                        }));
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
