#!/usr/bin/env node

/**
 * 🔥 WebPhoenix MCP - Advanced Browser Automation Server for AI Autonomy
 *
 * A comprehensive Model Context Protocol server for browser automation using Playwright.
 * Provides AI agents with full browser control capabilities including navigation,
 * interaction, data extraction, session management, and advanced features.
 *
 * @author Skynet Depot
 * @version 1.0.0
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { chromium, Browser, BrowserContext, Page, Cookie } from "playwright";
import { z } from "zod";

// ========================================
// Type Definitions
// ========================================

interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  headless: boolean;
  consoleLogs: string[];
  networkLogs: Array<{ url: string; method: string; status?: number }>;
}

// ========================================
// Global State Management
// ========================================

const sessions = new Map<string, BrowserSession>();
const DEFAULT_SESSION = "default";
const DEFAULT_TIMEOUT = 30000;

// ========================================
// Utility Functions
// ========================================

/**
 * Get or create a browser session
 */
async function getSession(sessionId: string = DEFAULT_SESSION): Promise<BrowserSession> {
  if (!sessions.has(sessionId)) {
    throw new Error(`Session "${sessionId}" not found. Create it first with browser_create_context.`);
  }
  return sessions.get(sessionId)!;
}

/**
 * Safe session getter that returns null if not found
 */
function getSessionOrNull(sessionId: string = DEFAULT_SESSION): BrowserSession | null {
  return sessions.get(sessionId) || null;
}

/**
 * Format error messages consistently
 */
function formatError(error: unknown, context: string): string {
  const message = error instanceof Error ? error.message : String(error);
  return `[WebPhoenix Error - ${context}] ${message}`;
}

// ========================================
// Browser Session Management
// ========================================

/**
 * Create a new browser context
 */
async function createContext(
  sessionId: string = DEFAULT_SESSION,
  headless: boolean = true,
  userAgent?: string,
  viewport?: { width: number; height: number }
): Promise<string> {
  try {
    // Close existing session if it exists
    if (sessions.has(sessionId)) {
      await closeContext(sessionId);
    }

    const browser = await chromium.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const contextOptions: any = {};
    if (userAgent) {
      contextOptions.userAgent = userAgent;
    }
    if (viewport) {
      contextOptions.viewport = viewport;
    }

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    // Setup console logging
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Setup network logging
    const networkLogs: Array<{ url: string; method: string; status?: number }> = [];
    page.on('request', request => {
      networkLogs.push({
        url: request.url(),
        method: request.method()
      });
    });
    page.on('response', response => {
      const log = networkLogs.find(l => l.url === response.url() && !l.status);
      if (log) {
        log.status = response.status();
      }
    });

    sessions.set(sessionId, {
      browser,
      context,
      page,
      headless,
      consoleLogs,
      networkLogs
    });

    return `Session "${sessionId}" created successfully (headless: ${headless})`;
  } catch (error) {
    throw new Error(formatError(error, 'createContext'));
  }
}

/**
 * Close a browser context
 */
async function closeContext(sessionId: string = DEFAULT_SESSION): Promise<string> {
  try {
    const session = getSessionOrNull(sessionId);
    if (!session) {
      return `Session "${sessionId}" not found or already closed`;
    }

    await session.context.close();
    await session.browser.close();
    sessions.delete(sessionId);

    return `Session "${sessionId}" closed successfully`;
  } catch (error) {
    throw new Error(formatError(error, 'closeContext'));
  }
}

// ========================================
// Navigation & Page Control
// ========================================

/**
 * Navigate to a URL
 */
async function goto(
  url: string,
  sessionId: string = DEFAULT_SESSION,
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle' = 'load',
  timeout: number = DEFAULT_TIMEOUT
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.page.goto(url, { waitUntil, timeout });
    const currentUrl = session.page.url();
    return `Navigated to: ${currentUrl}`;
  } catch (error) {
    throw new Error(formatError(error, 'goto'));
  }
}

/**
 * Go back in history
 */
async function goBack(sessionId: string = DEFAULT_SESSION, timeout: number = DEFAULT_TIMEOUT): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.page.goBack({ timeout });
    return `Navigated back to: ${session.page.url()}`;
  } catch (error) {
    throw new Error(formatError(error, 'goBack'));
  }
}

/**
 * Go forward in history
 */
async function goForward(sessionId: string = DEFAULT_SESSION, timeout: number = DEFAULT_TIMEOUT): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.page.goForward({ timeout });
    return `Navigated forward to: ${session.page.url()}`;
  } catch (error) {
    throw new Error(formatError(error, 'goForward'));
  }
}

/**
 * Reload the current page
 */
async function reload(sessionId: string = DEFAULT_SESSION, timeout: number = DEFAULT_TIMEOUT): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.page.reload({ timeout });
    return `Page reloaded: ${session.page.url()}`;
  } catch (error) {
    throw new Error(formatError(error, 'reload'));
  }
}

/**
 * Get current URL
 */
async function getUrl(sessionId: string = DEFAULT_SESSION): Promise<string> {
  try {
    const session = await getSession(sessionId);
    return session.page.url();
  } catch (error) {
    throw new Error(formatError(error, 'getUrl'));
  }
}

/**
 * Get page title
 */
async function getTitle(sessionId: string = DEFAULT_SESSION): Promise<string> {
  try {
    const session = await getSession(sessionId);
    return await session.page.title();
  } catch (error) {
    throw new Error(formatError(error, 'getTitle'));
  }
}

/**
 * Set viewport size
 */
async function setViewport(
  width: number,
  height: number,
  sessionId: string = DEFAULT_SESSION
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.page.setViewportSize({ width, height });
    return `Viewport set to ${width}x${height}`;
  } catch (error) {
    throw new Error(formatError(error, 'setViewport'));
  }
}

