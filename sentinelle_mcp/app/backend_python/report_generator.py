"""
Sentinelle MCP - Report Generator
Generates structured reports in multiple formats (JSON, Markdown) for events.
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta


class ReportGenerator:
    """Generates reports for file system events"""

    def __init__(self, config_manager, log_manager):
        """
        Initialize report generator.

        Args:
            config_manager: ConfigManager instance
            log_manager: LogManager instance
        """
        self.config = config_manager
        self.logger = log_manager
        self.reports_dir = Path(self.config.get_reports_dir())

        # Create reports directory if it doesn't exist
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    def generate_report(self, event: Dict[str, Any],
                       ai_analysis: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
        """
        Generate report for an event.

        Args:
            event: Processed event dictionary
            ai_analysis: Optional AI analysis results

        Returns:
            Dictionary with paths to generated reports
        """
        event_id = event.get('event_id', 'unknown')

        # Build report data
        report_data = self._build_report_data(event, ai_analysis)

        # Generate reports in configured formats
        formats = self.config.get_report_formats()
        generated_files = {}

        if 'json' in formats:
            json_path = self._generate_json_report(event_id, report_data)
            generated_files['json'] = json_path

        if 'markdown' in formats:
            md_path = self._generate_markdown_report(event_id, report_data)
            generated_files['markdown'] = md_path

        # Log report generation
        self.logger.log_report_generated(
            event_id=event_id,
            report_path=str(self.reports_dir / event_id),
            formats=list(generated_files.keys())
        )

        return generated_files

    def _build_report_data(self, event: Dict[str, Any],
                           ai_analysis: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Build complete report data structure.

        Args:
            event: Processed event
            ai_analysis: Optional AI analysis

        Returns:
            Report data dictionary
        """
        report = {
            'report_id': event.get('event_id'),
            'generated_at': datetime.now().isoformat(),
            'sentinelle_version': self.config.get_version(),

            'event': {
                'event_id': event.get('event_id'),
                'timestamp': event.get('timestamp'),
                'type': event.get('event_type'),
                'path': event.get('path'),
                'file_name': event.get('file_name'),
                'file_extension': event.get('file_extension'),
                'directory': event.get('directory')
            },

            'classification': {
                'category': event.get('category'),
                'priority': event.get('priority')
            },

            'metadata': event.get('metadata', {}),

            'context': event.get('context', {}),

            'actions_taken': []
        }

        # Add AI analysis if available
        if ai_analysis:
            report['ai_analysis'] = {
                'model': ai_analysis.get('model', 'unknown'),
                'analyzed_at': ai_analysis.get('timestamp', datetime.now().isoformat()),
                'summary': ai_analysis.get('summary', ''),
                'recommendations': ai_analysis.get('recommendations', []),
                'confidence': ai_analysis.get('confidence', 'medium'),
                'duration_seconds': ai_analysis.get('duration_seconds', 0)
            }
            report['actions_taken'].append('ai_analyzed')
        else:
            report['ai_analysis'] = None

        # Track actions
        report['actions_taken'].extend(['logged', 'reported'])

        return report

    def _generate_json_report(self, event_id: str, report_data: Dict[str, Any]) -> str:
        """
        Generate JSON format report.

        Args:
            event_id: Event ID
            report_data: Report data

        Returns:
            Path to generated JSON file
        """
        file_path = self.reports_dir / f"{event_id}.json"

        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(report_data, f, indent=2, ensure_ascii=False)

            return str(file_path)

        except Exception as e:
            self.logger.error(
                "report_generator",
                f"Error generating JSON report: {e}",
                event_id=event_id
            )
            raise

    def _generate_markdown_report(self, event_id: str, report_data: Dict[str, Any]) -> str:
        """
        Generate Markdown format report.

        Args:
            event_id: Event ID
            report_data: Report data

        Returns:
            Path to generated Markdown file
        """
        file_path = self.reports_dir / f"{event_id}.md"

        try:
            md_content = self._build_markdown_content(report_data)

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(md_content)

            return str(file_path)

        except Exception as e:
            self.logger.error(
                "report_generator",
                f"Error generating Markdown report: {e}",
                event_id=event_id
            )
            raise

    def _build_markdown_content(self, report_data: Dict[str, Any]) -> str:
        """
        Build Markdown content for report.

        Args:
            report_data: Report data

        Returns:
            Markdown string
        """
        event = report_data['event']
        classification = report_data['classification']
        metadata = report_data['metadata']
        context = report_data['context']
        ai_analysis = report_data.get('ai_analysis')

        md = f"""# Sentinelle MCP - Event Report

**Report ID:** `{report_data['report_id']}`
**Generated:** {report_data['generated_at']}
**Sentinelle Version:** {report_data['sentinelle_version']}

---

## Event Details

| Property | Value |
|----------|-------|
| **Event ID** | `{event['event_id']}` |
| **Timestamp** | {event['timestamp']} |
| **Type** | `{event['type']}` |
| **File Name** | `{event['file_name']}` |
| **Extension** | `{event['file_extension']}` |
| **Full Path** | `{event['path']}` |
| **Directory** | `{event['directory']}` |

---

## Classification

| Property | Value |
|----------|-------|
| **Category** | `{classification['category']}` |
| **Priority** | `{classification['priority']}` |

---

## File Metadata

"""

        if metadata:
            md += "| Property | Value |\n"
            md += "|----------|-------|\n"

            for key, value in metadata.items():
                md += f"| **{key}** | {value} |\n"
        else:
            md += "*No metadata available (file may have been deleted)*\n"

        md += "\n---\n\n## Context\n\n"

        if context:
            md += "| Property | Value |\n"
            md += "|----------|-------|\n"

            for key, value in context.items():
                md += f"| **{key}** | {value} |\n"
        else:
            md += "*No context information available*\n"

        md += "\n---\n\n"

        # AI Analysis section
        if ai_analysis:
            md += f"""## AI Analysis

**Model:** {ai_analysis['model']}
**Analyzed At:** {ai_analysis['analyzed_at']}
**Confidence:** {ai_analysis['confidence']}
**Duration:** {ai_analysis['duration_seconds']}s

### Summary

{ai_analysis['summary']}

"""

            if ai_analysis.get('recommendations'):
                md += "### Recommendations\n\n"
                for i, rec in enumerate(ai_analysis['recommendations'], 1):
                    md += f"{i}. {rec}\n"

                md += "\n"

        else:
            md += "## AI Analysis\n\n*No AI analysis performed for this event*\n\n"

        # Actions taken
        md += f"""---

## Actions Taken

"""
        for action in report_data['actions_taken']:
            md += f"- {action}\n"

        md += f"""
---

*Generated by Sentinelle MCP - Skynet Context Watcher*
"""

        return md

    def get_report(self, event_id: str, format: str = 'json') -> Optional[Dict[str, Any]]:
        """
        Retrieve an existing report.

        Args:
            event_id: Event ID
            format: Report format (json or markdown)

        Returns:
            Report data or None if not found
        """
        if format == 'json':
            file_path = self.reports_dir / f"{event_id}.json"

            if not file_path.exists():
                return None

            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                self.logger.error(
                    "report_generator",
                    f"Error reading report {event_id}: {e}"
                )
                return None

        elif format == 'markdown':
            file_path = self.reports_dir / f"{event_id}.md"

            if not file_path.exists():
                return None

            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return {'content': f.read()}
            except Exception as e:
                self.logger.error(
                    "report_generator",
                    f"Error reading report {event_id}: {e}"
                )
                return None

        return None

    def list_reports(self, limit: int = 100, format: str = 'json') -> List[str]:
        """
        List available reports.

        Args:
            limit: Maximum number of reports to return
            format: Filter by format

        Returns:
            List of report IDs
        """
        extension = '.json' if format == 'json' else '.md'

        reports = []

        for file_path in self.reports_dir.glob(f"*{extension}"):
            reports.append(file_path.stem)

            if len(reports) >= limit:
                break

        return sorted(reports, reverse=True)  # Most recent first

    def delete_old_reports(self, days: int = 30) -> int:
        """
        Delete reports older than specified days.

        Args:
            days: Number of days to retain

        Returns:
            Number of reports deleted
        """
        cutoff_date = datetime.now() - timedelta(days=days)
        deleted_count = 0

        try:
            for file_path in self.reports_dir.glob("*.*"):
                # Get file modification time
                mtime = datetime.fromtimestamp(file_path.stat().st_mtime)

                if mtime < cutoff_date:
                    file_path.unlink()
                    deleted_count += 1

            if deleted_count > 0:
                self.logger.info(
                    "report_generator",
                    f"Deleted {deleted_count} old reports (older than {days} days)"
                )

        except Exception as e:
            self.logger.error(
                "report_generator",
                f"Error deleting old reports: {e}"
            )

        return deleted_count

    def get_stats(self) -> Dict[str, Any]:
        """
        Get report statistics.

        Returns:
            Statistics dictionary
        """
        stats = {
            'total_reports': 0,
            'by_format': {},
            'oldest_report': None,
            'newest_report': None,
            'total_size_mb': 0
        }

        try:
            total_size = 0

            for file_path in self.reports_dir.glob("*.*"):
                stats['total_reports'] += 1

                # Count by format
                ext = file_path.suffix
                stats['by_format'][ext] = stats['by_format'].get(ext, 0) + 1

                # Track dates
                mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                mtime_iso = mtime.isoformat()

                if not stats['oldest_report'] or mtime_iso < stats['oldest_report']:
                    stats['oldest_report'] = mtime_iso

                if not stats['newest_report'] or mtime_iso > stats['newest_report']:
                    stats['newest_report'] = mtime_iso

                # Track size
                total_size += file_path.stat().st_size

            stats['total_size_mb'] = round(total_size / (1024 * 1024), 2)

        except Exception as e:
            self.logger.error(
                "report_generator",
                f"Error getting stats: {e}"
            )

        return stats

    def __repr__(self) -> str:
        return f"ReportGenerator(dir={self.reports_dir})"


