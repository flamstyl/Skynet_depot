"""
WebSocket Router - Real-time MCP message routing via WebSocket

Handles WebSocket connections, message routing, and heartbeat.
"""

import json
import logging
import asyncio
from typing import Dict, Set, Optional
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect, status
from fastapi.websockets import WebSocketState


logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for agents.

    Handles:
    - Connection lifecycle (connect, disconnect, heartbeat)
    - Message routing to connected agents
    - Connection registry
    """

    def __init__(self, routing_engine, redis_store, encryption=None):
        """
        Initialize connection manager.

        Args:
            routing_engine: RoutingEngine instance
            redis_store: RedisStore instance
            encryption: MessageEncryption instance (optional)
        """
        self.routing_engine = routing_engine
        self.redis_store = redis_store
        self.encryption = encryption

        # Active WebSocket connections
        # Format: {agent_id: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}

        # Connection metadata
        # Format: {agent_id: {connected_at, agent_type, ...}}
        self.connection_metadata: Dict[str, Dict] = {}

        # Heartbeat tasks
        self.heartbeat_tasks: Dict[str, asyncio.Task] = {}

        # Heartbeat interval (seconds)
        self.heartbeat_interval = 30

    # ========== CONNECTION LIFECYCLE ==========

    async def connect(
        self,
        websocket: WebSocket,
        agent_id: str,
        agent_type: str = "generic",
        channels: Optional[list] = None,
        priority: int = 5,
        metadata: Optional[dict] = None
    ):
        """
        Accept WebSocket connection and register agent.

        Args:
            websocket: WebSocket instance
            agent_id: Agent identifier
            agent_type: Agent type/role
            channels: Channels to subscribe to
            priority: Agent priority
            metadata: Additional metadata
        """
        await websocket.accept()

        # Store connection
        self.active_connections[agent_id] = websocket

        # Store metadata
        self.connection_metadata[agent_id] = {
            "agent_id": agent_id,
            "agent_type": agent_type,
            "connected_at": datetime.utcnow().isoformat(),
            "channels": channels or ["default"],
            "priority": priority,
            "metadata": metadata or {}
        }

        # Register in routing engine
        self.routing_engine.register_agent(
            agent_id=agent_id,
            agent_type=agent_type,
            channels=channels,
            priority=priority,
            metadata=metadata
        )

        # Set presence in Redis
        await self.redis_store.set_presence(agent_id, "online", ttl=60)

        # Start heartbeat task
        self.heartbeat_tasks[agent_id] = asyncio.create_task(
            self._heartbeat_loop(agent_id)
        )

        logger.info(f"🔌 Agent connected: {agent_id} (type: {agent_type}, channels: {channels})")

        # Send welcome message
        await self.send_control_message(
            websocket,
            action="connected",
            params={
                "agent_id": agent_id,
                "server_time": datetime.utcnow().isoformat(),
                "message": f"Connected to MCP Server as {agent_id}"
            }
        )

    async def disconnect(self, agent_id: str):
        """
        Close WebSocket connection and unregister agent.

        Args:
            agent_id: Agent identifier
        """
        if agent_id not in self.active_connections:
            logger.warning(f"Agent {agent_id} not in active connections")
            return

        # Cancel heartbeat
        if agent_id in self.heartbeat_tasks:
            self.heartbeat_tasks[agent_id].cancel()
            del self.heartbeat_tasks[agent_id]

        # Close WebSocket
        websocket = self.active_connections[agent_id]
        if websocket.client_state == WebSocketState.CONNECTED:
            try:
                await websocket.close()
            except Exception as e:
                logger.error(f"Error closing websocket for {agent_id}: {e}")

        # Remove from registry
        del self.active_connections[agent_id]
        if agent_id in self.connection_metadata:
            del self.connection_metadata[agent_id]

        # Unregister from routing engine
        self.routing_engine.unregister_agent(agent_id)

        # Update presence in Redis
        await self.redis_store.set_presence(agent_id, "offline", ttl=300)

        logger.info(f"🔌 Agent disconnected: {agent_id}")

    async def _heartbeat_loop(self, agent_id: str):
        """
        Send periodic heartbeat pings to keep connection alive.

        Args:
            agent_id: Agent identifier
        """
        try:
            while True:
                await asyncio.sleep(self.heartbeat_interval)

                if agent_id not in self.active_connections:
                    break

                websocket = self.active_connections[agent_id]

                # Send ping
                try:
                    await self.send_control_message(
                        websocket,
                        action="ping",
                        params={"timestamp": datetime.utcnow().isoformat()}
                    )

                    # Refresh presence in Redis
                    await self.redis_store.set_presence(agent_id, "online", ttl=60)

                    logger.debug(f"💓 Heartbeat sent to {agent_id}")

                except Exception as e:
                    logger.error(f"Heartbeat failed for {agent_id}: {e}")
                    # Connection likely dead, disconnect
                    await self.disconnect(agent_id)
                    break

        except asyncio.CancelledError:
            logger.debug(f"Heartbeat task cancelled for {agent_id}")

    # ========== MESSAGE ROUTING ==========

    async def route_message(self, message: dict) -> int:
        """
        Route MCP message to appropriate agent(s).

        Args:
            message: MCP message dictionary

        Returns:
            Number of recipients message was sent to
        """
        # Store message in Redis history
        from_agent = message.get("from_agent")
        if from_agent:
            await self.redis_store.append_history(from_agent, message)

        # Get recipients from routing engine
        recipients = self.routing_engine.route_message(message)

        if not recipients:
            logger.warning(f"No recipients for message {message.get('id')}")
            return 0

        # Send to all recipients
        sent_count = 0
        for recipient_id in recipients:
            if recipient_id in self.active_connections:
                try:
                    await self.send_mcp_message(
                        self.active_connections[recipient_id],
                        message
                    )

                    # Store in recipient's history
                    await self.redis_store.append_history(recipient_id, message)

                    sent_count += 1
                    logger.debug(f"Message {message.get('id')[:8]} → {recipient_id}")

                except Exception as e:
                    logger.error(f"Failed to send message to {recipient_id}: {e}")
            else:
                logger.warning(f"Recipient {recipient_id} not connected")

        return sent_count

    async def send_mcp_message(self, websocket: WebSocket, message: dict):
        """
        Send MCP message through WebSocket.

        Args:
            websocket: WebSocket connection
            message: MCP message dictionary
        """
        wrapper = {
            "type": "mcp_message",
            "data": message
        }

        await websocket.send_json(wrapper)

    async def send_control_message(self, websocket: WebSocket, action: str, params: dict):
        """
        Send control message through WebSocket.

        Args:
            websocket: WebSocket connection
            action: Control action
            params: Action parameters
        """
        wrapper = {
            "type": "control",
            "data": {
                "action": action,
                "params": params
            }
        }

        await websocket.send_json(wrapper)

    async def send_error_message(self, websocket: WebSocket, error: str, code: str = "ERROR"):
        """
        Send error message through WebSocket.

        Args:
            websocket: WebSocket connection
            error: Error description
            code: Error code
        """
        wrapper = {
            "type": "error",
            "data": {
                "error": error,
                "error_code": code,
                "timestamp": datetime.utcnow().isoformat()
            }
        }

        await websocket.send_json(wrapper)

    async def broadcast_to_channel(self, channel: str, message: dict):
        """
        Broadcast message to all agents on a channel.

        Args:
            channel: Channel name
            message: MCP message
        """
        subscribers = self.routing_engine.get_channel_subscribers(channel)

        sent_count = 0
        for agent_id in subscribers:
            if agent_id in self.active_connections:
                try:
                    await self.send_mcp_message(
                        self.active_connections[agent_id],
                        message
                    )
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to broadcast to {agent_id}: {e}")

        logger.info(f"📢 Broadcast on '{channel}': {sent_count}/{len(subscribers)} recipients")
        return sent_count

    # ========== MESSAGE HANDLING ==========

    async def handle_incoming_message(self, agent_id: str, raw_message: dict):
        """
        Handle incoming message from agent.

        Args:
            agent_id: Sender agent ID
            raw_message: Raw message from WebSocket
        """
        try:
            msg_type = raw_message.get("type")

            if msg_type == "mcp_message":
                # Route MCP message
                mcp_message = raw_message.get("data")

                if not mcp_message:
                    logger.error("No data in mcp_message")
                    return

                # Ensure from_agent matches connection
                mcp_message["from_agent"] = agent_id

                # Route the message
                await self.route_message(mcp_message)

            elif msg_type == "control":
                # Handle control message
                await self.handle_control_message(agent_id, raw_message.get("data", {}))

            else:
                logger.warning(f"Unknown message type from {agent_id}: {msg_type}")

        except Exception as e:
            logger.error(f"Error handling message from {agent_id}: {e}")
            websocket = self.active_connections.get(agent_id)
            if websocket:
                await self.send_error_message(websocket, str(e), "HANDLING_ERROR")

    async def handle_control_message(self, agent_id: str, control_data: dict):
        """
        Handle control messages (ping, pong, subscribe, etc.).

        Args:
            agent_id: Agent ID
            control_data: Control message data
        """
        action = control_data.get("action")
        params = control_data.get("params", {})

        websocket = self.active_connections.get(agent_id)
        if not websocket:
            return

        if action == "ping":
            # Respond with pong
            await self.send_control_message(
                websocket,
                action="pong",
                params={"timestamp": datetime.utcnow().isoformat()}
            )

        elif action == "pong":
            # Heartbeat response received
            logger.debug(f"Pong received from {agent_id}")

        elif action == "subscribe":
            # Subscribe to channel
            channel = params.get("channel")
            if channel:
                self.routing_engine.subscribe_to_channel(agent_id, channel)
                await self.send_control_message(
                    websocket,
                    action="subscribed",
                    params={"channel": channel}
                )

        elif action == "unsubscribe":
            # Unsubscribe from channel
            channel = params.get("channel")
            if channel:
                self.routing_engine.unsubscribe_from_channel(agent_id, channel)
                await self.send_control_message(
                    websocket,
                    action="unsubscribed",
                    params={"channel": channel}
                )

        else:
            logger.warning(f"Unknown control action from {agent_id}: {action}")

    # ========== UTILITIES ==========

    def get_connected_agents(self) -> list:
        """Get list of connected agent IDs"""
        return list(self.active_connections.keys())

    def is_agent_connected(self, agent_id: str) -> bool:
        """Check if agent is connected"""
        return agent_id in self.active_connections

    def get_connection_count(self) -> int:
        """Get total number of connections"""
        return len(self.active_connections)

    def get_connection_info(self, agent_id: str) -> Optional[dict]:
        """Get connection metadata for agent"""
        return self.connection_metadata.get(agent_id)

    async def disconnect_all(self):
        """Disconnect all agents (shutdown)"""
        agent_ids = list(self.active_connections.keys())

        for agent_id in agent_ids:
            await self.disconnect(agent_id)

        logger.info("All agents disconnected")