// ========================================
// Element Interaction
// ========================================

/**
 * Click on an element
 */
async function click(
  selector: string,
  sessionId: string = DEFAULT_SESSION,
  timeout: number = DEFAULT_TIMEOUT
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.page.click(selector, { timeout });
    return `Clicked on element: ${selector}`;
  } catch (error) {
    throw new Error(formatError(error, 'click'));
  }
}

/**
 * Type text into an element
 */
async function type(
  selector: string,
  text: string,
  sessionId: string = DEFAULT_SESSION,
  timeout: number = DEFAULT_TIMEOUT,
  delay?: number
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.page.fill(selector, text, { timeout });
    if (delay) {
      await session.page.type(selector, text, { delay, timeout });
    }
    return `Typed text into element: ${selector}`;
  } catch (error) {
    throw new Error(formatError(error, 'type'));
  }
}

/**
 * Press a key
 */
async function press(
  key: string,
  sessionId: string = DEFAULT_SESSION,
  selector?: string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    if (selector) {
      await session.page.press(selector, key, { timeout });
      return `Pressed "${key}" on element: ${selector}`;
    } else {
      await session.page.keyboard.press(key);
      return `Pressed "${key}" globally`;
    }
  } catch (error) {
    throw new Error(formatError(error, 'press'));
  }
}

/**
 * Select option(s) in a select element
 */
async function selectOption(
  selector: string,
  values: string | string[],
  sessionId: string = DEFAULT_SESSION,
  timeout: number = DEFAULT_TIMEOUT
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    const valueArray = Array.isArray(values) ? values : [values];
    await session.page.selectOption(selector, valueArray, { timeout });
    return `Selected option(s) in ${selector}: ${valueArray.join(', ')}`;
  } catch (error) {
    throw new Error(formatError(error, 'selectOption'));
  }
}

/**
 * Hover over an element
 */
async function hover(
  selector: string,
  sessionId: string = DEFAULT_SESSION,
  timeout: number = DEFAULT_TIMEOUT
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.page.hover(selector, { timeout });
    return `Hovered over element: ${selector}`;
  } catch (error) {
    throw new Error(formatError(error, 'hover'));
  }
}

/**
 * Check/uncheck a checkbox or radio button
 */
async function check(
  selector: string,
  checked: boolean = true,
  sessionId: string = DEFAULT_SESSION,
  timeout: number = DEFAULT_TIMEOUT
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    if (checked) {
      await session.page.check(selector, { timeout });
    } else {
      await session.page.uncheck(selector, { timeout });
    }
    return `${checked ? 'Checked' : 'Unchecked'} element: ${selector}`;
  } catch (error) {
    throw new Error(formatError(error, 'check'));
  }
}

/**
 * Drag and drop an element
 */
async function dragAndDrop(
  sourceSelector: string,
  targetSelector: string,
  sessionId: string = DEFAULT_SESSION,
  timeout: number = DEFAULT_TIMEOUT
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.page.dragAndDrop(sourceSelector, targetSelector, { timeout });
    return `Dragged ${sourceSelector} to ${targetSelector}`;
  } catch (error) {
    throw new Error(formatError(error, 'dragAndDrop'));
  }
}

/**
 * Upload file(s) to an input element
 */
async function uploadFile(
  selector: string,
  filePaths: string | string[],
  sessionId: string = DEFAULT_SESSION,
  timeout: number = DEFAULT_TIMEOUT
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    const pathArray = Array.isArray(filePaths) ? filePaths : [filePaths];
    await session.page.setInputFiles(selector, pathArray, { timeout });
    return `Uploaded file(s) to ${selector}: ${pathArray.join(', ')}`;
  } catch (error) {
    throw new Error(formatError(error, 'uploadFile'));
  }
}

// ========================================
// Form Filling
// ========================================

/**
 * Fill a form with multiple fields
 */
async function fillForm(
  formSelector: string,
  fields: Record<string, string>,
  submit: boolean = false,
  sessionId: string = DEFAULT_SESSION,
  timeout: number = DEFAULT_TIMEOUT
): Promise<string> {
  try {
    const session = await getSession(sessionId);

    // Wait for form to be visible
    await session.page.waitForSelector(formSelector, { state: 'visible', timeout });

    // Fill each field
    for (const [fieldSelector, value] of Object.entries(fields)) {
      const fullSelector = `${formSelector} ${fieldSelector}`;
      await session.page.fill(fullSelector, value, { timeout });
    }

    // Submit if requested
    if (submit) {
      const submitButton = `${formSelector} button[type="submit"], ${formSelector} input[type="submit"]`;
      const submitExists = await session.page.locator(submitButton).count() > 0;

      if (submitExists) {
        await session.page.click(submitButton, { timeout });
        await session.page.waitForLoadState('networkidle', { timeout });
      } else {
        // Try pressing Enter on the form
        await session.page.press(formSelector, 'Enter');
        await session.page.waitForLoadState('networkidle', { timeout });
      }
    }

    return `Form filled successfully${submit ? ' and submitted' : ''}`;
  } catch (error) {
    throw new Error(formatError(error, 'fillForm'));
  }
}

// ========================================
// Data Extraction
// ========================================

/**
 * Get text content from element(s)
 */
async function getText(
  selector: string,
  sessionId: string = DEFAULT_SESSION,
  all: boolean = false,
  timeout: number = DEFAULT_TIMEOUT
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.page.waitForSelector(selector, { timeout });

    if (all) {
      const elements = await session.page.$$(selector);
      const texts = await Promise.all(
        elements.map(el => el.textContent())
      );
      return JSON.stringify(texts.filter(t => t !== null));
    } else {
      const text = await session.page.textContent(selector);
      return text || '';
    }
  } catch (error) {
    throw new Error(formatError(error, 'getText'));
  }
}