if __name__ == "__main__":
    # Test report generator
    from config_manager import ConfigManager
    from log_manager import LogManager
    import tempfile
    import uuid

    # Create temporary log
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
        temp_log = f.name

    config = ConfigManager()
    logger = LogManager(temp_log, level="DEBUG")
    report_gen = ReportGenerator(config, logger)

    print(f"\n=== Testing Sentinelle MCP Report Generator ===\n")
    print(f"Reports directory: {report_gen.reports_dir}\n")

    # Test event
    test_event = {
        'event_id': str(uuid.uuid4()),
        'timestamp': datetime.now().isoformat(),
        'event_type': 'created',
        'path': '/home/user/AI_Projects/test/main.py',
        'file_name': 'main.py',
        'file_extension': '.py',
        'directory': '/home/user/AI_Projects/test',
        'category': 'code',
        'priority': 'high',
        'metadata': {
            'size_bytes': 1024,
            'size_kb': 1.0,
            'hash': 'abc123'
        },
        'context': {
            'in_git_repo': True,
            'project_name': 'test'
        }
    }

    # Test AI analysis
    test_ai_analysis = {
        'model': 'claude_cli',
        'timestamp': datetime.now().isoformat(),
        'summary': 'This is a new Python file that appears to be a main entry point.',
        'recommendations': [
            'Add docstring to describe the module',
            'Include error handling',
            'Add unit tests'
        ],
        'confidence': 'high',
        'duration_seconds': 1.5
    }

    # Generate report
    print("Generating test report...")
    generated = report_gen.generate_report(test_event, test_ai_analysis)

    print(f"\nGenerated reports:")
    for format_type, path in generated.items():
        print(f"  {format_type}: {path}")

    # Get stats
    stats = report_gen.get_stats()
    print(f"\nReport statistics:")
    print(f"  Total reports: {stats['total_reports']}")
    print(f"  By format: {stats['by_format']}")
    print(f"  Total size: {stats['total_size_mb']} MB")

    # List reports
    reports = report_gen.list_reports(limit=10)
    print(f"\nRecent reports: {len(reports)}")

    # Cleanup
    import os
    os.unlink(temp_log)

    print(f"\n✓ Test completed")
