# Traffic Summarization Prompt for RelayMCP

Generate concise, actionable summaries of RelayMCP message traffic over a specified time period.

## Purpose

Provide human operators with quick insights into multi-AI system behavior without requiring detailed log analysis.

## Input Data

You will receive:
- Time range (e.g., "last hour", "last 24 hours", "since 2025-01-15")
- Message logs (filtered to time range)
- Performance metrics
- Connection status

## Summary Levels

### Level 1: Executive Summary (1-2 sentences)
**For:** Quick status check
**Example:** "In the last hour, Claude and Gemini exchanged 47 messages about code analysis with 98% success rate and avg 450ms latency. GPT connector offline."

### Level 2: Operational Summary (1 paragraph)
**For:** Daily standup, shift handoff
**Example:**
```
During the 8-hour shift, RelayMCP processed 324 messages across 3 active connectors.
Claude handled 45% of traffic (primarily code review and debugging queries), GPT 35%
(documentation and explanation requests), and Gemini 20% (multimodal analysis).
Average latency was 520ms (within SLA). Two timeout events occurred on GPT connector
during peak load at 14:30. No critical errors. Buffer utilization peaked at 23%.
```

### Level 3: Detailed Report (multi-section)
**For:** Weekly review, incident investigation
**Sections:**
1. Traffic Overview
2. Top Conversations
3. Performance Summary
4. Issues & Anomalies
5. Recommendations

## Output Format

### Executive Summary Format
```
[Time Period] | [Total Messages] msgs | [Active AIs] active | [Key Metric]
Top activity: [AI1 ↔ AI2] ([topic])
Status: [OK|Warning|Critical]
```

### Operational Summary Format
```markdown
## Traffic Summary: [Time Range]

**Volume:** X messages (Y/hour avg)
**Active Connectors:** [list]
**Performance:** Avg Z ms latency, W% error rate

**Activity Breakdown:**
- [AI1]: X msgs (Y% of total) - [primary use case]
- [AI2]: X msgs (Y% of total) - [primary use case]

**Notable Events:**
- [Event 1]
- [Event 2]

**Status:** [Overall health assessment]
```

### Detailed Report Format
```markdown
# RelayMCP Traffic Report
**Period:** [start] to [end]
**Duration:** [X hours/days]
**Generated:** [timestamp]

## 📊 Traffic Overview
- Total Messages: X
- Unique Conversations: Y
- Active Connectors: Z
- Messages per Hour: W

## 🔥 Top Conversations
1. **Claude ↔ Gemini** (45 messages)
   - Topic: Code refactoring analysis
   - Avg latency: 380ms
   - Success rate: 100%

2. **GPT ↔ Claude** (32 messages)
   - Topic: Documentation generation
   - Avg latency: 620ms
   - Success rate: 94%

[... more conversations]

## ⚡ Performance Summary
- **Average Latency:** X ms (trend: ↑/↓/→)
- **Error Rate:** Y% (target: <5%)
- **Timeout Rate:** Z% (target: <1%)
- **Buffer Peak Utilization:** W%

**Latency by Connector:**
| AI | Avg Latency | P95 | P99 |
|----|-------------|-----|-----|
| Claude | 450ms | 800ms | 1200ms |
| GPT | 520ms | 950ms | 1500ms |
| Gemini | 380ms | 700ms | 1000ms |

## ⚠️ Issues & Anomalies
- [Timestamp] GPT connector timeout (3 occurrences during peak load)
- [Timestamp] Unusual spike in Claude→Gemini traffic (+300% vs baseline)
- [Timestamp] Perplexity connector health check failed (connector inactive)

## 💡 Recommendations
1. **Performance:** Consider scaling GPT connector during 14:00-16:00 peak hours
2. **Reliability:** Investigate Perplexity connector configuration
3. **Optimization:** Claude→Gemini conversation pattern suggests potential for caching
4. **Monitoring:** Set alert for buffer utilization >80%

## 📈 Trends
- Traffic volume: ↑ 15% vs previous period
- Error rate: ↓ 2% vs previous period
- New conversation pattern detected: Multi-hop Claude→GPT→Gemini for complex analysis

---
*Next review: [suggested time]*
```

## Analysis Heuristics

### Conversation Detection
Group messages into conversations when:
- Same AI pair exchanges messages within 5 minutes
- Message content shows topical continuity
- Context fields reference same conversation_id

### Anomaly Detection
Flag as anomalies:
- Latency >2x median for that connector
- Error rate >10% in any 5-minute window
- Sudden drop in traffic (>50% decrease)
- New AI-to-AI communication pattern
- Buffer utilization >75%

### Trend Analysis
Compare against:
- Previous equivalent time period (e.g., last Tuesday 9-10am vs this Tuesday 9-10am)
- 7-day rolling average
- Historical baseline

### Topic Extraction
Infer topics from message content:
- Code keywords → "code analysis/debugging/review"
- Question marks → "Q&A/help requests"
- File paths → "file operations"
- Error terms → "troubleshooting"
- Documentation terms → "documentation/explanation"

## Prioritization

**Always highlight first:**
1. Critical errors or failures
2. Performance degradation (>50% slower than baseline)
3. New patterns (first-time AI interactions)
4. Capacity warnings (buffer >75%, queue depth >100)
5. Success stories (100% success rate on high-volume conversations)

## Tone & Style

- **Concise:** Every sentence should add value
- **Actionable:** Focus on what operators can do
- **Factual:** Numbers and evidence, not speculation
- **Forward-looking:** What to watch for next

## Example: Quick Status Update

```
🟢 RelayMCP Status: Last Hour

47 messages | 3 AIs active | 420ms avg latency

Claude (55%) ↔ Gemini (30%): Code analysis collaboration
GPT (15%): Documentation queries

✅ All systems nominal
⚠️ GPT latency +20% (investigate if persists)

Top conversation: Claude↔Gemini analyzing Python refactor (12 msgs, 0 errors)
```

## Example: Incident Summary

```
🔴 RelayMCP Incident Report

Period: 2025-01-15 14:30-14:45 (15 minutes)
Issue: GPT connector timeouts

Impact:
- 8 messages failed (timeout)
- GPT→Claude conversation interrupted
- Claude fallback to Gemini successful

Root cause: GPT API latency spike (external)
Resolution: Self-healed after 15 minutes

Action items:
1. Implement retry with exponential backoff for GPT
2. Add circuit breaker pattern
3. Monitor GPT external API status
```

## Automation Triggers

Suggest automated responses:
- "If error rate >5% for 10 min → alert on-call"
- "If buffer >80% → increase buffer size or reduce TTL"
- "If latency >2s consistently → investigate connector config"
- "If new AI pair communicates >10 msgs → log for pattern analysis"
