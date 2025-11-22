/**
 * Script de la popup de l'extension
 * Gère l'interface utilisateur de la popup
 */

const API_BASE_URL = 'http://127.0.0.1:3333';

// Éléments du DOM
const openDashboardBtn = document.getElementById('open-dashboard');
const summaryPageBtn = document.getElementById('summary-page');
const translatePageBtn = document.getElementById('translate-page');
const tokenInput = document.getElementById('token-input');
const saveTokenBtn = document.getElementById('save-token');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
  await loadToken();
  await checkConnection();
});

/**
 * Charge le token depuis le storage
 */
async function loadToken() {
  const result = await chrome.storage.local.get(['authToken']);
  if (result.authToken) {
    tokenInput.value = result.authToken;
  }
}

/**
 * Vérifie la connexion au backend
 */
async function checkConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (response.ok) {
      setStatus(true, 'Connecté au backend');
    } else {
      setStatus(false, 'Backend inaccessible');
    }
  } catch (error) {
    setStatus(false, 'Backend non démarré');
  }
}

/**
 * Met à jour le statut de connexion
 */
function setStatus(connected, message) {
  if (connected) {
    statusDot.classList.remove('disconnected');
    statusDot.classList.add('connected');
  } else {
    statusDot.classList.remove('connected');
    statusDot.classList.add('disconnected');
  }
  statusText.textContent = message;
}

/**
 * Ouvre le dashboard
 */
openDashboardBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: `${API_BASE_URL}/app` });
});

/**
 * Résume la page active
 */
summaryPageBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Envoyer un message au background script pour résumer la page
  chrome.runtime.sendMessage({ action: 'summaryPage', tabId: tab.id });

  window.close();
});

/**
 * Traduit la page active
 */
translatePageBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Demander la traduction via le content script
  chrome.tabs.sendMessage(tab.id, { action: 'translatePage' });

  window.close();
});

/**
 * Sauvegarde le token
 */
saveTokenBtn.addEventListener('click', async () => {
  const token = tokenInput.value.trim();

  if (!token) {
    alert('Veuillez entrer un token');
    return;
  }

  // Sauvegarder dans le storage
  await chrome.storage.local.set({ authToken: token });

  // Informer le background script
  chrome.runtime.sendMessage({ action: 'setAuthToken', token });

  // Vérifier la connexion avec le nouveau token
  await checkConnection();

  alert('Token sauvegardé avec succès !');
});
