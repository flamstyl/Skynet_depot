/**
 * Service Worker (Background Script) pour l'extension Chrome
 * Gère les menus contextuels, les commandes et la communication avec le backend
 */

const API_BASE_URL = 'http://127.0.0.1:3333';

// État global
let authToken = null;

// Initialisation au démarrage
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension Assistant IA installée');

  // Charger le token depuis le storage
  loadAuthToken();

  // Créer les menus contextuels
  createContextMenus();
});

// Charger le token au démarrage
chrome.runtime.onStartup.addListener(() => {
  loadAuthToken();
});

/**
 * Charge le token d'authentification depuis le storage
 */
async function loadAuthToken() {
  const result = await chrome.storage.local.get(['authToken']);
  authToken = result.authToken;

  if (!authToken) {
    console.warn('Token d\'authentification non configuré');
  }
}

/**
 * Sauvegarde le token d'authentification
 */
async function saveAuthToken(token) {
  await chrome.storage.local.set({ authToken: token });
  authToken = token;
}

/**
 * Crée les menus contextuels
 */
function createContextMenus() {
  // Résumer la page
  chrome.contextMenus.create({
    id: 'summary-page',
    title: '📝 Résumer cette page',
    contexts: ['page'],
  });

  // Résumer la sélection
  chrome.contextMenus.create({
    id: 'summary-selection',
    title: '📝 Résumer la sélection',
    contexts: ['selection'],
  });

  // Traduire la sélection
  chrome.contextMenus.create({
    id: 'translate-selection',
    title: '🌐 Traduire en français',
    contexts: ['selection'],
  });

  // Expliquer la sélection
  chrome.contextMenus.create({
    id: 'explain-selection',
    title: '💡 Expliquer la sélection',
    contexts: ['selection'],
  });

  // Reformuler la sélection
  chrome.contextMenus.create({
    id: 'reformulate-selection',
    title: '✍️ Reformuler la sélection',
    contexts: ['selection'],
  });
}

/**
 * Gestion des clics sur les menus contextuels
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('Menu contextuel cliqué:', info.menuItemId);

  switch (info.menuItemId) {
    case 'summary-page':
      await handleSummaryPage(tab);
      break;

    case 'summary-selection':
      await handleSummarySelection(info.selectionText, tab);
      break;

    case 'translate-selection':
      await handleTranslate(info.selectionText, tab);
      break;

    case 'explain-selection':
      await handleExplain(info.selectionText, tab);
      break;

    case 'reformulate-selection':
      await handleReformulate(info.selectionText, tab);
      break;
  }
});

/**
 * Gestion de la commande Ctrl+M pour ouvrir le chat
 */
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-chat') {
    // Ouvrir le dashboard dans un nouvel onglet
    chrome.tabs.create({ url: 'http://127.0.0.1:3333/app' });
  }
});

/**
 * Résume la page active
 */
async function handleSummaryPage(tab) {
  try {
    // Injecter un script pour récupérer le contenu de la page
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Extraire le texte principal de la page
        const body = document.body.innerText;
        const title = document.title;
        return { title, content: body, url: window.location.href };
      },
    });

    const pageData = results[0].result;

    // Envoyer au backend pour résumé
    const summary = await requestSummary(pageData.url, pageData.content);

    // Afficher le résumé
    await showResult(tab, 'Résumé de la page', summary, pageData.url);
  } catch (error) {
    console.error('Erreur lors du résumé de la page:', error);
    await showError(tab, 'Impossible de résumer la page');
  }
}

/**
 * Résume un texte sélectionné
 */
async function handleSummarySelection(text, tab) {
  try {
    const summary = await requestSummary(null, text);
    await showResult(tab, 'Résumé de la sélection', summary);
  } catch (error) {
    console.error('Erreur lors du résumé:', error);
    await showError(tab, 'Impossible de résumer le texte');
  }
}

/**
 * Traduit un texte sélectionné
 */
async function handleTranslate(text, tab) {
  try {
    const translation = await requestTranslation(text, 'fr');
    await showResult(tab, 'Traduction', translation);
  } catch (error) {
    console.error('Erreur lors de la traduction:', error);
    await showError(tab, 'Impossible de traduire le texte');
  }
}

