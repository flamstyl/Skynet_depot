const fs = require('fs');
const path = require('path');

class ContextLoader {
  constructor(basePath) {
    this.basePath = basePath;
    this.contextDir = path.join(basePath, 'data', 'context');

    // Ensure context directory exists
    if (!fs.existsSync(this.contextDir)) {
      fs.mkdirSync(this.contextDir, { recursive: true });
    }
  }

  /**
   * Load context from a JSON file
   * @param {string} contextFile - Relative path to context file (e.g., 'context/promptarchitect.json')
   * @returns {Object|null} Context object or null if not found
   */
  loadContext(contextFile) {
    try {
      const fullPath = path.join(this.basePath, 'data', contextFile);

      if (!fs.existsSync(fullPath)) {
        console.warn(`Context file not found: ${fullPath}`);
        return null;
      }

      const data = fs.readFileSync(fullPath, 'utf-8');
      const context = JSON.parse(data);

      // Validate context structure
      if (!context.profile) {
        console.warn(`Context missing 'profile' field: ${contextFile}`);
      }

      return context;
    } catch (error) {
      console.error(`Failed to load context from ${contextFile}: ${error.message}`);
      return null;
    }
  }

  /**
   * Load context by extension ID
   * @param {Object} extension - Extension object with context_file property
   * @returns {Object|null} Context object or null
   */
  loadContextForExtension(extension) {
    if (!extension.context_file) {
      console.warn(`Extension ${extension.id} has no context_file defined`);
      return null;
    }

    return this.loadContext(extension.context_file);
  }

  /**
   * Save context to a JSON file
   * @param {string} contextFile - Relative path to context file
   * @param {Object} context - Context object to save
   * @returns {boolean} Success status
   */
  saveContext(contextFile, context) {
    try {
      const fullPath = path.join(this.basePath, 'data', contextFile);
      const dirPath = path.dirname(fullPath);

      // Ensure directory exists
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(fullPath, JSON.stringify(context, null, 2), 'utf-8');
      console.log(`Context saved successfully: ${contextFile}`);
      return true;
    } catch (error) {
      console.error(`Failed to save context to ${contextFile}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get a summary of the context
   * @param {Object} context - Context object
   * @returns {string} Human-readable summary
   */
  getContextSummary(context) {
    if (!context) {
      return 'No context available';
    }

    const parts = [];

    if (context.profile) {
      parts.push(`Profile: ${context.profile}`);
    }

    if (context.memory_dir) {
      parts.push(`Memory: ${context.memory_dir}`);
    }

    if (context.workspace_path) {
      parts.push(`Workspace: ${context.workspace_path}`);
    }

    if (context.instructions && context.instructions.length > 0) {
      parts.push(`Instructions: ${context.instructions.length} items`);
    }

    if (context.env) {
      const envKeys = Object.keys(context.env);
      parts.push(`Environment: ${envKeys.length} variables`);
    }

    if (context.files && context.files.length > 0) {
      parts.push(`Files: ${context.files.length} items`);
    }

    return parts.join(' | ');
  }

  /**
   * List all available context files
   * @returns {Array<string>} Array of context file paths
   */
  listContextFiles() {
    try {
      if (!fs.existsSync(this.contextDir)) {
        return [];
      }

      const files = fs.readdirSync(this.contextDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => `context/${file}`);
    } catch (error) {
      console.error(`Failed to list context files: ${error.message}`);
      return [];
    }
  }

  /**
   * Validate a context object
   * @param {Object} context - Context object to validate
   * @returns {Object} Validation result with {valid: boolean, errors: Array<string>}
   */
  validateContext(context) {
    const errors = [];

    if (!context) {
      errors.push('Context is null or undefined');
      return { valid: false, errors };
    }

    if (typeof context !== 'object') {
      errors.push('Context must be an object');
      return { valid: false, errors };
    }

    // Check for recommended fields
    if (!context.profile) {
      errors.push('Missing recommended field: profile');
    }

    // Validate workspace_path if present
    if (context.workspace_path && !fs.existsSync(context.workspace_path)) {
      errors.push(`Workspace path does not exist: ${context.workspace_path}`);
    }

    // Validate files if present
    if (context.files && Array.isArray(context.files)) {
      context.files.forEach((file, index) => {
        if (!fs.existsSync(file)) {
          errors.push(`File does not exist (index ${index}): ${file}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = ContextLoader;
