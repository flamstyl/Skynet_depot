/**
 * Content Script injecté dans les pages web
 * Permet d'interagir avec le contenu de la page
 */

// Écouter les raccourcis clavier personnalisés
document.addEventListener('keydown', (event) => {
  // Ctrl+M ou Cmd+M pour ouvrir le chat (redondant avec chrome.commands, mais peut être utile)
  if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
    event.preventDefault();
    openDashboard();
  }
});

/**
 * Ouvre le dashboard de l'assistant
 */
function openDashboard() {
  window.open('http://127.0.0.1:3333/app', '_blank');
}

/**
 * Écouter les messages du background script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageContent') {
    // Retourner le contenu de la page
    sendResponse({
      title: document.title,
      content: document.body.innerText,
      url: window.location.href,
    });
  } else if (request.action === 'getSelection') {
    // Retourner le texte sélectionné
    sendResponse({
      text: window.getSelection().toString(),
    });
  }
});

/**
 * Fonction utilitaire pour extraire le contenu principal de la page
 * Essaie de filtrer les éléments non pertinents (navigation, footer, etc.)
 */
function extractMainContent() {
  // Sélecteurs courants pour le contenu principal
  const selectors = [
    'article',
    'main',
    '[role="main"]',
    '.post-content',
    '.article-content',
    '.entry-content',
    '#content',
    '.content',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.innerText;
    }
  }

  // Fallback : tout le body
  return document.body.innerText;
}

console.log('Assistant IA Local - Content Script chargé');