/**
 * Explique un texte sélectionné
 */
async function handleExplain(text, tab) {
  try {
    const explanation = await requestExplanation(text);
    await showResult(tab, 'Explication', explanation);
  } catch (error) {
    console.error('Erreur lors de l\'explication:', error);
    await showError(tab, 'Impossible d\'expliquer le texte');
  }
}

/**
 * Reformule un texte sélectionné
 */
async function handleReformulate(text, tab) {
  try {
    const reformulated = await requestReformulation(text);
    await showResult(tab, 'Reformulation', reformulated);
  } catch (error) {
    console.error('Erreur lors de la reformulation:', error);
    await showError(tab, 'Impossible de reformuler le texte');
  }
}

/**
 * Requête de résumé au backend
 */
async function requestSummary(url, text) {
  const sessionId = await getOrCreateSession();

  const response = await fetch(`${API_BASE_URL}/api/utils/summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      url: url || null,
      text: url ? null : text,
      session_id: sessionId,
      max_length: 500,
      language: 'fr',
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.summary;
}

/**
 * Requête de traduction au backend
 */
async function requestTranslation(text, targetLang) {
  const sessionId = await getOrCreateSession();

  const response = await fetch(`${API_BASE_URL}/api/utils/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      text,
      target_language: targetLang,
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.translated_text;
}

/**
 * Requête d'explication au backend (via chat)
 */
async function requestExplanation(text) {
  const sessionId = await getOrCreateSession();

  const response = await fetch(`${API_BASE_URL}/api/chat/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      message: `Explique-moi de manière claire et concise ce texte:\n\n${text}`,
      session_id: sessionId,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.message;
}

/**
 * Requête de reformulation au backend
 */
async function requestReformulation(text) {
  const sessionId = await getOrCreateSession();

  const response = await fetch(`${API_BASE_URL}/api/utils/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      template_id: 'reformulate',
      context: { text, tone: 'professionnel' },
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.generated_content;
}

/**
 * Récupère ou crée une session
 */
async function getOrCreateSession() {
  let result = await chrome.storage.local.get(['currentSessionId']);
  let sessionId = result.currentSessionId;

  if (!sessionId) {
    sessionId = generateUUID();
    await chrome.storage.local.set({ currentSessionId: sessionId });
  }

  return sessionId;
}

/**
 * Génère un UUID simple
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Affiche le résultat dans la page
 */
async function showResult(tab, title, content, url = null) {
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (title, content, url) => {
      // Créer un conteneur pour le résultat
      const container = document.createElement('div');
      container.id = 'ai-assistant-result';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        z-index: 999999;
        font-family: system-ui, -apple-system, sans-serif;
      `;

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">${title}</h3>
          <button id="close-result" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; width: 24px; height: 24px; line-height: 1;">&times;</button>
        </div>
        ${url ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 8px; word-break: break-all;">${url}</div>` : ''}
        <div style="font-size: 14px; color: #374151; line-height: 1.6; max-height: 400px; overflow-y: auto;">${content.replace(/\n/g, '<br>')}</div>
      `;

      // Supprimer l'ancien résultat s'il existe
      const existing = document.getElementById('ai-assistant-result');
      if (existing) {
        existing.remove();
      }

      document.body.appendChild(container);

      // Bouton de fermeture
      document.getElementById('close-result').addEventListener('click', () => {
        container.remove();
      });

      // Fermer automatiquement après 30 secondes
      setTimeout(() => {
        if (container.parentElement) {
          container.remove();
        }
      }, 30000);
    },
    args: [title, content, url],
  });
}

/**
 * Affiche une erreur dans la page
 */
async function showError(tab, message) {
  await showResult(tab, '⚠️ Erreur', message);
}

/**
 * Gestion des messages depuis le content script ou popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getAuthToken') {
    sendResponse({ token: authToken });
  } else if (request.action === 'setAuthToken') {
    saveAuthToken(request.token).then(() => {
      sendResponse({ success: true });
    });
    return true; // Indique que la réponse sera asynchrone
  }
});
