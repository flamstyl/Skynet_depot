/**
 * Page de paramètres et configuration
 */

import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { configApi, getAuthTokenFromServer, saveAuthToken } from '../services/api';
import { Save, Key, Cpu, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

const SettingsPage = () => {
  const { config, setConfig, authToken, setAuthToken, isAuthenticated } = useStore();

  const [formData, setFormData] = useState({
    openai_api_key: '',
    anthropic_api_key: '',
    default_model: 'gpt-4-turbo-preview',
    default_provider: 'openai',
    enable_web_search: false,
    enable_history_logging: true,
    encryption_enabled: true,
    custom_model_url: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [tokenInput, setTokenInput] = useState(authToken || '');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await configApi.getConfig();
      setConfig(data);

      setFormData({
        ...formData,
        default_model: data.default_model,
        default_provider: data.default_provider,
        enable_web_search: data.enable_web_search,
        enable_history_logging: data.enable_history_logging,
        encryption_enabled: data.encryption_enabled,
        custom_model_url: data.custom_model_url || '',
      });
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  const handleGetToken = async () => {
    try {
      const token = await getAuthTokenFromServer();
      setTokenInput(token);
      saveAuthToken(token);
      setAuthToken(token);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Erreur lors de la récupération du token');
    }
  };

  const handleSaveToken = () => {
    if (!tokenInput.trim()) {
      setError('Le token ne peut pas être vide');
      return;
    }

    saveAuthToken(tokenInput);
    setAuthToken(tokenInput);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updatedConfig = await configApi.updateConfig(formData);
      setConfig(updatedConfig);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving config:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la sauvegarde de la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Paramètres</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configurez votre assistant IA local selon vos besoins.
        </p>
      </div>

      {/* Messages de feedback */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-800 dark:text-green-200">
            Configuration sauvegardée avec succès !
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Section Authentification */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Authentification API
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Token d'authentification
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Collez votre token ici"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handleGetToken}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Récupérer
                </button>
                <button
                  onClick={handleSaveToken}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  Sauvegarder
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {isAuthenticated ? (
                  <span className="text-green-600 dark:text-green-400">✓ Authentifié</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">✗ Non authentifié</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Section Modèles IA */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Modèles IA</h2>
          </div>

          <div className="space-y-4">
            {/* Fournisseur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fournisseur par défaut
              </label>
              <select
                value={formData.default_provider}
                onChange={(e) => handleChange('default_provider', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="local">Modèle local</option>
                <option value="custom">Personnalisé</option>
              </select>
            </div>

            {/* Clé OpenAI */}
            {(formData.default_provider === 'openai' || true) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Clé API OpenAI
                  {config?.has_openai_key && (
                    <span className="ml-2 text-xs text-green-600">✓ Configurée</span>
                  )}
                </label>
                <input
                  type="password"
                  value={formData.openai_api_key}
                  onChange={(e) => handleChange('openai_api_key', e.target.value)}
                  placeholder={config?.has_openai_key ? '••••••••••••' : 'sk-...'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}

            {/* Clé Anthropic */}
            {(formData.default_provider === 'anthropic' || true) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Clé API Anthropic
                  {config?.has_anthropic_key && (
                    <span className="ml-2 text-xs text-green-600">✓ Configurée</span>
                  )}
                </label>
                <input
                  type="password"
                  value={formData.anthropic_api_key}
                  onChange={(e) => handleChange('anthropic_api_key', e.target.value)}
                  placeholder={config?.has_anthropic_key ? '••••••••••••' : 'sk-ant-...'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}

            {/* Modèle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Modèle par défaut
              </label>
              <input
                type="text"
                value={formData.default_model}
                onChange={(e) => handleChange('default_model', e.target.value)}
                placeholder="gpt-4-turbo-preview"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* URL personnalisée */}
            {formData.default_provider === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL du modèle personnalisé
                </label>
                <input
                  type="url"
                  value={formData.custom_model_url}
                  onChange={(e) => handleChange('custom_model_url', e.target.value)}
                  placeholder="http://localhost:8000/v1/chat/completions"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section Options */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Options de sécurité et fonctionnalités
            </h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Recherche web augmentée (RAG)
              </span>
              <input
                type="checkbox"
                checked={formData.enable_web_search}
                onChange={(e) => handleChange('enable_web_search', e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Journalisation de l'historique
              </span>
              <input
                type="checkbox"
                checked={formData.enable_history_logging}
                onChange={(e) => handleChange('enable_history_logging', e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Chiffrement des données locales
              </span>
              <input
                type="checkbox"
                checked={formData.encryption_enabled}
                onChange={(e) => handleChange('encryption_enabled', e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
            </label>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveConfig}
            disabled={loading}
            className={clsx(
              'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors',
              loading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            )}
          >
            <Save className="w-5 h-5" />
            {loading ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
