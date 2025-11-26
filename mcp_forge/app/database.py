"""
Database management for MCP Forge
"""
import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
from .config import Config

class Database:
    """SQLite database manager for agents"""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or Config.DATABASE_PATH
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self.init_db()

    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        """Initialize database schema"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # Agents table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS agents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                model TEXT NOT NULL,
                config TEXT NOT NULL,
                status TEXT DEFAULT 'draft',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                version INTEGER DEFAULT 1
            )
        ''')

        # Agent components table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS agent_components (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id INTEGER NOT NULL,
                component_type TEXT NOT NULL,
                component_data TEXT NOT NULL,
                position_x INTEGER,
                position_y INTEGER,
                FOREIGN KEY (agent_id) REFERENCES agents (id) ON DELETE CASCADE
            )
        ''')

        # Execution logs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS execution_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id INTEGER NOT NULL,
                execution_type TEXT NOT NULL,
                status TEXT NOT NULL,
                input_data TEXT,
                output_data TEXT,
                error_message TEXT,
                duration_ms INTEGER,
                executed_at TEXT NOT NULL,
                FOREIGN KEY (agent_id) REFERENCES agents (id) ON DELETE CASCADE
            )
        ''')

        # Validations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS validations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id INTEGER NOT NULL,
                validator TEXT NOT NULL,
                score REAL,
                feedback TEXT,
                suggestions TEXT,
                validated_at TEXT NOT NULL,
                FOREIGN KEY (agent_id) REFERENCES agents (id) ON DELETE CASCADE
            )
        ''')

        conn.commit()
        conn.close()

    def create_agent(self, name: str, description: str, model: str, config: Dict[str, Any]) -> int:
        """Create a new agent"""
        conn = self.get_connection()
        cursor = conn.cursor()

        now = datetime.utcnow().isoformat()
        cursor.execute('''
            INSERT INTO agents (name, description, model, config, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (name, description, model, json.dumps(config), now, now))

        agent_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return agent_id

    def get_agent(self, agent_id: int) -> Optional[Dict[str, Any]]:
        """Get agent by ID"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM agents WHERE id = ?', (agent_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            return {
                'id': row['id'],
                'name': row['name'],
                'description': row['description'],
                'model': row['model'],
                'config': json.loads(row['config']),
                'status': row['status'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at'],
                'version': row['version']
            }
        return None

    def get_agent_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Get agent by name"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM agents WHERE name = ?', (name,))
        row = cursor.fetchone()
        conn.close()

        if row:
            return {
                'id': row['id'],
                'name': row['name'],
                'description': row['description'],
                'model': row['model'],
                'config': json.loads(row['config']),
                'status': row['status'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at'],
                'version': row['version']
            }
        return None

    def list_agents(self) -> List[Dict[str, Any]]:
        """List all agents"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM agents ORDER BY updated_at DESC')
        rows = cursor.fetchall()
        conn.close()

        return [{
            'id': row['id'],
            'name': row['name'],
            'description': row['description'],
            'model': row['model'],
            'config': json.loads(row['config']),
            'status': row['status'],
            'created_at': row['created_at'],
            'updated_at': row['updated_at'],
            'version': row['version']
        } for row in rows]

    def update_agent(self, agent_id: int, **kwargs) -> bool:
        """Update agent"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # Build update query
        fields = []
        values = []

        for key, value in kwargs.items():
            if key in ['name', 'description', 'model', 'status']:
                fields.append(f"{key} = ?")
                values.append(value)
            elif key == 'config':
                fields.append("config = ?")
                values.append(json.dumps(value))

        if not fields:
            conn.close()
            return False

        # Add updated_at and increment version
        fields.append("updated_at = ?")
        fields.append("version = version + 1")
        values.append(datetime.utcnow().isoformat())
        values.append(agent_id)

        query = f"UPDATE agents SET {', '.join(fields)} WHERE id = ?"
        cursor.execute(query, values)

        affected = cursor.rowcount
        conn.commit()
        conn.close()

        return affected > 0

    def delete_agent(self, agent_id: int) -> bool:
        """Delete agent"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('DELETE FROM agents WHERE id = ?', (agent_id,))
        affected = cursor.rowcount

        conn.commit()
        conn.close()

        return affected > 0

    def add_execution_log(self, agent_id: int, execution_type: str, status: str,
                         input_data: Any = None, output_data: Any = None,
                         error_message: str = None, duration_ms: int = 0) -> int:
        """Add execution log"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO execution_logs
            (agent_id, execution_type, status, input_data, output_data, error_message, duration_ms, executed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            agent_id,
            execution_type,
            status,
            json.dumps(input_data) if input_data else None,
            json.dumps(output_data) if output_data else None,
            error_message,
            duration_ms,
            datetime.utcnow().isoformat()
        ))

        log_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return log_id

    def get_execution_logs(self, agent_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """Get execution logs for an agent"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT * FROM execution_logs
            WHERE agent_id = ?
            ORDER BY executed_at DESC
            LIMIT ?
        ''', (agent_id, limit))

        rows = cursor.fetchall()
        conn.close()

        return [{
            'id': row['id'],
            'agent_id': row['agent_id'],
            'execution_type': row['execution_type'],
            'status': row['status'],
            'input_data': json.loads(row['input_data']) if row['input_data'] else None,
            'output_data': json.loads(row['output_data']) if row['output_data'] else None,
            'error_message': row['error_message'],
            'duration_ms': row['duration_ms'],
            'executed_at': row['executed_at']
        } for row in rows]

    def add_validation(self, agent_id: int, validator: str, score: float,
                      feedback: str, suggestions: List[str]) -> int:
        """Add validation result"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO validations (agent_id, validator, score, feedback, suggestions, validated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            agent_id,
            validator,
            score,
            feedback,
            json.dumps(suggestions),
            datetime.utcnow().isoformat()
        ))

        validation_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return validation_id
