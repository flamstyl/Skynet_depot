/**
 * Tests unitaires pour le module dev_env
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { ToolRegistry } from '../../src/core/registry';
import { registerDevEnvTools } from '../../src/modules/dev_env';

describe('dev_env module', () => {
  beforeAll(() => {
    ToolRegistry.clear();
    registerDevEnvTools();
  });

  it('should register all dev_env tools', () => {
    expect(ToolRegistry.exists('dev_env_create_project')).toBe(true);
    expect(ToolRegistry.exists('dev_env_setup_python')).toBe(true);
    expect(ToolRegistry.exists('dev_env_list')).toBe(true);
  });

  it('should have correct tool schemas', () => {
    const createProjectTool = ToolRegistry.get('dev_env_create_project');
    expect(createProjectTool).toBeDefined();
    expect(createProjectTool?.inputSchema.properties.name).toBeDefined();
    expect(createProjectTool?.inputSchema.properties.type).toBeDefined();
  });
});