/**
 * Get attribute value from element(s)
 */
async function getAttribute(
  selector: string,
  attributeName: string,
  sessionId: string = DEFAULT_SESSION,
  all: boolean = false,
  timeout: number = DEFAULT_TIMEOUT
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.page.waitForSelector(selector, { timeout });

    if (all) {
      const elements = await session.page.$$(selector);
      const attrs = await Promise.all(
        elements.map(el => el.getAttribute(attributeName))
      );
      return JSON.stringify(attrs.filter(a => a !== null));
    } else {
      const attr = await session.page.getAttribute(selector, attributeName);
      return attr || '';
    }
  } catch (error) {
    throw new Error(formatError(error, 'getAttribute'));
  }
}

/**
 * Get HTML content
 */
async function getHtml(
  selector: string = 'html',
  sessionId: string = DEFAULT_SESSION,
  inner: boolean = true,
  timeout: number = DEFAULT_TIMEOUT
): Promise<string> {
  try {
    const session = await getSession(sessionId);

    if (selector === 'html') {
      return await session.page.content();
    }

    await session.page.waitForSelector(selector, { timeout });

    if (inner) {
      return await session.page.innerHTML(selector) || '';
    } else {
      const element = await session.page.$(selector);
      if (!element) return '';
      return await element.evaluate(el => el.outerHTML);
    }
  } catch (error) {
    throw new Error(formatError(error, 'getHtml'));
  }
}

/**
 * Get all links from the page
 */
async function getLinks(
  sessionId: string = DEFAULT_SESSION,
  selector: string = 'a[href]'
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    const links = await session.page.$$eval(selector, (elements) =>
      elements.map((el) => ({
        href: (el as HTMLAnchorElement).href,
        text: el.textContent?.trim() || ''
      }))
    );
    return JSON.stringify(links, null, 2);
  } catch (error) {
    throw new Error(formatError(error, 'getLinks'));
  }
}

/**
 * Get all images from the page
 */
async function getImages(
  sessionId: string = DEFAULT_SESSION,
  selector: string = 'img'
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    const images = await session.page.$$eval(selector, (elements) =>
      elements.map((el) => ({
        src: (el as HTMLImageElement).src,
        alt: (el as HTMLImageElement).alt || ''
      }))
    );
    return JSON.stringify(images, null, 2);
  } catch (error) {
    throw new Error(formatError(error, 'getImages'));
  }
}

// ========================================
// Screenshots & PDFs
// ========================================

/**
 * Take a screenshot
 */
async function screenshot(
  path: string,
  sessionId: string = DEFAULT_SESSION,
  fullPage: boolean = false,
  selector?: string
): Promise<string> {
  try {
    const session = await getSession(sessionId);

    if (selector) {
      const element = await session.page.$(selector);
      if (element) {
        await element.screenshot({ path });
        return `Screenshot of ${selector} saved to: ${path}`;
      } else {
        throw new Error(`Element not found: ${selector}`);
      }
    } else {
      await session.page.screenshot({ path, fullPage });
      return `Screenshot saved to: ${path} (fullPage: ${fullPage})`;
    }
  } catch (error) {
    throw new Error(formatError(error, 'screenshot'));
  }
}

/**
 * Save page as PDF
 */
async function savePdf(
  path: string,
  sessionId: string = DEFAULT_SESSION,
  format: 'A4' | 'Letter' = 'A4',
  printBackground: boolean = true
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.page.pdf({ path, format, printBackground });
    return `PDF saved to: ${path}`;
  } catch (error) {
    throw new Error(formatError(error, 'savePdf'));
  }
}

// ========================================
// Waiting & Robustness
// ========================================

/**
 * Wait for a selector to appear/disappear
 */
async function waitForSelector(
  selector: string,
  sessionId: string = DEFAULT_SESSION,
  state: 'visible' | 'hidden' | 'attached' | 'detached' = 'visible',
  timeout: number = DEFAULT_TIMEOUT
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.page.waitForSelector(selector, { state, timeout });
    return `Selector "${selector}" is ${state}`;
  } catch (error) {
    throw new Error(formatError(error, 'waitForSelector'));
  }
}

/**
 * Wait for navigation to complete
 */
async function waitForNavigation(
  sessionId: string = DEFAULT_SESSION,
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle' = 'load',
  timeout: number = DEFAULT_TIMEOUT
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.page.waitForLoadState(waitUntil, { timeout });
    return `Navigation complete (${waitUntil})`;
  } catch (error) {
    throw new Error(formatError(error, 'waitForNavigation'));
  }
}

/**
 * Wait for a specific timeout
 */
async function waitForTimeout(
  milliseconds: number,
  sessionId: string = DEFAULT_SESSION
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.page.waitForTimeout(milliseconds);
    return `Waited for ${milliseconds}ms`;
  } catch (error) {
    throw new Error(formatError(error, 'waitForTimeout'));
  }
}

/**
 * Wait for a function to return true
 */
async function waitForFunction(
  expression: string,
  sessionId: string = DEFAULT_SESSION,
  timeout: number = DEFAULT_TIMEOUT
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.page.waitForFunction(expression, {}, { timeout });
    return `Function condition met: ${expression}`;
  } catch (error) {
    throw new Error(formatError(error, 'waitForFunction'));
  }
}

// ========================================
// JavaScript Evaluation
// ========================================

/**
 * Evaluate JavaScript in the page context
 */
async function evaluate(
  expression: string,
  sessionId: string = DEFAULT_SESSION
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    const result = await session.page.evaluate(expression);
    return JSON.stringify(result, null, 2);
  } catch (error) {
    throw new Error(formatError(error, 'evaluate'));
  }
}

