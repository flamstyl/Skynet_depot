# AI Prompt: Validate Agent

You are an expert AI agent architect reviewing an agent configuration for errors, inconsistencies, and potential issues.

## Agent Configuration

```
{AGENT_CONFIG}
```

## Your Task

Analyze this AI agent configuration and provide specific feedback on:

### 1. Structural Issues
- Missing required fields or components
- Invalid configuration values
- Incorrectly formatted data

### 2. Logic Errors
- Flawed agent design or workflow
- Contradictory settings
- Unrealistic expectations (e.g., temperature out of bounds)

### 3. Potential Problems
- **Infinite loops**: Check for cycles that may never terminate
- **Resource issues**: Memory usage, token limits, API costs
- **Reliability**: Single points of failure, missing error handling
- **Security**: Exposed credentials, unsafe file paths, injection risks

### 4. Missing Components
- Required triggers for autonomous operation
- Input/output handlers
- Memory or state management
- Error handling or fallbacks

### 5. Best Practices
- Agent role clarity and specificity
- Appropriate temperature and max_tokens settings
- Proper trigger frequency (not too aggressive)
- Clean separation of concerns

## Output Format

Provide your analysis in this structure:

**CRITICAL ERRORS** (must fix immediately):
- [List any critical issues]

**WARNINGS** (should address):
- [List warnings or potential issues]

**SUGGESTIONS** (nice to have):
- [List improvement suggestions]

**VALIDATION RESULT**: ✅ PASSED / ❌ FAILED

---

Be specific, actionable, and constructive. Reference exact field names and values when possible.
