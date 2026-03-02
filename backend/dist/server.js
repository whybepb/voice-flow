"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const url_1 = require("url");
const app_1 = __importDefault(require("./app"));
const openai_realtime_service_1 = require("./services/openai-realtime.service");
const background_job_service_1 = require("./services/background-job.service");
const background_job_handlers_1 = require("./services/background-job-handlers");
const secret_crypto_1 = require("./utils/secret-crypto");
const PORT = process.env.PORT || 5001;
(0, secret_crypto_1.assertSecretEncryptionConfigured)();
// Create an HTTP server from the Express app
const server = http_1.default.createServer(app_1.default);
// Create a WebSocket server attached to the HTTP server (no automatic handling)
const wss = new ws_1.WebSocketServer({ noServer: true });
// Handle WebSocket upgrade requests
server.on('upgrade', (request, socket, head) => {
    const { pathname } = (0, url_1.parse)(request.url || '');
    if (pathname === '/media-stream') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            console.log('[Server] WebSocket client connected to /media-stream');
            // Extract callSid from query params if available
            const urlParams = new URLSearchParams(request.url?.split('?')[1] || '');
            const callSid = urlParams.get('callSid') || undefined;
            // Hand off to the OpenAI Realtime media stream handler
            (0, openai_realtime_service_1.handleMediaStream)(ws, callSid);
        });
    }
    else {
        socket.destroy();
    }
});
server.listen(PORT, () => {
    (0, background_job_handlers_1.registerBackgroundJobHandlers)();
    background_job_service_1.backgroundJobService.startWorker();
    console.log(`Server is running on port ${PORT}`);
    console.log(`WebSocket endpoint ready at ws://localhost:${PORT}/media-stream`);
});
process.on('SIGTERM', () => {
    background_job_service_1.backgroundJobService.stopWorker();
});
process.on('SIGINT', () => {
    background_job_service_1.backgroundJobService.stopWorker();
});
