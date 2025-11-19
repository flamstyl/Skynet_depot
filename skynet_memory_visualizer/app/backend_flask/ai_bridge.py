"""
AI Bridge - Interface with Claude/Gemini for document operations
"""

import os
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class AIBridge:
    def __init__(self, config):
        self.config = config
        self.ai_config = config.get('ai', {})
        self.provider = self.ai_config.get('provider', 'claude')
        self.model = self.ai_config.get('model', 'claude-sonnet-4-5')

        # Load API key from environment
        api_key_env = self.ai_config.get('api_key_env', 'ANTHROPIC_API_KEY')
        self.api_key = os.getenv(api_key_env)

        if not self.api_key:
            logger.warning(f"No API key found in {api_key_env}. AI features will not work.")

        # Load prompts
        self.prompts = self._load_prompts()

    def _load_prompts(self):
        """Load AI prompts from files"""
        prompts = {}
        prompts_dir = Path('../ai_prompts')

        if prompts_dir.exists():
            for prompt_file in prompts_dir.glob('*.md'):
                prompt_name = prompt_file.stem
                with open(prompt_file, 'r') as f:
                    prompts[prompt_name] = f.read()

        logger.info(f"Loaded {len(prompts)} AI prompts")
        return prompts

    def _call_ai(self, prompt, content):
        """
        Call AI API (Claude or Gemini)
        TODO: Implement actual API calls
        """
        if not self.api_key:
            raise Exception("API key not configured")

        # TODO: Implement actual API calls
        # For now, return a placeholder

        logger.warning("AI API call not implemented - returning placeholder")

        return f"[AI Response Placeholder]\n\nPrompt: {prompt[:100]}...\n\nContent processed successfully."

    def suggest_tags(self, content):
        """Suggest tags for document content"""
        try:
            prompt_template = self.prompts.get('improve_tags', '''
Analyze this document and suggest relevant tags.
Return only a JSON array of tags, like: ["tag1", "tag2", "tag3"]

Document:
{content}
            ''')

            prompt = prompt_template.format(content=content[:2000])  # Limit content

            response = self._call_ai(prompt, content)

            # TODO: Parse actual AI response
            # For now, return simple keywords
            words = content.lower().split()
            from collections import Counter
            common = Counter(words).most_common(5)
            tags = [word for word, count in common if len(word) > 4]

            return tags[:5]

        except Exception as e:
            logger.error(f"Failed to suggest tags: {e}")
            return []

    def regenerate(self, content, prompt_type='regenerate_doc'):
        """Regenerate document with AI"""
        try:
            prompt_template = self.prompts.get(prompt_type, '''
Rewrite this document to improve structure, clarity, and coherence.
Keep the factual content accurate. Do not add new information.

Original document:
{content}

Regenerated document:
            ''')

            prompt = prompt_template.format(content=content)

            response = self._call_ai(prompt, content)

            return response

        except Exception as e:
            logger.error(f"Failed to regenerate document: {e}")
            raise

    def summarize(self, content, level='medium'):
        """Generate summary of document"""
        try:
            levels = {
                'short': '1-2 sentences',
                'medium': '1 paragraph (3-5 sentences)',
                'detailed': '2-3 paragraphs'
            }

            length = levels.get(level, levels['medium'])

            prompt_template = self.prompts.get('summarize_doc', '''
Summarize this document in {length}.

Document:
{content}

Summary:
            ''')

            prompt = prompt_template.format(length=length, content=content)

            response = self._call_ai(prompt, content)

            return response

        except Exception as e:
            logger.error(f"Failed to summarize: {e}")
            raise

    def extract_metadata(self, content):
        """Extract metadata from document"""
        try:
            prompt_template = self.prompts.get('metadata_extract', '''
Extract metadata from this document and return as JSON with these fields:
- title: A clear, descriptive title
- description: One sentence description
- tags: Array of relevant tags (3-5 tags)
- category: Main category (architecture/implementation/documentation/planning/other)

Document:
{content}

Return only the JSON object:
            ''')

            prompt = prompt_template.format(content=content[:2000])

            response = self._call_ai(prompt, content)

            # TODO: Parse actual JSON response
            # For now, return a basic structure
            import json

            metadata = {
                'title': content.split('\n')[0][:100] if content else 'Untitled',
                'description': content[:200] if content else 'No description',
                'tags': self.suggest_tags(content),
                'category': 'other'
            }

            return metadata

        except Exception as e:
            logger.error(f"Failed to extract metadata: {e}")
            raise

    def improve_writing(self, content):
        """Improve writing quality"""
        try:
            prompt = f'''
Improve the writing quality of this document:
- Fix grammar and spelling
- Improve sentence structure
- Enhance clarity and readability
- Keep the same meaning and facts

Original:
{content}

Improved:
            '''

            response = self._call_ai(prompt, content)

            return response

        except Exception as e:
            logger.error(f"Failed to improve writing: {e}")
            raise
