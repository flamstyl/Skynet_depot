# MCP Forge Usage Guide

## Quick Start

### 1. Installation

```bash
cd mcp_forge
pip install -r requirements.txt
```

### 2. Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
```

### 3. Start the Server

```bash
python run.py
```

Access the interface at: http://localhost:5002

## Building Your First Agent

### Using the Visual Builder

1. **Open the Builder Interface**
   - Navigate to http://localhost:5002/builder.html
   - You'll see the component library on the left

2. **Set Agent Details**
   - Enter agent name (e.g., "code-reviewer")
   - Add description
   - Select AI model (Claude, GPT-4, etc.)
   - Define the agent's role

3. **Add Components**
   - **Triggers**: Drag a trigger (cron, webhook, event) to the canvas
   - **Actions**: Add actions like AI calls, HTTP requests, file operations
   - **Conditions**: Add logic for branching and decision-making

4. **Configure Components**
   - Click on any component to edit its properties
   - Fill in required configuration fields
   - Set up retry logic for actions

5. **Define Instructions**
   - Enter clear, specific instructions in the right panel
   - One instruction per line
   - Be explicit about goals and constraints

6. **Test Your Agent**
   - Click "Preview" to see execution flow
   - Click "Dry Run" to simulate execution
   - Click "Validate" to get AI feedback

7. **Export Your Agent**
   - Choose format: YAML, JSON, n8n, or MCP
   - Download or deploy directly

## Using the API

### Create an Agent

```bash
curl -X POST http://localhost:5002/api/agents/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-agent",
    "description": "My custom agent",
    "model": "claude-3-5-sonnet-20241022",
    "role": "Assistant",
    "instructions": [
      "You are a helpful assistant",
      "Always be clear and concise"
    ]
  }'
```

### Add a Trigger

```bash
curl -X POST http://localhost:5002/api/agents/1/triggers \
  -H "Content-Type: application/json" \
  -d '{
    "type": "time",
    "config": {
      "schedule": "0 */1 * * *",
      "timezone": "UTC"
    }
  }'
```

### Add an Action

```bash
curl -X POST http://localhost:5002/api/agents/1/actions \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ai_call",
    "name": "analyze_data",
    "config": {
      "model": "claude-3-5-sonnet-20241022",
      "max_tokens": 2048,
      "temperature": 0.7
    }
  }'
```

### Export Agent

```bash
# Export as YAML
curl http://localhost:5002/api/export/1/yaml

# Export as n8n workflow
curl http://localhost:5002/api/export/1/n8n

# Download file
curl -O http://localhost:5002/api/export/1/download/yaml
```

### Validate with AI

```bash
curl -X POST http://localhost:5002/api/validation/1/validate \
  -H "Content-Type: application/json" \
  -d '{"validator": "claude"}'
```

### Dry Run Test

```bash
curl -X POST http://localhost:5002/api/builder/dry-run/1 \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "test": "data"
    }
  }'
```

## Agent Examples

### Code Reviewer

See `examples/code_reviewer_agent.yaml`

**Use Case**: Automatically review pull requests
- Trigger: GitHub webhook
- Actions: AI code analysis, post comments
- Conditions: Approve or request changes based on score

### Data Analyzer

See `examples/data_analyzer_agent.yaml`

**Use Case**: Analyze business metrics every 6 hours
- Trigger: Cron schedule
- Actions: Fetch data, analyze trends, send reports
- Conditions: Alert on anomalies

### Customer Support

**Use Case**: Handle customer inquiries
- Trigger: Webhook from support system
- Actions: Generate AI response, log ticket
- Conditions: Escalate complex issues

## Component Types

### Triggers

- **time**: Cron-based scheduling
- **webhook**: HTTP endpoint
- **event**: System events
- **manual**: On-demand execution
- **file_watch**: File system monitoring

### Actions

- **ai_call**: Call Claude, GPT, or other AI models
- **http_request**: Make HTTP requests
- **database**: Database operations
- **file_ops**: Read/write files
- **email**: Send emails
- **slack**: Post to Slack

### Conditions

- **if_else**: Binary branching
- **switch**: Multi-way branching
- **filter**: Array filtering
- **loop**: Iteration
- **rate_limit**: Throttling

## Best Practices

### Instructions

1. **Be Specific**: Define clear goals and constraints
2. **Use Examples**: Show desired behavior
3. **Set Boundaries**: Specify what NOT to do
4. **Define Role**: Give the agent context and persona

### Model Selection

- **Claude 3.5 Sonnet**: Best for complex reasoning, code, analysis
- **Claude 3 Opus**: Most capable, expensive
- **GPT-4 Turbo**: Good general-purpose model
- **GPT-3.5 Turbo**: Fast, cheap, simple tasks

### Error Handling

- Always configure retry logic for actions
- Set reasonable timeouts
- Add fallback branches in conditions
- Log execution results

### Security

- Use environment variables for API keys
- Validate webhook payloads
- Implement authentication
- Rate limit public endpoints
- Sanitize inputs

### Performance

- Optimize prompt length
- Use caching where possible
- Set appropriate timeouts
- Monitor execution metrics

## Deployment

### n8n Integration

1. Export agent as n8n workflow
2. Import into n8n
3. Configure credentials
4. Activate workflow

### MCP Protocol

1. Export as MCP config
2. Deploy to MCP-compatible server
3. Configure integrations
4. Start agent

### Standalone

1. Export as YAML/JSON
2. Implement custom executor
3. Deploy to your infrastructure

## Troubleshooting

### Agent Not Saving

- Check all required fields are filled
- Ensure model is selected
- Verify API connectivity

### Validation Failing

- Check API keys are configured
- Ensure ANTHROPIC_API_KEY or OPENAI_API_KEY is set
- Verify network connectivity

### Dry Run Errors

- Review agent configuration
- Check trigger setup
- Validate action configurations

### Export Issues

- Ensure agent is saved first
- Check export directory permissions
- Verify format is supported

## API Reference

Full API documentation available at:
- Swagger UI: http://localhost:5002/api/docs (if enabled)
- Agent endpoints: `/api/agents`
- Builder endpoints: `/api/builder`
- Export endpoints: `/api/export`
- Validation endpoints: `/api/validation`

## Support

For issues or questions:
- GitHub: https://github.com/flamstyl/Skynet_depot
- Documentation: See README.md
