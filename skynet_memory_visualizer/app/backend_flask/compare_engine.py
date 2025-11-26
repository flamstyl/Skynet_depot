"""
Compare Engine - Generate diffs between document versions
"""

import difflib
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class CompareEngine:
    def __init__(self):
        pass

    def diff(self, text_a, text_b):
        """Generate diff between two texts"""
        lines_a = text_a.splitlines()
        lines_b = text_b.splitlines()

        # Use difflib for line-by-line comparison
        differ = difflib.Differ()
        diff_lines = list(differ.compare(lines_a, lines_b))

        # Parse diff
        changes = []
        stats = {
            'lines_added': 0,
            'lines_removed': 0,
            'lines_changed': 0,
            'chars_changed': 0
        }

        line_num_a = 0
        line_num_b = 0

        for line in diff_lines:
            if line.startswith('  '):  # Unchanged
                line_num_a += 1
                line_num_b += 1
                changes.append({
                    'type': 'unchanged',
                    'line_num_a': line_num_a,
                    'line_num_b': line_num_b,
                    'content': line[2:]
                })
            elif line.startswith('- '):  # Removed
                line_num_a += 1
                stats['lines_removed'] += 1
                stats['chars_changed'] += len(line) - 2
                changes.append({
                    'type': 'removed',
                    'line_num_a': line_num_a,
                    'line_num_b': None,
                    'content': line[2:]
                })
            elif line.startswith('+ '):  # Added
                line_num_b += 1
                stats['lines_added'] += 1
                stats['chars_changed'] += len(line) - 2
                changes.append({
                    'type': 'added',
                    'line_num_a': None,
                    'line_num_b': line_num_b,
                    'content': line[2:]
                })

        # Calculate changed lines (modifications)
        stats['lines_changed'] = min(stats['lines_added'], stats['lines_removed'])

        # Generate unified diff
        unified = self._unified_diff(text_a, text_b)

        return {
            'changes': changes,
            'stats': stats,
            'unified': unified
        }

    def _unified_diff(self, text_a, text_b, context=3):
        """Generate unified diff format"""
        lines_a = text_a.splitlines(keepends=True)
        lines_b = text_b.splitlines(keepends=True)

        diff = difflib.unified_diff(
            lines_a,
            lines_b,
            fromfile='Version A',
            tofile='Version B',
            lineterm='',
            n=context
        )

        return '\n'.join(diff)

    def highlight_changes(self, diff):
        """Format diff for UI display with syntax highlighting"""
        highlighted = []

        for change in diff['changes']:
            line_class = f"diff-line-{change['type']}"

            highlighted.append({
                'line_num_a': change.get('line_num_a'),
                'line_num_b': change.get('line_num_b'),
                'content': change['content'],
                'type': change['type'],
                'class': line_class
            })

        return highlighted

    def side_by_side(self, text_a, text_b):
        """Generate side-by-side diff view"""
        lines_a = text_a.splitlines()
        lines_b = text_b.splitlines()

        # Use SequenceMatcher for better alignment
        matcher = difflib.SequenceMatcher(None, lines_a, lines_b)

        result = {
            'left': [],
            'right': [],
            'stats': {
                'lines_added': 0,
                'lines_removed': 0,
                'lines_unchanged': 0
            }
        }

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'equal':
                # Unchanged lines
                for i, j in zip(range(i1, i2), range(j1, j2)):
                    result['left'].append({
                        'line_num': i + 1,
                        'content': lines_a[i],
                        'type': 'unchanged'
                    })
                    result['right'].append({
                        'line_num': j + 1,
                        'content': lines_b[j],
                        'type': 'unchanged'
                    })
                    result['stats']['lines_unchanged'] += 1

            elif tag == 'delete':
                # Lines removed from left
                for i in range(i1, i2):
                    result['left'].append({
                        'line_num': i + 1,
                        'content': lines_a[i],
                        'type': 'removed'
                    })
                    result['right'].append({
                        'line_num': None,
                        'content': '',
                        'type': 'empty'
                    })
                    result['stats']['lines_removed'] += 1

            elif tag == 'insert':
                # Lines added to right
                for j in range(j1, j2):
                    result['left'].append({
                        'line_num': None,
                        'content': '',
                        'type': 'empty'
                    })
                    result['right'].append({
                        'line_num': j + 1,
                        'content': lines_b[j],
                        'type': 'added'
                    })
                    result['stats']['lines_added'] += 1

            elif tag == 'replace':
                # Lines changed
                max_lines = max(i2 - i1, j2 - j1)

                for k in range(max_lines):
                    left_idx = i1 + k
                    right_idx = j1 + k

                    if left_idx < i2:
                        result['left'].append({
                            'line_num': left_idx + 1,
                            'content': lines_a[left_idx],
                            'type': 'modified'
                        })
                    else:
                        result['left'].append({
                            'line_num': None,
                            'content': '',
                            'type': 'empty'
                        })

                    if right_idx < j2:
                        result['right'].append({
                            'line_num': right_idx + 1,
                            'content': lines_b[right_idx],
                            'type': 'modified'
                        })
                    else:
                        result['right'].append({
                            'line_num': None,
                            'content': '',
                            'type': 'empty'
                        })

        return result

    def export_diff(self, doc_path, diff):
        """Export diff to file"""
        try:
            # TODO: Implement export to various formats
            export_path = Path(doc_path).parent / f"{Path(doc_path).stem}_diff.txt"

            with open(export_path, 'w') as f:
                f.write(diff.get('unified', ''))

            logger.info(f"Exported diff to {export_path}")

            return {
                'success': True,
                'path': str(export_path)
            }

        except Exception as e:
            logger.error(f"Failed to export diff: {e}")
            raise

    def similarity_score(self, text_a, text_b):
        """Calculate similarity score between two texts (0-100%)"""
        matcher = difflib.SequenceMatcher(None, text_a, text_b)
        return round(matcher.ratio() * 100, 2)
