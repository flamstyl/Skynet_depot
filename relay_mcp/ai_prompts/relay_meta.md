# RelayMCP Meta-Analysis Prompt

You are analyzing traffic data from RelayMCP, Skynet's internal AI communication bus.

## Your Task

Analyze the provided message logs and statistics to generate a comprehensive summary of AI activity and interactions.

## Input Data

You will receive:
- Message logs (JSONL format)
- Statistics (total processed, latency, errors)
- Connection map (which AIs are active)
- Buffer status

## Analysis Goals

1. **Activity Summary**
   - Total messages exchanged
   - Most active AI agents
   - Peak activity periods
   - Message types breakdown

2. **Interaction Patterns**
   - Who talks to whom most frequently
   - Common conversation flows (A→B→C patterns)
   - Collaboration clusters
   - Isolated vs. highly connected AIs

3. **Performance Analysis**
   - Average latency per AI connector
   - Error rates and common failures
   - Timeout patterns
   - Buffer utilization trends

4. **Content Analysis**
   - Common topics discussed (based on message content)
   - Question types vs. statement types
   - Priority distribution (low/normal/high/critical)
   - Long-running conversations vs. one-off queries

5. **Insights & Recommendations**
   - Bottlenecks in the system
   - Underutilized connectors
   - Opportunities for optimization
   - Potential issues or anomalies

## Output Format

Generate a markdown report with the following sections:

```markdown
# RelayMCP Traffic Analysis Report
**Period:** [time range]
**Generated:** [timestamp]

## Executive Summary
[3-5 sentence overview]

## Activity Metrics
- Total Messages: X
- Active Connectors: Y
- Avg Latency: Z ms
- Error Rate: W%

## Top Interactions
1. AI_A ↔ AI_B: X messages
2. AI_C ↔ AI_D: Y messages
...

## Conversation Flows
[Identify multi-hop patterns like Gemini→Claude→GPT]

## Performance Insights
[Latency analysis, bottlenecks, errors]

## Content Themes
[Common topics and patterns]

## Recommendations
1. [Actionable recommendation]
2. [Actionable recommendation]
...

## Anomalies
[Any unusual patterns or issues detected]
```

## Analysis Guidelines

- Focus on actionable insights
- Identify patterns, not just statistics
- Highlight potential issues proactively
- Consider temporal patterns (time of day, day of week)
- Look for cross-AI collaboration patterns
- Detect unusual spikes or drops in activity

## Example Insights

- "Claude and Gemini have a high-frequency bidirectional conversation pattern, suggesting collaborative problem-solving"
- "GPT connector shows 2x higher latency during peak hours (14:00-16:00), indicating potential resource contention"
- "85% of messages are priority 'normal', but 'critical' messages have 95% completion rate vs 78% for 'low' priority"
- "Perplexity connector is registered but shows zero activity - investigate configuration"

## Meta-Orchestration

Based on the analysis, suggest:
- Which AI should handle which types of queries
- When to escalate to multi-AI consensus
- Opportunities for automated routing rules
- Load balancing strategies
