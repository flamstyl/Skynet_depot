# 🚀 WebPhoenix MCP - QuickStart Guide

Get up and running with WebPhoenix in 5 minutes!

## ⚡ Quick Installation

```bash
cd WebPhoenix-MCP
npm install
npm run build
npx playwright install chromium
```

## 🔌 Connect to Claude Desktop

1. Find your Claude config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Add WebPhoenix to your config:

```json
{
  "mcpServers": {
    "webphoenix": {
      "command": "node",
      "args": [
        "/FULL/PATH/TO/WebPhoenix-MCP/dist/index.js"
      ]
    }
  }
}
```

3. Restart Claude Desktop

4. Look for the 🔧 icon - you should see 40+ WebPhoenix tools available!

## 🎯 Your First Browser Automation

Try these commands in Claude:

### Example 1: Simple Navigation

```
Use WebPhoenix to:
1. Create a browser session called "test"
2. Go to https://example.com
3. Get the page title
4. Take a screenshot and save it to /tmp/example.png
5. Close the session
```

### Example 2: Form Interaction

```
Use WebPhoenix to:
1. Create a session
2. Go to https://httpbin.org/forms/post
3. Fill the form with some test data
4. Submit it
5. Get the response text
```

### Example 3: Data Extraction

```
Use WebPhoenix to:
1. Navigate to https://news.ycombinator.com
2. Extract all article titles and links
3. Save the results as JSON
```

### Example 4: Mobile Emulation

```
Use WebPhoenix to:
1. Create a session
2. Emulate an iPhone 13
3. Visit https://example.com
4. Take a mobile screenshot
```

## 🎨 Common Patterns

### Pattern 1: Login Workflow

```
1. Create session "login_session"
2. Go to login page
3. Fill form with credentials
4. Submit and wait for dashboard
5. Save storage state to /tmp/auth.json
```

### Pattern 2: Web Scraping

```
1. Create session "scrape_session"
2. Block images and CSS for faster loading
3. Navigate to target site
4. Extract data using selectors
5. Save results
```

### Pattern 3: Testing Workflow

```
1. Create session "test_session"
2. Navigate to your app
3. Click through user flow
4. Take screenshots at each step
5. Verify expected elements exist
```

## 🔥 Pro Tips

### 1. Use Specific Selectors
```
Good: "#submit-button"
Better: "form#login button[type='submit']"
```

### 2. Wait for Dynamic Content
```
After clicking, always wait:
- browser_wait_for_selector for elements
- browser_wait_for_navigation for page loads
- browser_wait_for_function for custom conditions
```

### 3. Handle Errors Gracefully
```
If a selector doesn't work:
- Check if page has loaded
- Try waiting for the element first
- Use browser_get_html to inspect the page
- Use browser_screenshot to see what's visible
```

### 4. Optimize Performance
```
For faster browsing:
- Block unnecessary resources (images, fonts, CSS)
- Use 'domcontentloaded' instead of 'load' when possible
- Keep sessions alive for multiple operations
```

### 5. Debug Like a Pro
```
When things go wrong:
- browser_get_console_logs to see JS errors
- browser_get_network_logs to check requests
- browser_screenshot to see current state
- browser_get_html to inspect page source
```

## 🎪 Advanced Examples

### Multi-Step Workflow

```
Use WebPhoenix to automate this workflow:

1. Create session "workflow"
2. Go to https://example.com/signup
3. Fill registration form:
   - Email: test@example.com
   - Password: SecurePass123
   - Name: Test User
4. Submit form
5. Wait for confirmation page
6. Get confirmation message text
7. Save screenshot as /tmp/confirmed.png
8. Save session to /tmp/registered.json
9. Close session
```

### Mobile Testing Suite

```
Test the mobile experience:

1. Create session "mobile_test"
2. Emulate iPhone 13
3. Go to https://example.com
4. Take screenshot: /tmp/iphone13.png
5. Emulate iPad Pro
6. Go to https://example.com
7. Take screenshot: /tmp/ipad.png
8. Compare layouts
```

### Data Mining Pipeline

```
Extract structured data:

1. Create session "mining" with blocked images
2. Navigate to product listing page
3. Get all product links
4. For each product:
   - Navigate to product page
   - Extract title, price, description
   - Save to JSON
5. Generate PDF report
```

## 🛠️ Tool Categories Cheat Sheet

| Category | Key Tools | Use For |
|----------|-----------|---------|
| **Setup** | `browser_create_context` | Starting sessions |
| **Navigation** | `browser_goto`, `browser_back` | Moving around |
| **Interaction** | `browser_click`, `browser_type` | User actions |
| **Forms** | `browser_fill_form` | Quick form filling |
| **Extraction** | `browser_get_text`, `browser_get_links` | Getting data |
| **Waiting** | `browser_wait_for_selector` | Handling async |
| **Capture** | `browser_screenshot`, `browser_save_pdf` | Saving content |
| **Advanced** | `browser_emulate_device`, `browser_intercept_request` | Complex scenarios |

## 🐛 Common Issues & Solutions

### Issue: "Session not found"
**Solution**: Always create a context first:
```
browser_create_context({ session_id: "my_session" })
```

### Issue: "Element not found"
**Solution**: Wait for it to appear:
```
browser_wait_for_selector({
  selector: "#my-element",
  timeout: 10000
})
```

### Issue: "Timeout waiting for navigation"
**Solution**: Increase timeout or use different wait condition:
```
browser_goto({
  url: "...",
  wait_until: "domcontentloaded",
  timeout: 60000
})
```

### Issue: Page loads too slowly
**Solution**: Block unnecessary resources:
```
browser_block_resources({
  resource_types: ["image", "stylesheet", "font"]
})
```

## 📊 Real-World Use Cases

### 1. Newsletter Signup Bot
Automatically sign up for newsletters and track confirmations.

### 2. Price Monitor
Check product prices across multiple sites and alert on changes.

### 3. Form Submission Service
Auto-fill and submit forms with varying data.

### 4. Website Health Check
Navigate through critical pages and verify they load correctly.

### 5. Screenshot Generator
Generate screenshots of web pages for documentation.

### 6. Login Session Manager
Maintain authenticated sessions for API testing.

### 7. Mobile UX Tester
Test how your site looks on different devices.

## 🎓 Learning Path

### Week 1: Basics
- Create sessions
- Navigate pages
- Click and type
- Extract simple data

### Week 2: Intermediate
- Fill complex forms
- Handle waits properly
- Take screenshots
- Manage cookies

### Week 3: Advanced
- Device emulation
- Request interception
- JavaScript evaluation
- Session persistence

### Week 4: Expert
- Build complete workflows
- Optimize performance
- Handle edge cases
- Debug like a pro

## 🎉 You're Ready!

You now have everything you need to start automating the web with WebPhoenix!

**Next Steps:**
1. Try the examples above
2. Read the full README for detailed docs
3. Experiment with different websites
4. Build your own automation workflows

**Need Help?**
- Check the README.md for complete documentation
- Review tool descriptions in Claude
- Experiment with simple tasks first

---

**Happy Automating! 🔥**

Made with ❤️ for the AI community
