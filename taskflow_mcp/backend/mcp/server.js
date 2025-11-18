import express from 'express';
import cors from 'cors';
import { fetchGmailTasks } from './tools/gmail.js';
import { fetchGithubTasks } from './tools/github.js';
import { fetchTrelloTasks } from './tools/trello.js';
import { fetchNotionTasks } from './tools/notion.js';
import { fetchSlackTasks } from './tools/slack.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'TaskFlow MCP Server', version: '1.0.0' });
});

// Fetch tasks from a specific source
app.post('/fetch', async (req, res) => {
  try {
    const { source } = req.body;

    if (!source) {
      return res.status(400).json({ error: 'Source parameter is required' });
    }

    let tasks = [];

    switch (source.toLowerCase()) {
      case 'gmail':
        tasks = await fetchGmailTasks();
        break;
      case 'github':
        tasks = await fetchGithubTasks();
        break;
      case 'trello':
        tasks = await fetchTrelloTasks();
        break;
      case 'notion':
        tasks = await fetchNotionTasks();
        break;
      case 'slack':
        tasks = await fetchSlackTasks();
        break;
      default:
        return res.status(400).json({ error: `Unknown source: ${source}` });
    }

    res.json({ tasks });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch tasks from all sources
app.post('/fetch-all', async (req, res) => {
  try {
    console.log('📥 Fetching tasks from all sources...');

    const [gmail, github, trello, notion, slack] = await Promise.all([
      fetchGmailTasks(),
      fetchGithubTasks(),
      fetchTrelloTasks(),
      fetchNotionTasks(),
      fetchSlackTasks()
    ]);

    const allTasks = [
      ...gmail,
      ...github,
      ...trello,
      ...notion,
      ...slack
    ];

    console.log(`✅ Fetched ${allTasks.length} tasks total`);
    console.log(`  - Gmail: ${gmail.length}`);
    console.log(`  - GitHub: ${github.length}`);
    console.log(`  - Trello: ${trello.length}`);
    console.log(`  - Notion: ${notion.length}`);
    console.log(`  - Slack: ${slack.length}`);

    res.json({ tasks: allTasks });
  } catch (error) {
    console.error('Fetch-all error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TaskFlow MCP Server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   - POST /fetch       (fetch from specific source)`);
  console.log(`   - POST /fetch-all   (fetch from all sources)`);
  console.log(`   - GET  /health      (health check)`);
});