// ========================================
// Cookie & Storage Management
// ========================================

/**
 * Set cookies
 */
async function setCookies(
  cookies: Cookie[],
  sessionId: string = DEFAULT_SESSION
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.context.addCookies(cookies);
    return `Set ${cookies.length} cookie(s)`;
  } catch (error) {
    throw new Error(formatError(error, 'setCookies'));
  }
}

/**
 * Get cookies
 */
async function getCookies(
  sessionId: string = DEFAULT_SESSION,
  url?: string
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    const cookies = url
      ? await session.context.cookies(url)
      : await session.context.cookies();
    return JSON.stringify(cookies, null, 2);
  } catch (error) {
    throw new Error(formatError(error, 'getCookies'));
  }
}

/**
 * Clear cookies
 */
async function clearCookies(sessionId: string = DEFAULT_SESSION): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.context.clearCookies();
    return 'All cookies cleared';
  } catch (error) {
    throw new Error(formatError(error, 'clearCookies'));
  }
}

/**
 * Save storage state
 */
async function saveStorage(
  path: string,
  sessionId: string = DEFAULT_SESSION
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.context.storageState({ path });
    return `Storage state saved to: ${path}`;
  } catch (error) {
    throw new Error(formatError(error, 'saveStorage'));
  }
}

/**
 * Load storage state
 */
async function loadStorage(
  path: string,
  sessionId: string = DEFAULT_SESSION
): Promise<string> {
  try {
    // Close existing session if it exists
    if (sessions.has(sessionId)) {
      await closeContext(sessionId);
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: path });
    const page = await context.newPage();

    const consoleLogs: string[] = [];
    page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

    const networkLogs: Array<{ url: string; method: string; status?: number }> = [];
    page.on('request', request => {
      networkLogs.push({ url: request.url(), method: request.method() });
    });

    sessions.set(sessionId, {
      browser,
      context,
      page,
      headless: true,
      consoleLogs,
      networkLogs
    });

    return `Storage state loaded from: ${path}`;
  } catch (error) {
    throw new Error(formatError(error, 'loadStorage'));
  }
}

// ========================================
// Advanced Features
// ========================================

/**
 * Emulate a device
 */
async function emulateDevice(
  deviceName: string,
  sessionId: string = DEFAULT_SESSION
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    const { devices } = await import('playwright');
    const device = devices[deviceName];

    if (!device) {
      throw new Error(`Unknown device: ${deviceName}. Use common names like "iPhone 13", "iPad Pro", "Pixel 5", etc.`);
    }

    await session.context.close();
    const newContext = await session.browser.newContext(device);
    const newPage = await newContext.newPage();

    // Preserve logging
    const consoleLogs = session.consoleLogs;
    newPage.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

    const networkLogs = session.networkLogs;
    newPage.on('request', request => {
      networkLogs.push({ url: request.url(), method: request.method() });
    });

    // Update session
    session.context = newContext;
    session.page = newPage;

    return `Now emulating device: ${deviceName}`;
  } catch (error) {
    throw new Error(formatError(error, 'emulateDevice'));
  }
}

/**
 * Set geolocation
 */
async function setGeolocation(
  latitude: number,
  longitude: number,
  sessionId: string = DEFAULT_SESSION
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.context.setGeolocation({ latitude, longitude });
    return `Geolocation set to: ${latitude}, ${longitude}`;
  } catch (error) {
    throw new Error(formatError(error, 'setGeolocation'));
  }
}

/**
 * Set user agent
 */
async function setUserAgent(
  userAgent: string,
  sessionId: string = DEFAULT_SESSION
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.context.setExtraHTTPHeaders({ 'User-Agent': userAgent });
    return `User agent set to: ${userAgent}`;
  } catch (error) {
    throw new Error(formatError(error, 'setUserAgent'));
  }
}

/**
 * Block resource types
 */
async function blockResources(
  resourceTypes: string[],
  sessionId: string = DEFAULT_SESSION
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    await session.page.route('**/*', route => {
      const type = route.request().resourceType();
      if (resourceTypes.includes(type)) {
        route.abort();
      } else {
        route.continue();
      }
    });
    return `Blocking resource types: ${resourceTypes.join(', ')}`;
  } catch (error) {
    throw new Error(formatError(error, 'blockResources'));
  }
}

/**
 * Get console logs
 */
async function getConsoleLogs(
  sessionId: string = DEFAULT_SESSION,
  clear: boolean = false
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    const logs = [...session.consoleLogs];

    if (clear) {
      session.consoleLogs.length = 0;
    }

    return JSON.stringify(logs, null, 2);
  } catch (error) {
    throw new Error(formatError(error, 'getConsoleLogs'));
  }
}

/**
 * Get network logs
 */
async function getNetworkLogs(
  sessionId: string = DEFAULT_SESSION,
  clear: boolean = false
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    const logs = [...session.networkLogs];

    if (clear) {
      session.networkLogs.length = 0;
    }

    return JSON.stringify(logs, null, 2);
  } catch (error) {
    throw new Error(formatError(error, 'getNetworkLogs'));
  }
}

/**
 * Intercept and modify requests
 */
async function interceptRequest(
  urlPattern: string,
  action: 'block' | 'modify',
  sessionId: string = DEFAULT_SESSION,
  modifications?: Record<string, any>
): Promise<string> {
  try {
    const session = await getSession(sessionId);
    const pattern = new RegExp(urlPattern);

    await session.page.route(pattern, route => {
      if (action === 'block') {
        route.abort();
      } else if (action === 'modify' && modifications) {
        route.continue(modifications);
      } else {
        route.continue();
      }
    });

    return `Intercepting requests matching: ${urlPattern} (action: ${action})`;
  } catch (error) {
    throw new Error(formatError(error, 'interceptRequest'));
  }
}

