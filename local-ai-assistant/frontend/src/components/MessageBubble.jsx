/**
 * Composant d'affichage d'un message de chat
 * Supporte le markdown pour les réponses de l'IA
 */

import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MessageBubble = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user';
  const timestamp = message.timestamp ? new Date(message.timestamp) : new Date();

  return (
    <div
      className={clsx(
        'flex gap-3 p-4',
        isUser ? 'bg-transparent' : 'bg-gray-50 dark:bg-gray-800/50'
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-primary-600 text-white'
            : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
        )}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900 dark:text-white">
            {isUser ? 'Vous' : 'Assistant IA'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {format(timestamp, 'HH:mm', { locale: fr })}
          </span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-xs text-primary-600">
              <span className="animate-pulse">●</span>
              En cours...
            </span>
          )}
        </div>

        {/* Message */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {isUser ? (
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <ReactMarkdown
              className="text-gray-700 dark:text-gray-300"
              components={{
                // Personnaliser le rendu des éléments markdown
                code: ({ node, inline, className, children, ...props }) => {
                  return inline ? (
                    <code
                      className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code
                      className="block bg-gray-200 dark:bg-gray-700 p-2 rounded text-sm overflow-x-auto"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
