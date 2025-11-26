# DevAssist AI - Chrome Extension

> 🤖 Autonomous AI Coding Assistant with Agentic Workflows

DevAssist is a Chrome extension that brings powerful AI capabilities directly into your browser with autonomous agents that can execute complex multi-step workflows.

## 🌟 Features

### Core Features (V1)

- **🤖 Autonomous Agents** - Execute complex workflows automatically
  - PR Reviewer: Analyze pull requests for security, quality, performance
  - Bug Investigator: Debug stack traces and find solutions
  - Doc Navigator: Search and summarize technical documentation

- **💬 Multi-AI Chat** - Access multiple models in one interface
  - GPT-4o, Claude 3.5, Gemini 2.0, DeepSeek
  - Side-by-side model comparison
  - Context-aware responses

- **⚡ Smart Code Toolbar** - Quick actions on selected code
  - Explain, Optimize, Debug, Refactor, Generate Tests

- **🔗 GitHub Deep Integration**
  - One-click PR analysis
  - Auto-review comments
  - Security vulnerability detection

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Chrome/Edge browser

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/devassist-extension.git
cd devassist-extension

# Install dependencies
pnpm install

# Build extension
pnpm build

# For development (with watch mode)
pnpm dev
```

### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder from the project

### First Use

1. Click the DevAssist icon in your toolbar
2. Sign in with GitHub (optional but recommended)
3. Press `Cmd/Ctrl + Shift + K` to open the sidebar
4. Start chatting or visit a GitHub PR to try the PR analyzer!

## 🛠️ Development

### Project Structure

```
devassist-extension/
├── src/
│   ├── background/          # Service worker
│   ├── content/            # Content scripts
│   │   ├── sidebar/       # Main chat interface
│   │   ├── toolbar/       # Code toolbar
│   │   └── integrations/  # GitHub, StackOverflow, etc.
│   ├── popup/             # Extension popup
│   ├── sidepanel/         # Chrome sidepanel
│   └── shared/            # Shared utilities & types
├── manifest.json          # Extension manifest
├── vite.config.ts        # Build configuration
└── package.json
```

### Available Scripts

```bash
# Development
pnpm dev              # Build with watch mode
pnpm build            # Production build
pnpm build:prod       # Optimized production build

# Testing
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests

# Code Quality
pnpm lint             # Lint code
pnpm type-check       # TypeScript type checking
```

### Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Testing**: Vitest + Playwright

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000
VITE_ENV=development
```

### Extension Settings

Settings can be configured via the popup or programmatically:

```typescript
await chrome.storage.sync.set({
  defaultModel: 'gpt-4o',
  theme: 'dark',
  privacyMode: 'balanced'
});
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing patterns and conventions
- Add comments for complex logic
- Write tests for new features

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: https://devassist.ai
- **Documentation**: https://docs.devassist.ai
- **Discord**: https://discord.gg/devassist
- **Twitter**: [@devassist_ai](https://twitter.com/devassist_ai)

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Powered by [OpenAI](https://openai.com/), [Anthropic](https://anthropic.com/), and [Google](https://deepmind.google/technologies/gemini/)
- Inspired by the developer community

---

**Made with ❤️ for developers, by developers**
