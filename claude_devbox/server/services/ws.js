/**
 * WebSocket Service
 * Real-time communication for logs, execution events, and terminal
 */

import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger.js';

let wss = null;
let services = null;

export function initWebSocket(server, appServices) {
    services = appServices;

    wss = new WebSocketServer({
        server,
        path: '/ws'
    });

    wss.on('connection', (ws) => {
        const clientId = uuidv4();
        logger.info(`WebSocket client connected: ${clientId}`);

        ws.clientId = clientId;
        ws.isAlive = true;

        // Send welcome message
        sendToClient(ws, 'connected', {
            clientId,
            message: 'Connected to Claude DevBox'
        });

        // Handle incoming messages
        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                await handleMessage(ws, message);
            } catch (error) {
                logger.error('WebSocket message error:', error);
                sendToClient(ws, 'error', {
                    message: error.message
                });
            }
        });

        // Handle pong
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        // Handle close
        ws.on('close', () => {
            logger.info(`WebSocket client disconnected: ${clientId}`);
        });

        // Handle errors
        ws.on('error', (error) => {
            logger.error(`WebSocket error for client ${clientId}:`, error);
        });
    });

    // Heartbeat to detect dead connections
    const heartbeat = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                logger.info(`Terminating dead connection: ${ws.clientId}`);
                return ws.terminate();
            }

            ws.isAlive = false;
            ws.ping();
        });
    }, 30000); // Every 30 seconds

    wss.on('close', () => {
        clearInterval(heartbeat);
    });

    logger.info('✓ WebSocket server initialized');

    return wss;
}

async function handleMessage(ws, message) {
    const { event, data } = message;

    logger.info(`WebSocket event: ${event} from ${ws.clientId}`);

    switch (event) {
        case 'execute':
            await handleExecute(ws, data);
            break;

        case 'terminal':
            await handleTerminal(ws, data);
            break;

        case 'subscribe':
            handleSubscribe(ws, data);
            break;

        case 'ping':
            sendToClient(ws, 'pong', { timestamp: Date.now() });
            break;

        default:
            logger.warn(`Unknown WebSocket event: ${event}`);
            sendToClient(ws, 'error', {
                message: `Unknown event: ${event}`
            });
    }
}

async function handleExecute(ws, data) {
    const { code, language, options = {} } = data;

    try {
        logger.info(`Executing ${language} code via WebSocket...`);

        // Create a streaming execution
        const runId = uuidv4();

        // Notify start
        sendToClient(ws, 'execution_start', { runId });

        // Execute code
        const result = await services.docker.execute(code, language, options);

        // Send stdout chunks (simulate streaming)
        if (result.stdout) {
            const chunks = result.stdout.split('\n');
            for (const chunk of chunks) {
                sendToClient(ws, 'stdout', {
                    runId,
                    chunk: chunk + '\n',
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Send stderr chunks
        if (result.stderr) {
            const chunks = result.stderr.split('\n');
            for (const chunk of chunks) {
                sendToClient(ws, 'stderr', {
                    runId,
                    chunk: chunk + '\n',
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Send exit event
        sendToClient(ws, 'exit', {
            runId,
            exitCode: result.exitCode,
            duration: result.duration
        });

    } catch (error) {
        logger.error('Execution error:', error);
        sendToClient(ws, 'execution_error', {
            message: error.message
        });
    }
}

async function handleTerminal(ws, data) {
    const { input, containerId } = data;

    try {
        if (!containerId) {
            sendToClient(ws, 'terminal_error', {
                message: 'No container ID provided'
            });
            return;
        }

        // Execute command in container
        const result = await services.docker.exec(containerId, input.trim());

        // Send output back
        sendToClient(ws, 'terminal_output', {
            containerId,
            output: result.stdout || result.stderr,
            timestamp: new Date().toISOString()
        });

        // Send prompt
        sendToClient(ws, 'terminal_output', {
            containerId,
            output: '$ ',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Terminal error:', error);
        sendToClient(ws, 'terminal_error', {
            message: error.message
        });
    }
}

function handleSubscribe(ws, data) {
    const { streams = [] } = data;

    ws.subscribedStreams = streams;

    logger.info(`Client ${ws.clientId} subscribed to: ${streams.join(', ')}`);

    sendToClient(ws, 'subscribed', {
        streams
    });
}

function sendToClient(ws, event, data) {
    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ event, data }));
    }
}

export function broadcast(event, data, filter = null) {
    if (!wss) return;

    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            // Check if client is subscribed to this event
            if (client.subscribedStreams && !client.subscribedStreams.includes(event)) {
                return;
            }

            // Apply filter if provided
            if (filter && !filter(client)) {
                return;
            }

            sendToClient(client, event, data);
        }
    });
}

export function broadcastDockerLog(level, message, containerId = null) {
    broadcast('docker_log', {
        level,
        message,
        containerId,
        timestamp: new Date().toISOString()
    });
}

export function broadcastFixAttempt(attempt, totalAttempts, error, status) {
    broadcast('fix_attempt', {
        attempt,
        totalAttempts,
        error,
        status,
        timestamp: new Date().toISOString()
    });
}

export function broadcastFixSuccess(attempts, finalCode, duration) {
    broadcast('fix_success', {
        attempts,
        finalCode,
        duration,
        timestamp: new Date().toISOString()
    });
}

export function getConnectedClients() {
    if (!wss) return 0;
    return wss.clients.size;
}
