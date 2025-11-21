/**
 * 🔥 PhoenixTerm MCP Tool: list_sessions
 * Liste toutes les sessions actives
 */

export const listSessions = {
  name: 'list_sessions',
  description: 'List all active terminal sessions with their status and statistics',

  inputSchema: {
    type: 'object',
    properties: {
      detailed: {
        type: 'boolean',
        description: 'Include detailed information for each session',
        default: false,
      },
    },
  },

  async execute(params, context) {
    const { detailed = false } = params;
    const { sessionManager, ptyManager, streamingHandler } = context;

    try {
      const sessions = sessionManager.listActiveSessions();

      const result = sessions.map(session => {
        const basicInfo = {
          id: session.id,
          created: session.created,
          lastActivity: session.lastActivity,
          uptime: session.uptime,
          inactive: Date.now() - session.lastActivity,
          commandCount: session.commandCount,
          cwd: session.cwd,
          status: session.status,
        };

        if (!detailed) {
          return basicInfo;
        }

        // Infos détaillées
        const ptyStats = ptyManager.getStats(session.id);
        const streamStats = streamingHandler.getStats(session.id);
        const fullState = sessionManager.getSessionState(session.id);

        return {
          ...basicInfo,
          pty: ptyStats ? {
            pid: ptyStats.pid,
            shell: ptyStats.shell,
            bufferSize: ptyStats.bufferSize,
          } : null,
          streaming: streamStats ? {
            totalBytes: streamStats.totalBytes,
            linesReceived: streamStats.stats.linesReceived,
          } : null,
          recentCommands: fullState.recentCommands?.slice(-5) || [],
          variables: fullState.variables || {},
        };
      });

      return {
        success: true,
        sessions: result,
        count: result.length,
        timestamp: Date.now(),
      };

    } catch (error) {
      console.error('[ListSessions] Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export default listSessions;