// ========================================
// MCP Server Setup
// ========================================

const server = new Server(
  {
    name: "webphoenix-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List all available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Session Management
      {
        name: "browser_create_context",
        description: "Create a new browser context/session. Must be called before using other browser tools.",
        inputSchema: {
          type: "object",
          properties: {
            session_id: {
              type: "string",
              description: "Unique identifier for this browser session",
              default: "default"
            },
            headless: {
              type: "boolean",
              description: "Run browser in headless mode (no GUI)",
              default: true
            },
            user_agent: {
              type: "string",
              description: "Custom user agent string (optional)"
            },
            viewport: {
              type: "object",
              description: "Initial viewport size (optional)",
              properties: {
                width: { type: "number" },
                height: { type: "number" }
              }
            }
          }
        }
      },
      {
        name: "browser_close_context",
        description: "Close and cleanup a browser context/session",
        inputSchema: {
          type: "object",
          properties: {
            session_id: {
              type: "string",
              description: "Session identifier to close",
              default: "default"
            }
          }
        }
      },

      // Navigation
      {
        name: "browser_goto",
        description: "Navigate to a specific URL",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL to navigate to"
            },
            session_id: { type: "string", default: "default" },
            wait_until: {
              type: "string",
              enum: ["load", "domcontentloaded", "networkidle"],
              description: "When to consider navigation succeeded",
              default: "load"
            },
            timeout: {
              type: "number",
              description: "Maximum time in milliseconds",
              default: 30000
            }
          },
          required: ["url"]
        }
      },
      {
        name: "browser_back",
        description: "Navigate back in browser history",
        inputSchema: {
          type: "object",
          properties: {
            session_id: { type: "string", default: "default" },
            timeout: { type: "number", default: 30000 }
          }
        }
      },
      {
        name: "browser_forward",
        description: "Navigate forward in browser history",
        inputSchema: {
          type: "object",
          properties: {
            session_id: { type: "string", default: "default" },
            timeout: { type: "number", default: 30000 }
          }
        }
      },
      {
        name: "browser_reload",
        description: "Reload the current page",
        inputSchema: {
          type: "object",
          properties: {
            session_id: { type: "string", default: "default" },
            timeout: { type: "number", default: 30000 }
          }
        }
      },
      {
        name: "browser_get_url",
        description: "Get the current page URL",
        inputSchema: {
          type: "object",
          properties: {
            session_id: { type: "string", default: "default" }
          }
        }
      },
      {
        name: "browser_get_title",
        description: "Get the current page title",
        inputSchema: {
          type: "object",
          properties: {
            session_id: { type: "string", default: "default" }
          }
        }
      },
      {
        name: "browser_set_viewport",
        description: "Set the browser viewport size",
        inputSchema: {
          type: "object",
          properties: {
            width: { type: "number", description: "Viewport width in pixels" },
            height: { type: "number", description: "Viewport height in pixels" },
            session_id: { type: "string", default: "default" }
          },
          required: ["width", "height"]
        }
      },

      // Element Interaction
      {
        name: "browser_click",
        description: "Click on an element by CSS selector",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string", description: "CSS selector of element to click" },
            session_id: { type: "string", default: "default" },
            timeout: { type: "number", default: 30000 }
          },
          required: ["selector"]
        }
      },
      {
        name: "browser_type",
        description: "Type text into an input field",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string", description: "CSS selector of input element" },
            text: { type: "string", description: "Text to type" },
            session_id: { type: "string", default: "default" },
            timeout: { type: "number", default: 30000 },
            delay: { type: "number", description: "Delay between keystrokes in ms" }
          },
          required: ["selector", "text"]
        }
      },
      {
        name: "browser_press",
        description: "Press a keyboard key (optionally on a specific element)",
        inputSchema: {
          type: "object",
          properties: {
            key: { type: "string", description: "Key to press (e.g., 'Enter', 'Tab', 'Escape')" },
            session_id: { type: "string", default: "default" },
            selector: { type: "string", description: "CSS selector to focus before pressing (optional)" },
            timeout: { type: "number", default: 30000 }
          },
          required: ["key"]
        }
      },
      {
        name: "browser_select_option",
        description: "Select option(s) in a <select> element",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string", description: "CSS selector of select element" },
            values: {
              description: "Value(s) to select (string or array of strings)",
              oneOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } }
              ]
            },
            session_id: { type: "string", default: "default" },
            timeout: { type: "number", default: 30000 }
          },
          required: ["selector", "values"]
        }
      },
      {
        name: "browser_hover",
        description: "Hover over an element",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string", description: "CSS selector of element to hover" },
            session_id: { type: "string", default: "default" },
            timeout: { type: "number", default: 30000 }
          },
          required: ["selector"]
        }
      },
      {
        name: "browser_check",
        description: "Check or uncheck a checkbox/radio button",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string", description: "CSS selector of checkbox/radio" },
            checked: { type: "boolean", description: "True to check, false to uncheck", default: true },
            session_id: { type: "string", default: "default" },
            timeout: { type: "number", default: 30000 }
          },
          required: ["selector"]
        }
      },
      {
        name: "browser_drag_and_drop",
        description: "Drag and drop an element to another element",
        inputSchema: {
          type: "object",
          properties: {
            source_selector: { type: "string", description: "CSS selector of element to drag" },
            target_selector: { type: "string", description: "CSS selector of drop target" },
            session_id: { type: "string", default: "default" },
            timeout: { type: "number", default: 30000 }
          },
          required: ["source_selector", "target_selector"]
        }
      },
      {
        name: "browser_upload_file",
        description: "Upload file(s) to an input[type=file] element",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string", description: "CSS selector of file input" },
            file_paths: {
              description: "Path(s) to file(s) to upload",
              oneOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } }
              ]
            },
            session_id: { type: "string", default: "default" },
            timeout: { type: "number", default: 30000 }
          },
          required: ["selector", "file_paths"]
        }
      },

      // Form Filling
      {
        name: "browser_fill_form",
        description: "Fill and optionally submit a form with multiple fields",
        inputSchema: {
          type: "object",
          properties: {
            form_selector: { type: "string", description: "CSS selector of the form element" },
            fields: {
              type: "object",
              description: "Object mapping field selectors to values",
              additionalProperties: { type: "string" }
            },
            submit: { type: "boolean", description: "Submit the form after filling", default: false },
            session_id: { type: "string", default: "default" },
            timeout: { type: "number", default: 30000 }
          },
          required: ["form_selector", "fields"]
        }
      },

      // Data Extraction
      {
        name: "browser_get_text",
        description: "Get text content from element(s)",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string", description: "CSS selector of element(s)" },
            session_id: { type: "string", default: "default" },
            all: { type: "boolean", description: "Get text from all matching elements", default: false },
            timeout: { type: "number", default: 30000 }
          },
          required: ["selector"]
        }
      },
      {
        name: "browser_get_attribute",
        description: "Get attribute value from element(s)",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string", description: "CSS selector of element(s)" },
            attribute_name: { type: "string", description: "Name of attribute to get (e.g., 'href', 'src')" },
            session_id: { type: "string", default: "default" },
            all: { type: "boolean", description: "Get attribute from all matching elements", default: false },
            timeout: { type: "number", default: 30000 }
          },
          required: ["selector", "attribute_name"]
        }
      },
      {
        name: "browser_get_html",
        description: "Get HTML content from element or entire page",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string", description: "CSS selector (default: 'html' for full page)", default: "html" },
            session_id: { type: "string", default: "default" },
            inner: { type: "boolean", description: "Get innerHTML (true) or outerHTML (false)", default: true },
            timeout: { type: "number", default: 30000 }
          }
        }
      },
      {
        name: "browser_get_links",
        description: "Extract all links from the page with their text and URLs",
        inputSchema: {
          type: "object",
          properties: {
            session_id: { type: "string", default: "default" },
            selector: { type: "string", description: "CSS selector for links", default: "a[href]" }
          }
        }
      },
      {
        name: "browser_get_images",
        description: "Extract all images from the page with their src and alt text",
        inputSchema: {
          type: "object",
          properties: {
            session_id: { type: "string", default: "default" },
            selector: { type: "string", description: "CSS selector for images", default: "img" }
          }
        }
      },

      // Screenshots & PDFs
      {
        name: "browser_screenshot",
        description: "Take a screenshot of the page or a specific element",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path to save screenshot" },
            session_id: { type: "string", default: "default" },
            full_page: { type: "boolean", description: "Capture full scrollable page", default: false },
            selector: { type: "string", description: "CSS selector of element to screenshot (optional)" }
          },
          required: ["path"]
        }
      },
      {
        name: "browser_save_pdf",
        description: "Save the current page as a PDF file",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path to save PDF" },
            session_id: { type: "string", default: "default" },
            format: { type: "string", enum: ["A4", "Letter"], description: "Page format", default: "A4" },
            print_background: { type: "boolean", description: "Include background graphics", default: true }
          },
          required: ["path"]
        }
      },

      // Waiting
      {
        name: "browser_wait_for_selector",
        description: "Wait for an element to appear/disappear",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string", description: "CSS selector to wait for" },
            session_id: { type: "string", default: "default" },
            state: {
              type: "string",
              enum: ["visible", "hidden", "attached", "detached"],
              description: "State to wait for",
              default: "visible"
            },
            timeout: { type: "number", default: 30000 }
          },
          required: ["selector"]
        }
      },
      {
        name: "browser_wait_for_navigation",
        description: "Wait for navigation/page load to complete",
        inputSchema: {
          type: "object",
          properties: {
            session_id: { type: "string", default: "default" },
            wait_until: {
              type: "string",
              enum: ["load", "domcontentloaded", "networkidle"],
              default: "load"
            },
            timeout: { type: "number", default: 30000 }
          }
        }
      },
      {
        name: "browser_wait_for_timeout",
        description: "Wait for a specific amount of time (use sparingly)",
        inputSchema: {
          type: "object",
          properties: {
            milliseconds: { type: "number", description: "Time to wait in milliseconds" },
            session_id: { type: "string", default: "default" }
          },
          required: ["milliseconds"]
        }
      },
      {
        name: "browser_wait_for_function",
        description: "Wait for a JavaScript expression to return true",
        inputSchema: {
          type: "object",
          properties: {
            expression: { type: "string", description: "JavaScript expression to evaluate" },
            session_id: { type: "string", default: "default" },
            timeout: { type: "number", default: 30000 }
          },
          required: ["expression"]
        }
      },

      // JavaScript Evaluation
      {
        name: "browser_evaluate",
        description: "Execute JavaScript code in the page context",
        inputSchema: {
          type: "object",
          properties: {
            expression: { type: "string", description: "JavaScript code to execute" },
            session_id: { type: "string", default: "default" }
          },
          required: ["expression"]
        }
      },

      // Cookies & Storage
      {
        name: "browser_set_cookies",
        description: "Set browser cookies",
        inputSchema: {
          type: "object",
          properties: {
            cookies: {
              type: "array",
              description: "Array of cookie objects with name, value, domain, path, etc.",
              items: { type: "object" }
            },
            session_id: { type: "string", default: "default" }
          },
          required: ["cookies"]
        }
      },
      {
        name: "browser_get_cookies",
        description: "Get browser cookies",
        inputSchema: {
          type: "object",
          properties: {
            session_id: { type: "string", default: "default" },
            url: { type: "string", description: "Filter cookies by URL (optional)" }
          }
        }
      },
      {
        name: "browser_clear_cookies",
        description: "Clear all browser cookies",
        inputSchema: {
          type: "object",
          properties: {
            session_id: { type: "string", default: "default" }
          }
        }
      },
      {
        name: "browser_save_storage",
        description: "Save browser storage state (cookies, localStorage, sessionStorage) to a file",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path to save storage state" },
            session_id: { type: "string", default: "default" }
          },
          required: ["path"]
        }
      },
      {
        name: "browser_load_storage",
        description: "Load browser storage state from a file",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path to load storage state from" },
            session_id: { type: "string", default: "default" }
          },
          required: ["path"]
        }
      },

      // Advanced Features
      {
        name: "browser_emulate_device",
        description: "Emulate a mobile device (iPhone, iPad, Pixel, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            device_name: {
              type: "string",
              description: "Device name (e.g., 'iPhone 13', 'iPad Pro', 'Pixel 5', 'Galaxy S21')"
            },
            session_id: { type: "string", default: "default" }
          },
          required: ["device_name"]
        }
      },
      {
        name: "browser_set_geolocation",
        description: "Set geolocation coordinates",
        inputSchema: {
          type: "object",
          properties: {
            latitude: { type: "number", description: "Latitude coordinate" },
            longitude: { type: "number", description: "Longitude coordinate" },
            session_id: { type: "string", default: "default" }
          },
          required: ["latitude", "longitude"]
        }
      },
      {
        name: "browser_set_user_agent",
        description: "Set custom user agent string",
        inputSchema: {
          type: "object",
          properties: {
            user_agent: { type: "string", description: "User agent string" },
            session_id: { type: "string", default: "default" }
          },
          required: ["user_agent"]
        }
      },
      {
        name: "browser_block_resources",
        description: "Block specific resource types (images, stylesheets, scripts, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            resource_types: {
              type: "array",
              description: "Resource types to block (e.g., ['image', 'stylesheet', 'font'])",
              items: { type: "string" }
            },
            session_id: { type: "string", default: "default" }
          },
          required: ["resource_types"]
        }
      },
      {
        name: "browser_get_console_logs",
        description: "Get console logs from the browser",
        inputSchema: {
          type: "object",
          properties: {
            session_id: { type: "string", default: "default" },
            clear: { type: "boolean", description: "Clear logs after retrieval", default: false }
          }
        }
      },
      {
        name: "browser_get_network_logs",
        description: "Get network request logs",
        inputSchema: {
          type: "object",
          properties: {
            session_id: { type: "string", default: "default" },
            clear: { type: "boolean", description: "Clear logs after retrieval", default: false }
          }
        }
      },
      {
        name: "browser_intercept_request",
        description: "Intercept and block/modify network requests matching a pattern",
        inputSchema: {
          type: "object",
          properties: {
            url_pattern: { type: "string", description: "Regex pattern for URLs to intercept" },
            action: { type: "string", enum: ["block", "modify"], description: "Action to take on match" },
            session_id: { type: "string", default: "default" },
            modifications: {
              type: "object",
              description: "Modifications to apply if action is 'modify' (e.g., headers, postData)"
            }
          },
          required: ["url_pattern", "action"]
        }
      }
    ]
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    // Type guard for args
    if (!args) {
      throw new Error("Missing arguments");
    }

    // Cast args to any for simplicity
    const params = args as any;

    switch (name) {
      // Session Management
      case "browser_create_context":
        return {
          content: [{
            type: "text",
            text: await createContext(
              params.session_id,
              params.headless,
              params.user_agent,
              params.viewport
            )
          }]
        };

      case "browser_close_context":
        return {
          content: [{
            type: "text",
            text: await closeContext(params.session_id)
          }]
        };

      // Navigation
      case "browser_goto":
        return {
          content: [{
            type: "text",
            text: await goto(
              params.url,
              params.session_id,
              params.wait_until,
              params.timeout
            )
          }]
        };

      case "browser_back":
        return {
          content: [{
            type: "text",
            text: await goBack(params.session_id, params.timeout)
          }]
        };

      case "browser_forward":
        return {
          content: [{
            type: "text",
            text: await goForward(params.session_id, params.timeout)
          }]
        };

      case "browser_reload":
        return {
          content: [{
            type: "text",
            text: await reload(params.session_id, params.timeout)
          }]
        };

      case "browser_get_url":
        return {
          content: [{
            type: "text",
            text: await getUrl(params.session_id)
          }]
        };

      case "browser_get_title":
        return {
          content: [{
            type: "text",
            text: await getTitle(params.session_id)
          }]
        };

      case "browser_set_viewport":
        return {
          content: [{
            type: "text",
            text: await setViewport(params.width, params.height, params.session_id)
          }]
        };

      // Element Interaction
      case "browser_click":
        return {
          content: [{
            type: "text",
            text: await click(params.selector, params.session_id, params.timeout)
          }]
        };

      case "browser_type":
        return {
          content: [{
            type: "text",
            text: await type(
              params.selector,
              params.text,
              params.session_id,
              params.timeout,
              params.delay
            )
          }]
        };

      case "browser_press":
        return {
          content: [{
            type: "text",
            text: await press(
              params.key,
              params.session_id,
              params.selector,
              params.timeout
            )
          }]
        };

      case "browser_select_option":
        return {
          content: [{
            type: "text",
            text: await selectOption(
              params.selector,
              params.values,
              params.session_id,
              params.timeout
            )
          }]
        };

      case "browser_hover":
        return {
          content: [{
            type: "text",
            text: await hover(params.selector, params.session_id, params.timeout)
          }]
        };

      case "browser_check":
        return {
          content: [{
            type: "text",
            text: await check(
              params.selector,
              params.checked,
              params.session_id,
              params.timeout
            )
          }]
        };

      case "browser_drag_and_drop":
        return {
          content: [{
            type: "text",
            text: await dragAndDrop(
              params.source_selector,
              params.target_selector,
              params.session_id,
              params.timeout
            )
          }]
        };

      case "browser_upload_file":
        return {
          content: [{
            type: "text",
            text: await uploadFile(
              params.selector,
              params.file_paths,
              params.session_id,
              params.timeout
            )
          }]
        };

      // Form Filling
      case "browser_fill_form":
        return {
          content: [{
            type: "text",
            text: await fillForm(
              params.form_selector,
              params.fields,
              params.submit,
              params.session_id,
              params.timeout
            )
          }]
        };

      // Data Extraction
      case "browser_get_text":
        return {
          content: [{
            type: "text",
            text: await getText(
              params.selector,
              params.session_id,
              params.all,
              params.timeout
            )
          }]
        };

      case "browser_get_attribute":
        return {
          content: [{
            type: "text",
            text: await getAttribute(
              params.selector,
              params.attribute_name,
              params.session_id,
              params.all,
              params.timeout
            )
          }]
        };

      case "browser_get_html":
        return {
          content: [{
            type: "text",
            text: await getHtml(
              params.selector,
              params.session_id,
              params.inner,
              params.timeout
            )
          }]
        };

      case "browser_get_links":
        return {
          content: [{
            type: "text",
            text: await getLinks(params.session_id, params.selector)
          }]
        };

      case "browser_get_images":
        return {
          content: [{
            type: "text",
            text: await getImages(params.session_id, params.selector)
          }]
        };

      // Screenshots & PDFs
      case "browser_screenshot":
        return {
          content: [{
            type: "text",
            text: await screenshot(
              params.path,
              params.session_id,
              params.full_page,
              params.selector
            )
          }]
        };

      case "browser_save_pdf":
        return {
          content: [{
            type: "text",
            text: await savePdf(
              params.path,
              params.session_id,
              params.format,
              params.print_background
            )
          }]
        };

      // Waiting
      case "browser_wait_for_selector":
        return {
          content: [{
            type: "text",
            text: await waitForSelector(
              params.selector,
              params.session_id,
              params.state,
              params.timeout
            )
          }]
        };

      case "browser_wait_for_navigation":
        return {
          content: [{
            type: "text",
            text: await waitForNavigation(
              params.session_id,
              params.wait_until,
              params.timeout
            )
          }]
        };

      case "browser_wait_for_timeout":
        return {
          content: [{
            type: "text",
            text: await waitForTimeout(params.milliseconds, params.session_id)
          }]
        };

      case "browser_wait_for_function":
        return {
          content: [{
            type: "text",
            text: await waitForFunction(
              params.expression,
              params.session_id,
              params.timeout
            )
          }]
        };

      // JavaScript Evaluation
      case "browser_evaluate":
        return {
          content: [{
            type: "text",
            text: await evaluate(params.expression, params.session_id)
          }]
        };

      // Cookies & Storage
      case "browser_set_cookies":
        return {
          content: [{
            type: "text",
            text: await setCookies(params.cookies, params.session_id)
          }]
        };

      case "browser_get_cookies":
        return {
          content: [{
            type: "text",
            text: await getCookies(params.session_id, params.url)
          }]
        };

      case "browser_clear_cookies":
        return {
          content: [{
            type: "text",
            text: await clearCookies(params.session_id)
          }]
        };

      case "browser_save_storage":
        return {
          content: [{
            type: "text",
            text: await saveStorage(params.path, params.session_id)
          }]
        };

      case "browser_load_storage":
        return {
          content: [{
            type: "text",
            text: await loadStorage(params.path, params.session_id)
          }]
        };

      // Advanced Features
      case "browser_emulate_device":
        return {
          content: [{
            type: "text",
            text: await emulateDevice(params.device_name, params.session_id)
          }]
        };

      case "browser_set_geolocation":
        return {
          content: [{
            type: "text",
            text: await setGeolocation(
              params.latitude,
              params.longitude,
              params.session_id
            )
          }]
        };

      case "browser_set_user_agent":
        return {
          content: [{
            type: "text",
            text: await setUserAgent(params.user_agent, params.session_id)
          }]
        };

      case "browser_block_resources":
        return {
          content: [{
            type: "text",
            text: await blockResources(params.resource_types, params.session_id)
          }]
        };

      case "browser_get_console_logs":
        return {
          content: [{
            type: "text",
            text: await getConsoleLogs(params.session_id, params.clear)
          }]
        };

      case "browser_get_network_logs":
        return {
          content: [{
            type: "text",
            text: await getNetworkLogs(params.session_id, params.clear)
          }]
        };

      case "browser_intercept_request":
        return {
          content: [{
            type: "text",
            text: await interceptRequest(
              params.url_pattern,
              params.action,
              params.session_id,
              params.modifications
            )
          }]
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
});

// Cleanup on exit
process.on('SIGINT', async () => {
  console.error('\n🔥 WebPhoenix shutting down...');
  for (const [sessionId] of sessions) {
    await closeContext(sessionId);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('\n🔥 WebPhoenix shutting down...');
  for (const [sessionId] of sessions) {
    await closeContext(sessionId);
  }
  process.exit(0);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🔥 WebPhoenix MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
