"""
Indexer - Indexes apps, files, and commands for quick search
"""
import os
import sqlite3
import time
import winreg
from pathlib import Path
from typing import List, Dict, Optional
from fuzzywuzzy import fuzz
import yaml


class Indexer:
    def __init__(self, db_path: str, config_path: str):
        self.db_path = db_path
        self.config_path = config_path
        self.config = self._load_config()
        self._init_database()

    def _load_config(self) -> Dict:
        """Load indexer configuration"""
        if os.path.exists(self.config_path):
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f) or {}
        return {
            'scan_directories': [
                str(Path.home() / 'Desktop'),
                str(Path.home() / 'Documents'),
            ],
            'file_extensions': ['.exe', '.lnk', '.txt', '.pdf', '.docx', '.xlsx'],
            'max_depth': 3,
            'exclude_patterns': ['node_modules', '.git', '__pycache__']
        }

    def _init_database(self):
        """Initialize SQLite database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS indexed_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                path TEXT NOT NULL UNIQUE,
                type TEXT NOT NULL,
                icon TEXT,
                tags TEXT,
                frequency INTEGER DEFAULT 0,
                last_used TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_name ON indexed_items(name)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_type ON indexed_items(type)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_frequency ON indexed_items(frequency DESC)
        ''')

        conn.commit()
        conn.close()

    def rebuild_index(self) -> Dict:
        """Rebuild the entire index"""
        start_time = time.time()

        # Clear existing items
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM indexed_items')
        conn.commit()
        conn.close()

        indexed_count = 0

        # Index installed applications
        indexed_count += self._index_installed_apps()

        # Index start menu
        indexed_count += self._index_start_menu()

        # Index configured directories
        for directory in self.config.get('scan_directories', []):
            if os.path.exists(directory):
                indexed_count += self._index_directory(directory)

        # Index custom commands
        indexed_count += self._index_commands()

        duration = time.time() - start_time

        return {
            'indexed': indexed_count,
            'duration': f'{duration:.2f}s',
            'status': 'success'
        }

    def _index_installed_apps(self) -> int:
        """Index installed Windows applications from Registry"""
        count = 0

        # Registry paths to check
        reg_paths = [
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
            (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
        ]

        for hkey, subkey in reg_paths:
            try:
                key = winreg.OpenKey(hkey, subkey)
                for i in range(winreg.QueryInfoKey(key)[0]):
                    try:
                        subkey_name = winreg.EnumKey(key, i)
                        subkey_path = f"{subkey}\\{subkey_name}"
                        app_key = winreg.OpenKey(hkey, subkey_path)

                        try:
                            name = winreg.QueryValueEx(app_key, "DisplayName")[0]

                            # Try to get install location or executable
                            path = None
                            try:
                                path = winreg.QueryValueEx(app_key, "InstallLocation")[0]
                            except:
                                try:
                                    path = winreg.QueryValueEx(app_key, "DisplayIcon")[0]
                                except:
                                    pass

                            if name and path:
                                self._add_item(name, path, 'app')
                                count += 1

                        except:
                            pass
                        finally:
                            winreg.CloseKey(app_key)

                    except:
                        continue

                winreg.CloseKey(key)
            except:
                continue

        return count

    def _index_start_menu(self) -> int:
        """Index Windows Start Menu shortcuts"""
        count = 0

        start_menu_paths = [
            Path(os.environ.get('APPDATA', '')) / 'Microsoft' / 'Windows' / 'Start Menu' / 'Programs',
            Path(os.environ.get('PROGRAMDATA', '')) / 'Microsoft' / 'Windows' / 'Start Menu' / 'Programs',
        ]

        for start_menu in start_menu_paths:
            if start_menu.exists():
                for item in start_menu.rglob('*.lnk'):
                    self._add_item(item.stem, str(item), 'app', icon='📱')
                    count += 1

        return count

    def _index_directory(self, directory: str, depth: int = 0) -> int:
        """Index files and folders in a directory"""
        count = 0
        max_depth = self.config.get('max_depth', 3)
        exclude_patterns = self.config.get('exclude_patterns', [])

        if depth > max_depth:
            return count

        try:
            for item in os.listdir(directory):
                # Skip excluded patterns
                if any(pattern in item for pattern in exclude_patterns):
                    continue

                full_path = os.path.join(directory, item)

                # Index directory
                if os.path.isdir(full_path):
                    self._add_item(item, full_path, 'folder', icon='📁')
                    count += 1
                    # Recursively index subdirectory
                    count += self._index_directory(full_path, depth + 1)

                # Index file
                elif os.path.isfile(full_path):
                    ext = os.path.splitext(item)[1].lower()
                    if ext in self.config.get('file_extensions', []):
                        file_type = 'app' if ext in ['.exe', '.lnk'] else 'file'
                        icon = '📱' if file_type == 'app' else '📄'
                        self._add_item(item, full_path, file_type, icon=icon)
                        count += 1

        except PermissionError:
            pass
        except Exception as e:
            print(f"Error indexing {directory}: {e}")

        return count

    def _index_commands(self) -> int:
        """Index custom commands and system utilities"""
        count = 0

        # Common Windows commands
        commands = [
            ('Notepad', 'notepad.exe', 'command'),
            ('Calculator', 'calc.exe', 'command'),
            ('Paint', 'mspaint.exe', 'command'),
            ('Command Prompt', 'cmd.exe', 'command'),
            ('PowerShell', 'powershell.exe', 'command'),
            ('Task Manager', 'taskmgr.exe', 'command'),
            ('Control Panel', 'control.exe', 'command'),
            ('Settings', 'ms-settings:', 'command'),
            ('File Explorer', 'explorer.exe', 'command'),
        ]

        for name, path, item_type in commands:
            self._add_item(name, path, item_type, icon='⚡')
            count += 1

        return count

    def _add_item(self, name: str, path: str, item_type: str, icon: Optional[str] = None):
        """Add item to database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute('''
                INSERT OR REPLACE INTO indexed_items (name, path, type, icon)
                VALUES (?, ?, ?, ?)
            ''', (name, path, item_type, icon))

            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Error adding item {name}: {e}")

    def search(self, query: str, limit: int = 10) -> List[Dict]:
        """Search indexed items with fuzzy matching"""
        if not query:
            return []

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Get all items for fuzzy matching
        cursor.execute('SELECT * FROM indexed_items')
        items = cursor.fetchall()
        conn.close()

        # Fuzzy match and score
        results = []
        for item in items:
            # Calculate fuzzy score
            name_score = fuzz.partial_ratio(query.lower(), item['name'].lower())

            # Boost score based on frequency
            frequency_boost = min(item['frequency'] * 2, 20)
            total_score = name_score + frequency_boost

            if name_score > 50:  # Minimum threshold
                results.append({
                    'id': item['id'],
                    'name': item['name'],
                    'path': item['path'],
                    'type': item['type'],
                    'icon': item['icon'],
                    'score': total_score,
                    'frequency': item['frequency'],
                    'last_used': item['last_used']
                })

        # Sort by score (descending)
        results.sort(key=lambda x: x['score'], reverse=True)

        return results[:limit]

    def update_frequency(self, item_id: int):
        """Update item usage frequency"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            UPDATE indexed_items
            SET frequency = frequency + 1,
                last_used = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (item_id,))

        conn.commit()
        conn.close()

    def get_stats(self) -> Dict:
        """Get indexer statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('SELECT COUNT(*) FROM indexed_items')
        total = cursor.fetchone()[0]

        cursor.execute('SELECT type, COUNT(*) FROM indexed_items GROUP BY type')
        by_type = dict(cursor.fetchall())

        conn.close()

        return {
            'total': total,
            'by_type': by_type
        }
