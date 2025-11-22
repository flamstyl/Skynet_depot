/**
 * Page principale de chat
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { chatApi } from '../services/api';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import { AlertCircle, Sparkles } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const ChatPage = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const {
    currentSessionId,
    currentSessionMessages,
    isAuthenticated,
    authToken,
    isStreaming,
    streamingMessage,
    ws,
    setCurrentSession,
    addMessage,
    setMessages,
    setWebSocket,
    closeWebSocket,
    setStreaming,
    setStreamingMessage,
    appendStreamingMessage,
    resetStreamingMessage,
    setLoading,
    setError,
    error,
  } = useStore();

  const [useWebSocket, setUseWebSocket] = useState(true);

  useEffect(() => {
    // Vérifier l'authentification
    if (!isAuthenticated || !authToken) {
      navigate('/settings');
      return;
    }

    // Créer une nouvelle session si nécessaire
    if (!currentSessionId) {
      const newSessionId = uuidv4();
      setCurrentSession(newSessionId);
    }

    // Nettoyer le WebSocket au démontage
    return () => {
      closeWebSocket();
    };
  }, []);

  useEffect(() => {
    // Scroller automatiquement vers le bas
    scrollToBottom();
  }, [currentSessionMessages, streamingMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message) => {
    if (!currentSessionId) return;

    // Ajouter le message utilisateur immédiatement
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);

    setError(null);

    if (useWebSocket) {
      // Mode WebSocket avec streaming
      handleWebSocketMessage(message);
    } else {
      // Mode REST simple
      handleRestMessage(message);
    }
  };

  const handleWebSocketMessage = (message) => {
    // Créer ou réutiliser la connexion WebSocket
    let socket = ws;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      socket = chatApi.createWebSocket(
        currentSessionId,
        handleWebSocketData,
        handleWebSocketError
      );
      setWebSocket(socket);
    }

    // Envoyer le message
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          message,
          temperature: 0.7,
          max_tokens: 2000,
        })
      );
      setStreaming(true);
      resetStreamingMessage();
    } else {
      // Si le WebSocket n'est pas prêt, utiliser REST en fallback
      handleRestMessage(message);
    }
  };

  const handleWebSocketData = (data) => {
    switch (data.type) {
      case 'start':
        setStreaming(true);
        resetStreamingMessage();
        break;

      case 'chunk':
        appendStreamingMessage(data.content);
        break;

      case 'end':
        // Ajouter le message complet
        const assistantMessage = {
          role: 'assistant',
          content: data.full_response || streamingMessage,
          timestamp: new Date().toISOString(),
        };
        addMessage(assistantMessage);
        setStreaming(false);
        resetStreamingMessage();
        break;

      case 'error':
        setError(data.message || 'Erreur lors de la génération de la réponse');
        setStreaming(false);
        resetStreamingMessage();
        break;
    }
  };

  const handleWebSocketError = (error) => {
    console.error('WebSocket error:', error);
    setError('Erreur de connexion WebSocket. Basculement vers le mode REST.');
    setStreaming(false);
    setUseWebSocket(false);
  };

  const handleRestMessage = async (message) => {
    setLoading(true);

    try {
      const response = await chatApi.sendMessage(currentSessionId, message);

      const assistantMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp,
      };

      addMessage(assistantMessage);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.detail || 'Erreur lors de l\'envoi du message');
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    const newSessionId = uuidv4();
    setCurrentSession(newSessionId);
    setMessages([]);
    closeWebSocket();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-73px)]">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nouvelle conversation
          </h1>
        </div>
        <button
          onClick={handleNewChat}
          className="px-4 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
        >
          Nouveau chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {currentSessionMessages.length === 0 && !isStreaming && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <Sparkles className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Comment puis-je vous aider ?
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Posez-moi n'importe quelle question ou demandez-moi d'accomplir une tâche.
                </p>
              </div>
            </div>
          )}

          {currentSessionMessages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}

          {isStreaming && streamingMessage && (
            <MessageBubble
              message={{
                role: 'assistant',
                content: streamingMessage,
                timestamp: new Date().toISOString(),
              }}
              isStreaming={true}
            />
          )}

          {error && (
            <div className="mx-4 my-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Erreur
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSend={handleSendMessage}
            isLoading={isStreaming}
            placeholder="Posez votre question... (Ctrl+Enter pour envoyer)"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
