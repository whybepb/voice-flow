import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { parse } from 'url';
import app from './app';
import { handleMediaStream } from './services/openai-realtime.service';

const PORT = process.env.PORT || 5001;

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Create a WebSocket server attached to the HTTP server (no automatic handling)
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket upgrade requests
server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '');

    if (pathname === '/media-stream') {
        wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
            console.log('[Server] WebSocket client connected to /media-stream');

            // Extract callSid from query params if available
            const urlParams = new URLSearchParams(request.url?.split('?')[1] || '');
            const callSid = urlParams.get('callSid') || undefined;

            // Hand off to the OpenAI Realtime media stream handler
            handleMediaStream(ws, callSid);
        });
    } else {
        socket.destroy();
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`WebSocket endpoint ready at ws://localhost:${PORT}/media-stream`);
});
