# Extract Metadata Prompt

You are an expert at extracting structured metadata from documents.

## Task:

Analyze the following document and extract key metadata.

## Metadata Fields:

1. **title**: A clear, descriptive title (max 100 characters)
   - Should capture the main subject
   - Use title case
   - Be specific and informative

2. **description**: One sentence description (max 200 characters)
   - What is this document about?
   - What problem does it solve?
   - Who is it for?

3. **tags**: Array of 3-7 relevant tags
   - See tag guidelines in separate prompt
   - Lowercase, specific, relevant

4. **category**: Primary category (choose one)
   - `architecture`: System design, high-level structure
   - `implementation`: Code, how-to, technical details
   - `documentation`: Reference, guides, explanations
   - `planning`: Proposals, roadmaps, decisions
   - `other`: Everything else

5. **keywords**: Array of 5-10 important keywords
   - Key technical terms
   - Important concepts
   - Technologies mentioned

## Output Format:

Return ONLY a valid JSON object with this structure:

```json
{
  "title": "Clear Descriptive Title",
  "description": "One sentence describing the document.",
  "category": "architecture",
  "tags": ["tag1", "tag2", "tag3"],
  "keywords": ["keyword1", "keyword2", "keyword3"]
}
```

## Document:

{content}

## Extracted Metadata:

[Provide JSON below]
