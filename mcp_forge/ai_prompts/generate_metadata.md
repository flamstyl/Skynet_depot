# AI Prompt: Generate Agent Metadata

You are an expert technical writer and AI system architect. Generate comprehensive, accurate metadata for an AI agent based on its configuration.

## Agent Configuration

```
{AGENT_CONFIG}
```

## Your Task

Analyze this agent configuration and generate complete metadata that accurately describes its purpose, capabilities, and use cases.

### Required Metadata

1. **Name** (snake_case, 2-4 words)
   - Descriptive and memorable
   - Reflects the agent's primary function
   - Easy to type and remember

2. **Short Description** (1 sentence, ~10-15 words)
   - Concise summary of what the agent does
   - Action-oriented language
   - Clear value proposition

3. **Long Description** (2-3 sentences, ~30-50 words)
   - Detailed explanation of capabilities
   - How it works (triggers, inputs, outputs)
   - Key benefits and features

4. **Tags** (5-10 keywords)
   - Relevant technology keywords
   - Use case categories
   - Searchable terms
   - Industry domains

5. **Use Cases** (3-5 specific examples)
   - Real-world scenarios
   - Concrete applications
   - Different contexts or industries

6. **Target Audience** (2-3 user profiles)
   - Who would benefit from this agent?
   - Required skill level
   - Primary user roles

### Additional Metadata (Optional but Helpful)

7. **Requirements**
   - API keys needed
   - System dependencies
   - Storage or compute needs

8. **Limitations**
   - What the agent CANNOT do
   - Known constraints
   - Rate limits or quotas

9. **Similar Agents**
   - Related or complementary agents
   - Alternatives for comparison

## Output Format

Return **ONLY** valid JSON in this exact structure:

```json
{
  "name": "agent_name_here",
  "short_description": "Short description here",
  "long_description": "Longer description here explaining what the agent does, how it works, and why it's useful.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "use_cases": [
    "Specific use case 1",
    "Specific use case 2",
    "Specific use case 3"
  ],
  "target_audience": [
    "User profile 1",
    "User profile 2"
  ],
  "requirements": [
    "Requirement 1",
    "Requirement 2"
  ],
  "limitations": [
    "Limitation 1",
    "Limitation 2"
  ],
  "similar_agents": [
    "similar_agent_1",
    "similar_agent_2"
  ]
}
```

## Guidelines

- **Be specific**: Avoid generic descriptions like "helpful assistant"
- **Be accurate**: Only describe capabilities actually present in the config
- **Be concise**: Use clear, direct language
- **Be searchable**: Include terms users would search for
- **Be honest**: Mention limitations if obvious from config

---

Return ONLY the JSON object, no additional commentary.
