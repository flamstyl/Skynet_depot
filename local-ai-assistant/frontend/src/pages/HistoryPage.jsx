/**
 * Page d'historique des conversations
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { configApi, chatApi } from '../services/api';
import { Clock, MessageSquare, Trash2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { clsx } from 'clsx';

const HistoryPage = () => {
  const navigate = useNavigate();
  const { sessions, setSessions, setCurrentSession, setMessages, isAuthenticated } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/settings');
      return;
    }

    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await configApi.getHistory(50, 0);
      setSessions(data.sessions);
    } catch (err) {
      console.error('Error loading history:', err);
      setError(err.response?.data?.detail || 'Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSession = async (sessionId) => {
    try {
      const sessionData = await chatApi.getSession(sessionId);
      setCurrentSession(sessionId);
      setMessages(sessionData.messages);
      navigate('/');
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Erreur lors du chargement de la session');
    }
  };

  const handleDeleteSession = async (sessionId, event) => {
    event.stopPropagation();

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      return;
    }

    try {
      await chatApi.deleteSession(sessionId);
      setSessions(sessions.filter((s) => s.session_id !== sessionId));
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Erreur lors de la suppression de la session');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-73px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Historique des conversations
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Retrouvez toutes vos conversations passées avec l'assistant.
        </p>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Liste des sessions */}
      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucune conversation
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Commencez une nouvelle conversation pour la voir apparaître ici.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            Nouvelle conversation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.session_id}
              onClick={() => handleOpenSession(session.session_id)}
              className={clsx(
                'group p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
                'rounded-lg cursor-pointer transition-all hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Titre */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                    {session.title || `Conversation ${session.session_id.slice(0, 8)}`}
                  </h3>

                  {/* Métadonnées */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{session.message_count} messages</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(new Date(session.last_activity), 'dd MMM yyyy à HH:mm', {
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {session.tags && session.tags.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {session.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDeleteSession(session.session_id, e)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
