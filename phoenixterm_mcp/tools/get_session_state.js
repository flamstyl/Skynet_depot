/**
 * 🔥 PhoenixTerm MCP Tool: get_session_state
 * Récupère l'état complet d'une session terminal
 */

export const getSessionState = {
  name: 'get_session_state',
  description: 'Get complete state of a terminal session including history, environment, and current status',

  inputSchema: {
    type: 'object',
    properties: {
      session_id: {
        type: 'string',
        description: 'Session ID to query (default: "default")',
        default: 'default',
      },
      include_history: {
        type: 'boolean',
        description: 'Include command history',
        default: true,
      },
      include_output: {
        type: 'boolean',
        description: 'Include recent output buffer',
        default: false,
      },
      history_limit: {
        type: 'number',
        description: 'Maximum number of history entries to return',
        default: 50,
      },
    },
  },

  async execute(params, context) {
    const {
      session_id = 'default',
      include_history = true,
      include_output = false,
      history_limit = 50,
    } = params;

    const { sessionManager, ptyManager, streamingHandler } = context;

    try {
      // Récupérer la session
      const session = sessionManager.getSession(session_id);
      if (!session) {
        return {
          success: false,
          error: `Session ${session_id} not found`,
          available_sessions: sessionManager.listActiveSessions().map(s => s.id),
        };
      }

      // État de base
      const state = sessionManager.getSessionState(session_id);

      // Infos PTY
      const ptyStats = ptyManager.getStats(session_id);
      if (ptyStats) {
        state.pty = {
          pid: ptyStats.pid,
          shell: ptyStats.shell,
          uptime: ptyStats.uptime,
          lastActivity: ptyStats.lastActivity,
        };
      }

      // Historique
      if (include_history) {
        state.history = state.recentCommands || [];
        if (history_limit && state.history.length > history_limit) {
          state.history = state.history.slice(-history_limit);
        }
      } else {
        delete state.recentCommands;
      }

      // Output buffer
      if (include_output) {
        const outputBuffer = ptyManager.getOutputBuffer(session_id, { limit: 100 });
        state.output = outputBuffer.map(item => ({
          type: item.type,
          data: item.data,
          timestamp: item.timestamp,
        }));
      }

      // Streaming stats
      const streamStats = streamingHandler.getStats(session_id);
      if (streamStats) {
        state.streaming = {
          bufferSize: streamStats.bufferSize,
          totalBytes: streamStats.totalBytes,
          linesReceived: streamStats.stats.linesReceived,
        };
      }

      return {
        success: true,
        session: state,
        timestamp: Date.now(),
      };

    } catch (error) {
      console.error('[GetSessionState] Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export default getSessionState;
