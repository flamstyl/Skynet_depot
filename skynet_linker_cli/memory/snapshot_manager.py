"""
Snapshot Manager - Periodic state snapshots for backup and analysis

Creates point-in-time snapshots of the entire MCP server state.
"""

import json
import logging
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path


logger = logging.getLogger(__name__)


class SnapshotManager:
    """
    Manages periodic snapshots of MCP server state.

    Snapshots include:
    - All agent contexts
    - All active sessions
    - Routing engine state
    - Connection metadata
    """

    def __init__(
        self,
        redis_store,
        routing_engine,
        connection_manager,
        snapshot_dir: str = "snapshots",
        interval_minutes: int = 30
    ):
        """
        Initialize snapshot manager.

        Args:
            redis_store: RedisStore instance
            routing_engine: RoutingEngine instance
            connection_manager: ConnectionManager instance
            snapshot_dir: Directory to save snapshots
            interval_minutes: Snapshot interval in minutes
        """
        self.redis = redis_store
        self.routing_engine = routing_engine
        self.connection_manager = connection_manager

        self.snapshot_dir = Path(snapshot_dir)
        self.snapshot_dir.mkdir(exist_ok=True)

        self.interval_minutes = interval_minutes
        self.snapshot_task: Optional[asyncio.Task] = None
        self.running = False

    # ========== SNAPSHOT CREATION ==========

    async def create_snapshot(self) -> Dict[str, Any]:
        """
        Create a complete state snapshot.

        Returns:
            Snapshot dictionary
        """
        logger.info("📸 Creating snapshot...")

        timestamp = datetime.utcnow().isoformat()

        snapshot = {
            "timestamp": timestamp,
            "version": "1.0",
            "server_state": await self._capture_server_state(),
            "routing_state": await self._capture_routing_state(),
            "storage_state": await self._capture_storage_state(),
            "connection_state": await self._capture_connection_state()
        }

        # Save to Redis
        await self.redis.create_snapshot(snapshot)

        # Save to file
        await self._save_snapshot_to_file(snapshot)

        logger.info(f"✅ Snapshot created: {timestamp}")

        return snapshot

    async def _capture_server_state(self) -> Dict[str, Any]:
        """Capture general server state"""
        return {
            "uptime": 0,  # TODO: Track uptime
            "snapshot_time": datetime.utcnow().isoformat()
        }

    async def _capture_routing_state(self) -> Dict[str, Any]:
        """Capture routing engine state"""
        return self.routing_engine.get_routing_stats()

    async def _capture_storage_state(self) -> Dict[str, Any]:
        """Capture Redis storage state"""
        return await self.redis.get_stats()

    async def _capture_connection_state(self) -> Dict[str, Any]:
        """Capture active connections"""
        connected_agents = self.connection_manager.get_connected_agents()

        connections = []
        for agent_id in connected_agents:
            conn_info = self.connection_manager.get_connection_info(agent_id)
            if conn_info:
                connections.append(conn_info)

        return {
            "total_connections": len(connections),
            "connections": connections
        }

    # ========== FILE MANAGEMENT ==========

    async def _save_snapshot_to_file(self, snapshot: Dict[str, Any]) -> Path:
        """
        Save snapshot to JSON file.

        Args:
            snapshot: Snapshot dictionary

        Returns:
            Path to saved file
        """
        timestamp = snapshot["timestamp"].replace(":", "-")
        filename = f"snapshot_{timestamp}.json"
        filepath = self.snapshot_dir / filename

        try:
            with open(filepath, 'w') as f:
                json.dump(snapshot, f, indent=2)

            logger.info(f"Snapshot saved to {filepath}")

            # Cleanup old snapshots
            await self._cleanup_old_snapshots()

            return filepath

        except Exception as e:
            logger.error(f"Failed to save snapshot to file: {e}")
            raise

    async def _cleanup_old_snapshots(self, max_files: int = 10):
        """
        Keep only the most recent N snapshot files.

        Args:
            max_files: Maximum number of snapshot files to keep
        """
        try:
            snapshot_files = sorted(self.snapshot_dir.glob("snapshot_*.json"))

            if len(snapshot_files) > max_files:
                files_to_delete = snapshot_files[:-max_files]

                for file in files_to_delete:
                    file.unlink()
                    logger.debug(f"Deleted old snapshot: {file.name}")

                logger.info(f"Cleaned up {len(files_to_delete)} old snapshots")

        except Exception as e:
            logger.error(f"Failed to cleanup old snapshots: {e}")

    # ========== SNAPSHOT RETRIEVAL ==========

    async def get_latest_snapshot(self) -> Optional[Dict[str, Any]]:
        """
        Get the most recent snapshot.

        Returns:
            Snapshot dictionary or None
        """
        # Try Redis first
        snapshot = await self.redis.get_latest_snapshot()

        if snapshot:
            return snapshot

        # Fallback to file system
        snapshot_files = sorted(self.snapshot_dir.glob("snapshot_*.json"))

        if not snapshot_files:
            logger.warning("No snapshots found")
            return None

        latest_file = snapshot_files[-1]

        try:
            with open(latest_file, 'r') as f:
                snapshot = json.load(f)

            logger.info(f"Loaded snapshot from {latest_file.name}")
            return snapshot

        except Exception as e:
            logger.error(f"Failed to load snapshot from file: {e}")
            return None

    async def get_snapshot_by_timestamp(self, timestamp: str) -> Optional[Dict[str, Any]]:
        """
        Get snapshot by timestamp.

        Args:
            timestamp: ISO 8601 timestamp

        Returns:
            Snapshot dictionary or None
        """
        filename = f"snapshot_{timestamp.replace(':', '-')}.json"
        filepath = self.snapshot_dir / filename

        if not filepath.exists():
            logger.warning(f"Snapshot not found: {filename}")
            return None

        try:
            with open(filepath, 'r') as f:
                snapshot = json.load(f)

            return snapshot

        except Exception as e:
            logger.error(f"Failed to load snapshot: {e}")
            return None

    async def list_snapshots(self) -> list:
        """
        List all available snapshots.

        Returns:
            List of snapshot metadata dictionaries
        """
        snapshot_files = sorted(self.snapshot_dir.glob("snapshot_*.json"))

        snapshots = []
        for file in snapshot_files:
            try:
                with open(file, 'r') as f:
                    data = json.load(f)

                snapshots.append({
                    "timestamp": data.get("timestamp"),
                    "file": file.name,
                    "size_bytes": file.stat().st_size
                })

            except Exception as e:
                logger.warning(f"Failed to read snapshot {file.name}: {e}")

        return snapshots

    # ========== SNAPSHOT RESTORATION ==========

    async def restore_snapshot(self, snapshot: Dict[str, Any]) -> bool:
        """
        Restore server state from a snapshot.

        ⚠️ WARNING: This will overwrite current state!

        Args:
            snapshot: Snapshot dictionary

        Returns:
            True if successful
        """
        logger.warning("⚠️ Restoring snapshot - this will overwrite current state!")

        try:
            # TODO: Implement full restoration logic
            # For MVP, log warning that this is not implemented

            logger.error("Snapshot restoration not fully implemented")
            return False

        except Exception as e:
            logger.error(f"Failed to restore snapshot: {e}")
            return False

    # ========== PERIODIC SNAPSHOTS ==========

    async def start_periodic_snapshots(self):
        """Start periodic snapshot creation"""
        if self.running:
            logger.warning("Periodic snapshots already running")
            return

        self.running = True
        self.snapshot_task = asyncio.create_task(self._snapshot_loop())

        logger.info(f"🔁 Periodic snapshots started (interval: {self.interval_minutes} minutes)")

    async def stop_periodic_snapshots(self):
        """Stop periodic snapshot creation"""
        if not self.running:
            return

        self.running = False

        if self.snapshot_task:
            self.snapshot_task.cancel()
            try:
                await self.snapshot_task
            except asyncio.CancelledError:
                pass

        logger.info("🛑 Periodic snapshots stopped")

    async def _snapshot_loop(self):
        """Background task for periodic snapshots"""
        try:
            while self.running:
                await asyncio.sleep(self.interval_minutes * 60)

                if self.running:
                    try:
                        await self.create_snapshot()
                    except Exception as e:
                        logger.error(f"Failed to create periodic snapshot: {e}")

        except asyncio.CancelledError:
            logger.debug("Snapshot loop cancelled")

    # ========== EXPORT & IMPORT ==========

    async def export_snapshot(
        self,
        snapshot: Dict[str, Any],
        filepath: str
    ) -> bool:
        """
        Export snapshot to a specific file.

        Args:
            snapshot: Snapshot dictionary
            filepath: Export file path

        Returns:
            True if successful
        """
        try:
            with open(filepath, 'w') as f:
                json.dump(snapshot, f, indent=2)

            logger.info(f"Snapshot exported to {filepath}")
            return True

        except Exception as e:
            logger.error(f"Failed to export snapshot: {e}")
            return False

    async def import_snapshot(self, filepath: str) -> Optional[Dict[str, Any]]:
        """
        Import snapshot from file.

        Args:
            filepath: Import file path

        Returns:
            Snapshot dictionary or None
        """
        try:
            with open(filepath, 'r') as f:
                snapshot = json.load(f)

            logger.info(f"Snapshot imported from {filepath}")
            return snapshot

        except Exception as e:
            logger.error(f"Failed to import snapshot: {e}")
            return None

    # ========== ANALYTICS ==========

    async def get_snapshot_stats(self) -> Dict[str, Any]:
        """
        Get statistics about snapshots.

        Returns:
            Statistics dictionary
        """
        snapshots = await self.list_snapshots()

        if not snapshots:
            return {
                "total_snapshots": 0,
                "oldest": None,
                "newest": None,
                "total_size_bytes": 0
            }

        total_size = sum(s["size_bytes"] for s in snapshots)

        return {
            "total_snapshots": len(snapshots),
            "oldest": snapshots[0]["timestamp"] if snapshots else None,
            "newest": snapshots[-1]["timestamp"] if snapshots else None,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / 1024 / 1024, 2)
        }
