# 🔥 WebPhoenix MCP - Advanced Browser Automation for AI Autonomy

**WebPhoenix** is a comprehensive Model Context Protocol (MCP) server that provides AI agents with full browser automation capabilities using Playwright. It enables autonomous web navigation, interaction, data extraction, and complex workflow execution.

## ✨ Features

### 🌐 Core Navigation
- Navigate to URLs with customizable wait conditions
- Browser history navigation (back/forward)
- Page reload and viewport management
- URL and title extraction

### 🎯 Element Interaction
- Click, type, and keyboard interactions
- Form field manipulation (input, select, checkbox, radio)
- Hover effects and drag-and-drop
- File uploads
- Multi-element selection

### 📝 Intelligent Form Filling
- Auto-fill forms with multiple fields
- Optional automatic form submission
- Smart field detection and population

### 📊 Data Extraction
- Extract text, attributes, and HTML content
- Bulk extraction from multiple elements
- Get all links with text and URLs
- Get all images with src and alt text
- Custom element queries

### 📸 Capture & Export
- Full-page and element-specific screenshots
- PDF generation with custom formatting
- High-quality capture options

### ⏱️ Robustness & Waiting
- Wait for elements (visible/hidden/attached/detached)
- Wait for navigation completion
- Wait for custom JavaScript conditions
- Smart timeout handling

### 🔐 Session Management
- Multiple isolated browser contexts
- Cookie and storage state management
- Save/load session states
- Headless and headed modes

### 🚀 Advanced Features
- **Device Emulation**: Simulate mobile devices (iPhone, iPad, Pixel, etc.)
- **Geolocation**: Set custom GPS coordinates
- **User Agent**: Custom user agent strings
- **Resource Blocking**: Block images, CSS, scripts for faster browsing
- **Console Logs**: Capture browser console output
- **Network Logs**: Monitor all network requests
- **Request Interception**: Block or modify network requests
- **JavaScript Evaluation**: Execute custom JS in page context

## 📦 Installation

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn

### Setup

```bash
cd WebPhoenix-MCP
npm install
npm run build
```

### Install Playwright Browsers

```bash
npx playwright install chromium
```

## 🔧 Configuration

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "webphoenix": {
      "command": "node",
      "args": [
        "/absolute/path/to/WebPhoenix-MCP/dist/index.js"
      ]
    }
  }
}
```

### Environment Variables (Optional)

```bash
# Set default headless mode
WEBPHOENIX_HEADLESS=true

# Set default timeout
WEBPHOENIX_TIMEOUT=30000
```

## 🎮 Usage

### Basic Navigation Example

```typescript
// 1. Create a browser session
browser_create_context({
  session_id: "my_session",
  headless: true
})

// 2. Navigate to a website
browser_goto({
  url: "https://example.com",
  session_id: "my_session"
})

// 3. Extract data
browser_get_text({
  selector: "h1",
  session_id: "my_session"
})

// 4. Close session
browser_close_context({
  session_id: "my_session"
})
```

### Form Filling Example

```typescript
// Navigate to login page
browser_goto({
  url: "https://example.com/login",
  session_id: "my_session"
})

// Fill and submit login form
browser_fill_form({
  form_selector: "#login-form",
  fields: {
    "#username": "myuser",
    "#password": "mypassword"
  },
  submit: true,
  session_id: "my_session"
})

// Wait for dashboard
browser_wait_for_selector({
  selector: ".dashboard",
  state: "visible",
  session_id: "my_session"
})
```

### Mobile Device Emulation

```typescript
// Create session
browser_create_context({
  session_id: "mobile_session"
})

// Emulate iPhone
browser_emulate_device({
  device_name: "iPhone 13",
  session_id: "mobile_session"
})

// Navigate and interact
browser_goto({
  url: "https://example.com",
  session_id: "mobile_session"
})
```

### Data Scraping Example

```typescript
// Navigate to page
browser_goto({
  url: "https://news.ycombinator.com",
  session_id: "scrape_session"
})

// Get all article links
browser_get_links({
  selector: ".storylink",
  session_id: "scrape_session"
})

// Get page text content
browser_get_text({
  selector: ".storylink",
  all: true,
  session_id: "scrape_session"
})

// Take screenshot
browser_screenshot({
  path: "/tmp/hn_screenshot.png",
  full_page: true,
  session_id: "scrape_session"
})
```

### Advanced: Request Interception

```typescript
// Block analytics and ads
browser_block_resources({
  resource_types: ["image", "stylesheet", "font"],
  session_id: "fast_session"
})

// Or intercept specific URLs
browser_intercept_request({
  url_pattern: ".*analytics.*",
  action: "block",
  session_id: "fast_session"
})
```

### Session Persistence

```typescript
// Login and save session
browser_goto({
  url: "https://example.com/login",
  session_id: "persistent_session"
})

