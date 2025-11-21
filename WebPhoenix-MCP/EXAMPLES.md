# 🎯 WebPhoenix MCP - Practical Examples

Real-world examples to get you started with WebPhoenix automation.

## 📋 Table of Contents

1. [Basic Navigation](#basic-navigation)
2. [Form Automation](#form-automation)
3. [Web Scraping](#web-scraping)
4. [Authentication & Sessions](#authentication--sessions)
5. [Mobile Testing](#mobile-testing)
6. [Advanced Scenarios](#advanced-scenarios)

---

## Basic Navigation

### Example 1: Simple Page Visit

```typescript
// Create a session
browser_create_context({
  session_id: "demo"
})

// Navigate to a page
browser_goto({
  url: "https://example.com",
  session_id: "demo"
})

// Get the page title
browser_get_title({
  session_id: "demo"
})
// Returns: "Example Domain"

// Get the main heading
browser_get_text({
  selector: "h1",
  session_id: "demo"
})
// Returns: "Example Domain"

// Close the session
browser_close_context({
  session_id: "demo"
})
```

### Example 2: Multi-Page Navigation

```typescript
// Create session
browser_create_context({ session_id: "nav" })

// Visit first page
browser_goto({
  url: "https://github.com",
  session_id: "nav"
})

// Click on a link
browser_click({
  selector: "a[href='/pricing']",
  session_id: "nav"
})

// Wait for navigation
browser_wait_for_navigation({
  session_id: "nav"
})

// Verify we're on the pricing page
browser_get_url({ session_id: "nav" })
// Returns: "https://github.com/pricing"

// Go back
browser_back({ session_id: "nav" })

// Verify we're back on the homepage
browser_get_url({ session_id: "nav" })
```

---

## Form Automation

### Example 3: Simple Form Filling

```typescript
// Create and navigate
browser_create_context({ session_id: "form_demo" })
browser_goto({
  url: "https://httpbin.org/forms/post",
  session_id: "form_demo"
})

// Fill the form
browser_fill_form({
  form_selector: "form",
  fields: {
    "input[name='custname']": "John Doe",
    "input[name='custtel']": "555-1234",
    "input[name='custemail']": "john@example.com",
    "input[name='size'][value='large']": "large",
    "textarea[name='comments']": "This is a test comment"
  },
  submit: true,
  session_id: "form_demo"
})

// Get the response
browser_get_text({
  selector: "body",
  session_id: "form_demo"
})
```

### Example 4: Advanced Form with Multiple Field Types

```typescript
browser_create_context({ session_id: "complex_form" })
browser_goto({
  url: "https://example.com/registration",
  session_id: "complex_form"
})

// Fill text inputs
browser_type({
  selector: "#username",
  text: "johndoe123",
  session_id: "complex_form"
})

browser_type({
  selector: "#email",
  text: "john@example.com",
  session_id: "complex_form"
})

// Select from dropdown
browser_select_option({
  selector: "#country",
  values: "United States",
  session_id: "complex_form"
})

// Check checkbox
browser_check({
  selector: "#terms",
  checked: true,
  session_id: "complex_form"
})

// Check radio button
browser_click({
  selector: "input[type='radio'][value='male']",
  session_id: "complex_form"
})

// Upload file
browser_upload_file({
  selector: "#avatar",
  file_paths: "/path/to/avatar.png",
  session_id: "complex_form"
})

// Submit
browser_click({
  selector: "button[type='submit']",
  session_id: "complex_form"
})

// Wait for success message
browser_wait_for_selector({
  selector: ".success-message",
  session_id: "complex_form"
})
```

---

## Web Scraping

### Example 5: Scrape Product Listings

```typescript
// Create session with performance optimizations
browser_create_context({ session_id: "scraper" })

// Block unnecessary resources
browser_block_resources({
  resource_types: ["image", "stylesheet", "font"],
  session_id: "scraper"
})

// Navigate to product page
browser_goto({
  url: "https://example.com/products",
  wait_until: "domcontentloaded",
  session_id: "scraper"
})

// Extract product names
const names = browser_get_text({
  selector: ".product-name",
  all: true,
  session_id: "scraper"
})

// Extract product prices
const prices = browser_get_text({
  selector: ".product-price",
  all: true,
  session_id: "scraper"
})

// Extract product links
const links = browser_get_attribute({
  selector: ".product-link",
  attribute_name: "href",
  all: true,
  session_id: "scraper"
})

// Get all images
const images = browser_get_images({
  selector: ".product-image",
  session_id: "scraper"
})
```

### Example 6: Scrape News Headlines

```typescript
browser_create_context({ session_id: "news" })

browser_goto({
  url: "https://news.ycombinator.com",
  session_id: "news"
})

// Get all story links with their text
const headlines = browser_get_links({
  selector: ".storylink",
  session_id: "news"
})

// Parse the JSON response
// [
//   { "href": "https://...", "text": "Article Title 1" },
//   { "href": "https://...", "text": "Article Title 2" },
//   ...
// ]

// Get points for each story
const points = browser_get_text({
  selector: ".score",
  all: true,
  session_id: "news"
})

// Save screenshot
browser_screenshot({
  path: "/tmp/hackernews.png",
  full_page: true,
  session_id: "news"
})
```

### Example 7: Dynamic Content Scraping

```typescript
browser_create_context({ session_id: "dynamic" })
browser_goto({
  url: "https://example.com/infinite-scroll",
  session_id: "dynamic"
})

// Scroll to load more content
browser_evaluate({
  expression: "window.scrollTo(0, document.body.scrollHeight)",
  session_id: "dynamic"
})

// Wait for new items to load
browser_wait_for_function({
  expression: "document.querySelectorAll('.item').length > 20",
  timeout: 10000,
  session_id: "dynamic"
})

// Extract all items
const items = browser_get_text({
  selector: ".item",
  all: true,
  session_id: "dynamic"
})
```

---

## Authentication & Sessions

### Example 8: Login and Save Session

```typescript
// Create session
browser_create_context({ session_id: "auth" })

// Navigate to login
browser_goto({
  url: "https://example.com/login",
  session_id: "auth"
})

// Fill login form
browser_fill_form({
  form_selector: "#login-form",
  fields: {
    "#username": "myuser",
    "#password": "mypassword"
  },
  submit: true,
  session_id: "auth"
})

// Wait for dashboard
browser_wait_for_selector({
  selector: ".dashboard",
  timeout: 10000,
  session_id: "auth"
})

// Save authenticated state
browser_save_storage({
  path: "/tmp/auth_state.json",
  session_id: "auth"
})

// Now you can close and restore later
browser_close_context({ session_id: "auth" })
```

### Example 9: Restore Saved Session

```typescript
// Load the saved auth state
browser_load_storage({
  path: "/tmp/auth_state.json",
  session_id: "restored"
})

// You're already logged in!
browser_goto({
  url: "https://example.com/dashboard",
  session_id: "restored"
})

// Access protected content
browser_get_text({
  selector: ".user-welcome",
  session_id: "restored"
})
// Returns: "Welcome back, myuser!"
```

### Example 10: Cookie Management

```typescript
browser_create_context({ session_id: "cookies" })

// Set custom cookies
browser_set_cookies({
  cookies: [
    {
      name: "session_id",
      value: "abc123",
      domain: "example.com",
      path: "/"
    },
    {
      name: "preferences",
      value: "dark_mode",
      domain: "example.com",
      path: "/"
    }
  ],
  session_id: "cookies"
})

// Navigate with cookies
browser_goto({
  url: "https://example.com",
  session_id: "cookies"
})

// Get all cookies
const cookies = browser_get_cookies({
  session_id: "cookies"
})

// Clear cookies
browser_clear_cookies({ session_id: "cookies" })
```

---

## Mobile Testing

### Example 11: Test on Multiple Devices

```typescript
// iPhone Test
browser_create_context({ session_id: "iphone" })
browser_emulate_device({
  device_name: "iPhone 13",
  session_id: "iphone"
})

browser_goto({
  url: "https://example.com",
  session_id: "iphone"
})

browser_screenshot({
  path: "/tmp/iphone13.png",
  full_page: true,
  session_id: "iphone"
})

// iPad Test
browser_create_context({ session_id: "ipad" })
browser_emulate_device({
  device_name: "iPad Pro",
  session_id: "ipad"
})

browser_goto({
  url: "https://example.com",
  session_id: "ipad"
})

browser_screenshot({
  path: "/tmp/ipad.png",
  full_page: true,
  session_id: "ipad"
})

// Android Test
browser_create_context({ session_id: "android" })
browser_emulate_device({
  device_name: "Pixel 5",
  session_id: "android"
})

browser_goto({
  url: "https://example.com",
  session_id: "android"
})

browser_screenshot({
  path: "/tmp/pixel5.png",
  full_page: true,
  session_id: "android"
})
```

### Example 12: Mobile Geolocation Testing

```typescript
browser_create_context({ session_id: "geo" })
browser_emulate_device({
  device_name: "iPhone 13",
  session_id: "geo"
})

// Set location to Paris
browser_set_geolocation({
  latitude: 48.8566,
  longitude: 2.3522,
  session_id: "geo"
})

browser_goto({
  url: "https://maps.google.com",
  session_id: "geo"
})

// The map should center on Paris
browser_screenshot({
  path: "/tmp/paris_location.png",
  session_id: "geo"
})
```

---

## Advanced Scenarios

### Example 13: Network Request Interception

```typescript
browser_create_context({ session_id: "intercept" })

// Block analytics
browser_intercept_request({
  url_pattern: ".*google-analytics.*",
  action: "block",
  session_id: "intercept"
})

// Block ads
browser_intercept_request({
  url_pattern: ".*doubleclick.*",
  action: "block",
  session_id: "intercept"
})

browser_goto({
  url: "https://example.com",
  session_id: "intercept"
})

// Check what was loaded
const networkLogs = browser_get_network_logs({
  session_id: "intercept"
})
```

### Example 14: JavaScript Execution

```typescript
browser_create_context({ session_id: "js" })
browser_goto({
  url: "https://example.com",
  session_id: "js"
})

// Get custom data from the page
const data = browser_evaluate({
  expression: `
    ({
      title: document.title,
      links: Array.from(document.querySelectorAll('a')).length,
      images: Array.from(document.querySelectorAll('img')).length,
      scripts: Array.from(document.querySelectorAll('script')).length
    })
  `,
  session_id: "js"
})

// Returns:
// {
//   "title": "Example Domain",
//   "links": 1,
//   "images": 0,
//   "scripts": 0
// }

// Manipulate the page
browser_evaluate({
  expression: `
    document.body.style.backgroundColor = 'lightblue';
    document.querySelector('h1').style.color = 'red';
  `,
  session_id: "js"
})

browser_screenshot({
  path: "/tmp/modified_page.png",
  session_id: "js"
})
```

### Example 15: PDF Generation with Custom Styling

```typescript
browser_create_context({ session_id: "pdf" })
browser_goto({
  url: "https://en.wikipedia.org/wiki/Web_scraping",
  session_id: "pdf"
})

// Remove navigation and sidebars for cleaner PDF
browser_evaluate({
  expression: `
    document.querySelector('#mw-navigation')?.remove();
    document.querySelector('#footer')?.remove();
    document.querySelector('.vector-toc')?.remove();
  `,
  session_id: "pdf"
})

// Generate PDF
browser_save_pdf({
  path: "/tmp/web_scraping_article.pdf",
  format: "A4",
  print_background: true,
  session_id: "pdf"
})
```

### Example 16: Monitoring & Debugging

```typescript
browser_create_context({ session_id: "debug" })

browser_goto({
  url: "https://example.com/app",
  session_id: "debug"
})

// Click something that might cause errors
browser_click({
  selector: "#buggy-button",
  session_id: "debug"
})

// Check console for errors
const consoleLogs = browser_get_console_logs({
  session_id: "debug"
})

// Check network requests
const networkLogs = browser_get_network_logs({
  session_id: "debug"
})

// Take screenshot of error state
browser_screenshot({
  path: "/tmp/error_state.png",
  session_id: "debug"
})

// Get page HTML for analysis
const html = browser_get_html({
  session_id: "debug"
})
```

### Example 17: Automated Testing Workflow

```typescript
// Test user registration flow
browser_create_context({ session_id: "test" })

// Step 1: Navigate to signup
browser_goto({
  url: "https://example.com/signup",
  session_id: "test"
})

browser_screenshot({
  path: "/tmp/test_step1_signup.png",
  session_id: "test"
})

// Step 2: Fill form
browser_fill_form({
  form_selector: "#signup-form",
  fields: {
    "#email": "test@example.com",
    "#password": "TestPass123!",
    "#confirm-password": "TestPass123!"
  },
  submit: true,
  session_id: "test"
})

// Step 3: Verify success
browser_wait_for_selector({
  selector: ".success-message",
  timeout: 5000,
  session_id: "test"
})

browser_screenshot({
  path: "/tmp/test_step2_success.png",
  session_id: "test"
})

const successMessage = browser_get_text({
  selector: ".success-message",
  session_id: "test"
})

// Assert message contains expected text
// if (!successMessage.includes("Account created")) throw new Error("Test failed")
```

### Example 18: Drag and Drop

```typescript
browser_create_context({ session_id: "dragdrop" })
browser_goto({
  url: "https://example.com/drag-drop-demo",
  session_id: "dragdrop"
})

// Drag item from source to target
browser_drag_and_drop({
  source_selector: "#draggable-item",
  target_selector: "#drop-zone",
  session_id: "dragdrop"
})

// Verify the drop
browser_wait_for_selector({
  selector: "#drop-zone .dropped-item",
  session_id: "dragdrop"
})

browser_screenshot({
  path: "/tmp/after_drop.png",
  session_id: "dragdrop"
})
```

---

## 💡 Tips & Best Practices

### 1. Always Create Context First
Every workflow should start with `browser_create_context`

### 2. Use Meaningful Session IDs
Instead of "session1", use "login_flow" or "price_scraper"

### 3. Wait for Dynamic Content
Use `browser_wait_for_selector` or `browser_wait_for_function` for AJAX content

### 4. Optimize for Speed
Block images and CSS when you don't need them

### 5. Handle Errors Gracefully
Always have a plan B if an element isn't found

### 6. Take Screenshots for Debugging
Screenshots help you see what the browser actually sees

### 7. Clean Up Sessions
Always close contexts when done to free resources

### 8. Use Specific Selectors
More specific selectors are more reliable

### 9. Leverage JavaScript Evaluation
For complex operations, JavaScript might be faster

### 10. Save Session States
For authenticated workflows, save and reuse session states

---

## 🎓 Learning Resources

- Start with Examples 1-4 (Basics)
- Move to Examples 5-7 (Scraping)
- Master Examples 8-10 (Authentication)
- Experiment with Examples 11-18 (Advanced)

Happy automating! 🔥
