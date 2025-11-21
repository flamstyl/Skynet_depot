/**
 * 🔥 PhoenixTerm MCP Tool: kill_session
 * Termine une session terminal
 */

export const killSession = {
  name: 'kill_session',
  description: 'Terminate a terminal session and clean up resources',

  inputSchema: {
    type: 'object',
    properties: {
      session_id: {
        type: 'string',
        description: 'Session ID to terminate',
      },
      signal: {
        type: 'string',
        description: 'Signal to send to the process (SIGTERM, SIGKILL, etc.)',
        default: 'SIGTERM',
      },
      save_state: {
        type: 'boolean',
        description: 'Save session state before termination',
        default: true,
      },
    },
    required: ['session_id'],
  },

  async execute(params, context) {
    const {
      session_id,
      signal = 'SIGTERM',
      save_state = true,
    } = params;

    const { sessionManager, ptyManager, streamingHandler } = context;

    try {
      // Vérifier que la session existe
      const session = sessionManager.getSession(session_id);
      if (!session) {
        return {
          success: false,
          error: `Session ${session_id} not found`,
          available_sessions: sessionManager.listActiveSessions().map(s => s.id),
        };
      }

      // Sauvegarder l'état si demandé
      if (save_state) {
        await sessionManager.persistSession(session_id);
        console.error(`[KillSession] Saved state for session ${session_id}`);
      }

      // Tuer le PTY
      const ptyKilled = ptyManager.kill(session_id, signal);

      // Détruire le stream
      const streamDestroyed = streamingHandler.destroyStream(session_id);

      // Détruire la session
      const sessionDestroyed = await sessionManager.destroySession(session_id);

      return {
        success: true,
        message: `Session ${session_id} terminated successfully`,
        session_id,
        pty_killed: ptyKilled,
        stream_destroyed: streamDestroyed,
        session_destroyed: sessionDestroyed,
        state_saved: save_state,
        timestamp: Date.now(),
      };

    } catch (error) {
      console.error('[KillSession] Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export default killSession;