browser_fill_form({
  form_selector: "#login-form",
  fields: { /* ... */ },
  submit: true,
  session_id: "persistent_session"
})

// Save storage state
browser_save_storage({
  path: "/tmp/auth_state.json",
  session_id: "persistent_session"
})

// Later, restore session
browser_load_storage({
  path: "/tmp/auth_state.json",
  session_id: "restored_session"
})

// You're already logged in!
browser_goto({
  url: "https://example.com/dashboard",
  session_id: "restored_session"
})
```

## 🛠️ Available Tools

### Session Management
- `browser_create_context` - Create new browser session
- `browser_close_context` - Close browser session

### Navigation
- `browser_goto` - Navigate to URL
- `browser_back` - Go back in history
- `browser_forward` - Go forward in history
- `browser_reload` - Reload current page
- `browser_get_url` - Get current URL
- `browser_get_title` - Get page title
- `browser_set_viewport` - Set viewport size

### Element Interaction
- `browser_click` - Click element
- `browser_type` - Type text into element
- `browser_press` - Press keyboard key
- `browser_select_option` - Select dropdown option
- `browser_hover` - Hover over element
- `browser_check` - Check/uncheck checkbox
- `browser_drag_and_drop` - Drag and drop elements
- `browser_upload_file` - Upload files

### Form Handling
- `browser_fill_form` - Fill and submit forms

### Data Extraction
- `browser_get_text` - Extract text content
- `browser_get_attribute` - Extract element attributes
- `browser_get_html` - Extract HTML content
- `browser_get_links` - Extract all links
- `browser_get_images` - Extract all images

### Capture & Export
- `browser_screenshot` - Take screenshots
- `browser_save_pdf` - Save page as PDF

### Waiting & Timing
- `browser_wait_for_selector` - Wait for element
- `browser_wait_for_navigation` - Wait for navigation
- `browser_wait_for_timeout` - Wait for duration
- `browser_wait_for_function` - Wait for JS condition

### JavaScript
- `browser_evaluate` - Execute JavaScript

### Cookies & Storage
- `browser_set_cookies` - Set cookies
- `browser_get_cookies` - Get cookies
- `browser_clear_cookies` - Clear cookies
- `browser_save_storage` - Save session state
- `browser_load_storage` - Load session state

### Advanced
- `browser_emulate_device` - Emulate mobile devices
- `browser_set_geolocation` - Set GPS location
- `browser_set_user_agent` - Set user agent
- `browser_block_resources` - Block resource types
- `browser_get_console_logs` - Get console logs
- `browser_get_network_logs` - Get network logs
- `browser_intercept_request` - Intercept requests

## 🎯 Common Use Cases

### 1. Web Scraping
Extract data from websites with JavaScript-heavy content that regular HTTP clients can't handle.

### 2. Automated Testing
Test web applications by simulating real user interactions.

### 3. Form Automation
Automatically fill out forms, submit applications, and process workflows.

### 4. Mobile Testing
Test responsive designs by emulating various mobile devices.

### 5. Session Management
Maintain authenticated sessions across multiple operations.

### 6. Performance Analysis
Monitor network requests and console logs for debugging.

### 7. Content Generation
Take screenshots and generate PDFs for documentation.

## 🔒 Security & Best Practices

### Security Considerations
- Always validate URLs before navigation
- Be cautious with JavaScript evaluation
- Use headless mode for production environments
- Implement rate limiting for scraping tasks
- Respect robots.txt and website terms of service

### Performance Tips
- Close sessions when done to free resources
- Block unnecessary resources (images, fonts) for faster loading
- Use network idle wait for AJAX-heavy pages
- Implement proper timeout values
- Reuse sessions when possible

### Error Handling
- All tools return descriptive error messages
- Use try-catch patterns in your workflows
- Check for element existence before interaction
- Handle timeout errors gracefully

## 🐛 Troubleshooting

### Browser not launching
```bash
# Reinstall Playwright browsers
npx playwright install chromium --force
```

### Permission errors
```bash
# Ensure proper permissions
chmod +x dist/index.js
```

### Session not found errors
Always create a context before using other tools:
```typescript
browser_create_context({ session_id: "my_session" })
```

### Timeout errors
Increase timeout values for slow-loading pages:
```typescript
browser_goto({
  url: "https://slow-site.com",
  timeout: 60000  // 60 seconds
})
```

## 📚 Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [Playwright Documentation](https://playwright.dev)
- [CSS Selectors Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Built with [Playwright](https://playwright.dev)
- Powered by [Model Context Protocol](https://modelcontextprotocol.io)
- Created for the Skynet Depot project

---

**Made with 🔥 by Skynet Depot**

*Empowering AI agents with full browser autonomy*
