/**
 * Composant de saisie de message pour le chat
 */

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

const ChatInput = ({ onSend, isLoading = false, placeholder = 'Posez votre question...' }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!message.trim() || isLoading) return;

    onSend(message);
    setMessage('');
  };

  const handleKeyDown = (e) => {
    // Envoyer avec Ctrl+Enter ou Cmd+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      {/* Zone de texte */}
      <div className="flex-1 relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className={clsx(
            'w-full px-4 py-3 pr-12 rounded-lg border resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'bg-white dark:bg-gray-800',
            'border-gray-300 dark:border-gray-600',
            'text-gray-900 dark:text-white',
            'placeholder-gray-500 dark:placeholder-gray-400',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200'
          )}
          style={{
            minHeight: '48px',
            maxHeight: '200px',
            height: 'auto',
          }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
        />

        {/* Bouton d'envoi (intégré) */}
        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className={clsx(
            'absolute right-2 bottom-2 p-2 rounded-lg',
            'transition-all duration-200',
            message.trim() && !isLoading
              ? 'bg-primary-600 hover:bg-primary-700 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Indication */}
      <div className="text-xs text-gray-500 dark:text-gray-400 pb-3">
        Ctrl+Enter pour envoyer
      </div>
    </form>
  );
};

export default ChatInput;
