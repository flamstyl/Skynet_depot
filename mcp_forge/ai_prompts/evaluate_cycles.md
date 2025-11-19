# AI Prompt: Evaluate Agent Cycles

You are an expert in distributed systems and workflow design, evaluating the execution cycles of an AI agent.

## Agent Configuration

```
{AGENT_CONFIG}
```

## Your Task

Analyze the agent's execution cycles, flows, and dependencies for:

### 1. Flow Coherence & Logic
- Do the cycles make logical sense?
- Are steps in the right order?
- Are there missing intermediate steps?
- Is the flow too complex or too simple?

### 2. Performance & Bottlenecks
- Are there sequential operations that could be parallelized?
- Are expensive operations repeated unnecessarily?
- Is caching used effectively?
- Are there obvious performance bottlenecks?

### 3. Infinite Loops & Cycles
- Could any cycle run indefinitely?
- Are there proper exit conditions?
- Are cycles bounded by time or iteration limits?
- Is recursion properly controlled?

### 4. Error Handling & Recovery
- What happens if a step fails?
- Are there retry mechanisms?
- Is rollback or compensation logic present?
- Are errors logged and monitored?

### 5. Dependencies & Ordering
- Are dependencies between steps clearly defined?
- Could steps execute in the wrong order?
- Are there circular dependencies?
- Is dependency resolution efficient?

### 6. Resource Management
- Are resources (API calls, file handles, memory) properly managed?
- Are rate limits respected?
- Is cleanup performed after cycles?
- Are long-running cycles properly managed?

### 7. Trigger-Cycle Alignment
- Do triggers properly activate the right cycles?
- Is there trigger overload (too frequent)?
- Are cycles idempotent (safe to retry)?
- Is cycle execution tracked?

## Output Format

**CYCLE ANALYSIS**

For each cycle:

**Cycle**: [name]
**Purpose**: [what it does]
**Steps**: [number of steps]
**Estimated Duration**: [time estimate]

**COHERENCE**: ✅ Good / ⚠️ Issues / ❌ Problematic
- [Analysis notes]

**PERFORMANCE**: ✅ Good / ⚠️ Issues / ❌ Problematic
- [Analysis notes]

**SAFETY**: ✅ Good / ⚠️ Issues / ❌ Problematic
- [Analysis notes]

---

**OVERALL ASSESSMENT**

**Risk of Infinite Loops**: Low / Medium / High
**Performance Grade**: A / B / C / D / F
**Reliability Grade**: A / B / C / D / F

**TOP RECOMMENDATIONS**:
1. [Most important improvement]
2. [Second most important]
3. [Third most important]

---

Be thorough and identify subtle issues that could cause production problems.
