"""
Routing Engine - Message routing logic for MCP Server

Handles direct routing, broadcast routing, and intelligent routing strategies.
"""

import logging
from typing import Dict, Any, List, Optional, Set
from enum import Enum
from collections import defaultdict


logger = logging.getLogger(__name__)


class RoutingStrategy(str, Enum):
    """Routing strategies"""
    DIRECT = "direct"  # 1-to-1 routing via to_agent
    BROADCAST = "broadcast"  # 1-to-many via channel
    ROUND_ROBIN = "round_robin"  # Load balancing across agents
    PRIORITY = "priority"  # Route to highest priority agent
    ALL = "all"  # Send to all agents (no filtering)


class RoutingEngine:
    """
    Routes MCP messages to appropriate agents.

    Supports:
    - Direct routing (to_agent specified)
    - Broadcast routing (channel specified)
    - Round-robin load balancing
    - Priority-based routing
    """

    def __init__(self):
        """Initialize routing engine"""
        # Registry of connected agents
        # Format: {agent_id: {agent_type, metadata, priority, ...}}
        self.agents: Dict[str, Dict[str, Any]] = {}

        # Channel subscriptions
        # Format: {channel_name: {agent_id1, agent_id2, ...}}
        self.channel_subscriptions: Dict[str, Set[str]] = defaultdict(set)

        # Round-robin counters per agent type
        self.round_robin_index: Dict[str, int] = defaultdict(int)

    # ========== AGENT REGISTRY ==========

    def register_agent(
        self,
        agent_id: str,
        agent_type: str = "generic",
        channels: Optional[List[str]] = None,
        priority: int = 5,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Register an agent in the routing engine.

        Args:
            agent_id: Unique agent identifier
            agent_type: Type/role of agent (planner, coder, researcher, etc.)
            channels: List of channels to subscribe to
            priority: Priority level (1-10, higher = more priority)
            metadata: Additional metadata

        Returns:
            True if registered successfully
        """
        if agent_id in self.agents:
            logger.warning(f"Agent {agent_id} already registered, updating...")

        self.agents[agent_id] = {
            "agent_id": agent_id,
            "agent_type": agent_type,
            "priority": priority,
            "metadata": metadata or {},
            "message_count": 0
        }

        # Subscribe to channels
        if channels:
            for channel in channels:
                self.subscribe_to_channel(agent_id, channel)

        logger.info(f"✅ Agent registered: {agent_id} (type: {agent_type}, priority: {priority})")
        return True

    def unregister_agent(self, agent_id: str) -> bool:
        """
        Unregister an agent.

        Args:
            agent_id: Agent identifier

        Returns:
            True if unregistered successfully
        """
        if agent_id not in self.agents:
            logger.warning(f"Agent {agent_id} not registered")
            return False

        # Remove from all channel subscriptions
        for channel in list(self.channel_subscriptions.keys()):
            self.channel_subscriptions[channel].discard(agent_id)

            # Clean up empty channels
            if not self.channel_subscriptions[channel]:
                del self.channel_subscriptions[channel]

        # Remove from registry
        del self.agents[agent_id]

        logger.info(f"❌ Agent unregistered: {agent_id}")
        return True

    def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get agent information"""
        return self.agents.get(agent_id)

    def get_all_agents(self) -> List[Dict[str, Any]]:
        """Get all registered agents"""
        return list(self.agents.values())

    def get_agents_by_type(self, agent_type: str) -> List[Dict[str, Any]]:
        """Get all agents of a specific type"""
        return [agent for agent in self.agents.values() if agent["agent_type"] == agent_type]

    # ========== CHANNEL MANAGEMENT ==========

    def subscribe_to_channel(self, agent_id: str, channel: str) -> bool:
        """
        Subscribe agent to a channel.

        Args:
            agent_id: Agent identifier
            channel: Channel name

        Returns:
            True if subscribed
        """
        if agent_id not in self.agents:
            logger.warning(f"Cannot subscribe: agent {agent_id} not registered")
            return False

        self.channel_subscriptions[channel].add(agent_id)
        logger.debug(f"Agent {agent_id} subscribed to channel '{channel}'")
        return True

    def unsubscribe_from_channel(self, agent_id: str, channel: str) -> bool:
        """
        Unsubscribe agent from a channel.

        Args:
            agent_id: Agent identifier
            channel: Channel name

        Returns:
            True if unsubscribed
        """
        if channel in self.channel_subscriptions:
            self.channel_subscriptions[channel].discard(agent_id)

            # Clean up empty channels
            if not self.channel_subscriptions[channel]:
                del self.channel_subscriptions[channel]

            logger.debug(f"Agent {agent_id} unsubscribed from channel '{channel}'")
            return True

        return False

    def get_channel_subscribers(self, channel: str) -> Set[str]:
        """Get all agents subscribed to a channel"""
        return self.channel_subscriptions.get(channel, set())

    def get_agent_channels(self, agent_id: str) -> List[str]:
        """Get all channels an agent is subscribed to"""
        channels = []
        for channel, subscribers in self.channel_subscriptions.items():
            if agent_id in subscribers:
                channels.append(channel)
        return channels

    # ========== ROUTING LOGIC ==========

    def route_message(self, message: Dict[str, Any]) -> List[str]:
        """
        Route a message to appropriate agent(s).

        Args:
            message: MCP message dictionary

        Returns:
            List of agent IDs to route the message to
        """
        to_agent = message.get("to_agent")
        msg_type = message.get("type")
        channel = message.get("channel", "default")

        # Direct routing
        if to_agent:
            return self._route_direct(to_agent, message)

        # Broadcast routing
        if msg_type == "broadcast" or not to_agent:
            return self._route_broadcast(channel, message)

        # Default: no recipients
        logger.warning(f"No routing strategy matched for message {message.get('id')}")
        return []

    def _route_direct(self, to_agent: str, message: Dict[str, Any]) -> List[str]:
        """
        Direct 1-to-1 routing.

        Args:
            to_agent: Target agent ID
            message: Message dictionary

        Returns:
            List with single agent ID if exists, empty list otherwise
        """
        if to_agent in self.agents:
            self.agents[to_agent]["message_count"] += 1
            logger.debug(f"Routing direct: {message.get('from_agent')} → {to_agent}")
            return [to_agent]
        else:
            logger.warning(f"Target agent not found: {to_agent}")
            return []

    def _route_broadcast(self, channel: str, message: Dict[str, Any]) -> List[str]:
        """
        Broadcast routing to all subscribers on a channel.

        Args:
            channel: Channel name
            message: Message dictionary

        Returns:
            List of agent IDs subscribed to channel
        """
        subscribers = self.get_channel_subscribers(channel)

        # Exclude sender from broadcast (don't send to self)
        from_agent = message.get("from_agent")
        if from_agent in subscribers:
            subscribers = subscribers.copy()
            subscribers.discard(from_agent)

        if subscribers:
            logger.debug(f"Routing broadcast on '{channel}': {len(subscribers)} recipients")
            for agent_id in subscribers:
                self.agents[agent_id]["message_count"] += 1
        else:
            logger.warning(f"No subscribers on channel '{channel}'")

        return list(subscribers)

    def _route_round_robin(self, agent_type: str, message: Dict[str, Any]) -> List[str]:
        """
        Round-robin routing among agents of same type.

        Args:
            agent_type: Type of agent to route to
            message: Message dictionary

        Returns:
            Single agent ID selected via round-robin
        """
        agents = self.get_agents_by_type(agent_type)

        if not agents:
            logger.warning(f"No agents of type '{agent_type}' available")
            return []

        # Get current index and increment
        index = self.round_robin_index[agent_type] % len(agents)
        self.round_robin_index[agent_type] += 1

        selected_agent = agents[index]["agent_id"]
        self.agents[selected_agent]["message_count"] += 1

        logger.debug(f"Routing round-robin to {agent_type}: {selected_agent}")
        return [selected_agent]

    def _route_priority(self, agent_type: str, message: Dict[str, Any]) -> List[str]:
        """
        Route to highest priority agent of given type.

        Args:
            agent_type: Type of agent
            message: Message dictionary

        Returns:
            Highest priority agent ID
        """
        agents = self.get_agents_by_type(agent_type)

        if not agents:
            logger.warning(f"No agents of type '{agent_type}' available")
            return []

        # Sort by priority (descending)
        agents_sorted = sorted(agents, key=lambda a: a["priority"], reverse=True)
        selected_agent = agents_sorted[0]["agent_id"]

        self.agents[selected_agent]["message_count"] += 1

        logger.debug(f"Routing by priority to {agent_type}: {selected_agent} (priority: {agents_sorted[0]['priority']})")
        return [selected_agent]

    # ========== ADVANCED ROUTING (Future) ==========

    def route_by_load(self, agent_type: str) -> List[str]:
        """
        Route to least loaded agent of given type.

        Args:
            agent_type: Type of agent

        Returns:
            Least loaded agent ID
        """
        agents = self.get_agents_by_type(agent_type)

        if not agents:
            return []

        # Find agent with lowest message_count
        agents_sorted = sorted(agents, key=lambda a: a["message_count"])
        return [agents_sorted[0]["agent_id"]]

    # ========== STATS & MONITORING ==========

    def get_routing_stats(self) -> Dict[str, Any]:
        """Get routing statistics"""
        return {
            "total_agents": len(self.agents),
            "agents_by_type": {
                agent_type: len(self.get_agents_by_type(agent_type))
                for agent_type in set(a["agent_type"] for a in self.agents.values())
            },
            "total_channels": len(self.channel_subscriptions),
            "channel_subscribers": {
                channel: len(subscribers)
                for channel, subscribers in self.channel_subscriptions.items()
            },
            "message_counts": {
                agent_id: agent["message_count"]
                for agent_id, agent in self.agents.items()
            }
        }

    def reset_stats(self):
        """Reset message counters"""
        for agent in self.agents.values():
            agent["message_count"] = 0
        logger.info("Routing stats reset")
