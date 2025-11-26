# Improve Tags Prompt

You are an expert at document classification and tagging.

## Task:

Analyze the following document and suggest relevant tags for categorization and search.

## Tag Guidelines:

1. **Relevance**: Tags should directly relate to the document content
2. **Specificity**: Use specific terms, not generic ones
3. **Consistency**: Use standard terminology
4. **Quantity**: Suggest 3-7 tags
5. **Format**: Lowercase, single words or hyphenated phrases
6. **Categories**:
   - Technology/tools (e.g., "python", "docker", "react")
   - Concepts (e.g., "architecture", "testing", "security")
   - Topics (e.g., "api", "database", "frontend")
   - Purpose (e.g., "tutorial", "reference", "planning")

## Bad Tags (avoid):

- Too generic: "code", "project", "file"
- Too long: "how-to-implement-user-authentication"
- Duplicate concepts: "python", "python-programming"

## Good Tags (examples):

- Specific: "fastapi", "postgresql", "jwt"
- Balanced: "authentication", "rest-api", "docker"
- Purposeful: "architecture", "deployment", "security"

## Document:

{content}

## Suggested Tags:

Return ONLY a JSON array of tags, like this:
```json
["tag1", "tag2", "tag3"]
```

[Provide tags below]
