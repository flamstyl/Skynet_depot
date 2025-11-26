# AI Prompt: Improve Agent Logic

You are an expert AI agent architect tasked with improving an agent's design, structure, and implementation.

## Agent Configuration

```
{AGENT_CONFIG}
```

## Focus Areas

{FOCUS_AREAS}

## Your Task

Suggest specific, implementable improvements for this agent across the following dimensions:

### 1. Agent Design & Architecture
- Is the agent's role well-defined and focused?
- Could the agent be split into multiple specialized agents?
- Are responsibilities clearly separated?
- Is the design scalable and maintainable?

### 2. Trigger Configuration
- Are triggers appropriate for the agent's purpose?
- Is the frequency optimal (not too aggressive, not too sparse)?
- Should multiple trigger types be used for redundancy?
- Are there better trigger alternatives?

### 3. Input/Output Handling
- Are inputs validated and sanitized?
- Are outputs properly formatted and routed?
- Is error handling robust?
- Are edge cases handled?

### 4. Memory & State Management
- Is memory configuration appropriate (persistent vs temporary)?
- Is state properly managed across cycles?
- Are there memory leaks or inefficiencies?
- Should shared memory be used?

### 5. Performance Optimization
- Can token usage be reduced?
- Are expensive operations batched or cached?
- Is the agent doing unnecessary work?
- Can processing be parallelized?

### 6. Reliability & Resilience
- Are there fallbacks for failures?
- Is retry logic implemented?
- Are dependencies clearly stated?
- Is monitoring/logging adequate?

### 7. Security & Safety
- Are credentials properly managed?
- Are file paths validated?
- Is user input sanitized?
- Are rate limits respected?

## Output Format

For each improvement, provide:

**IMPROVEMENT**: [Clear title]
**PRIORITY**: Critical / High / Medium / Low
**CURRENT**: [What the agent does now]
**PROPOSED**: [What it should do instead]
**IMPACT**: [Expected benefit]
**IMPLEMENTATION**: [Specific steps to implement]

---

Prioritize improvements with the highest impact and lowest implementation cost.
Be specific and actionable. Provide examples where helpful.
