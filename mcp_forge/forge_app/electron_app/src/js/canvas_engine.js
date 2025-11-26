/**
 * Canvas Engine - MCP Forge
 * Visual drag & drop node editor for agent construction
 */

class CanvasEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // Canvas state
    this.nodes = [];
    this.connections = [];
    this.selectedNode = null;
    this.draggingNode = null;
    this.connecting = null;
    this.hoveredNode = null;

    // View state
    this.offset = { x: 0, y: 0 };
    this.zoom = 1.0;
    this.isDraggingCanvas = false;
    this.dragStart = { x: 0, y: 0 };

    // History for undo/redo
    this.history = [];
    this.historyIndex = -1;

    // Auto-save
    this.autoSaveInterval = null;

    this.init();
  }

  /**
   * Initialize canvas and event listeners
   */
  init() {
    this.resizeCanvas();
    this.setupEventListeners();
    this.startRenderLoop();
    this.setupAutoSave();

    console.log('🎨 Canvas Engine initialized');
  }

  /**
   * Resize canvas to fill container
   */
  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.onWheel.bind(this));
    this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));

    // Drag & drop from node library
    this.canvas.addEventListener('dragover', this.onDragOver.bind(this));
    this.canvas.addEventListener('drop', this.onDrop.bind(this));

    // Window resize
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' && this.selectedNode) {
        this.deleteNode(this.selectedNode);
      }
    });
  }

  /**
   * Mouse down handler
   */
  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.offset.x) / this.zoom;
    const y = (e.clientY - rect.top - this.offset.y) / this.zoom;

    const clickedNode = this.getNodeAt(x, y);

    if (clickedNode) {
      // Check if clicking on output port (for connection)
      if (this.isOnOutputPort(clickedNode, x, y)) {
        this.connecting = clickedNode;
        return;
      }

      // Start dragging node
      this.draggingNode = clickedNode;
      this.selectedNode = clickedNode;
      this.dragStart = { x: x - clickedNode.x, y: y - clickedNode.y };
      this.updatePropertiesPanel(clickedNode);
    } else {
      // Start dragging canvas
      this.isDraggingCanvas = true;
      this.dragStart = { x: e.clientX - this.offset.x, y: e.clientY - this.offset.y };
      this.selectedNode = null;
      this.updatePropertiesPanel(null);
    }
  }

  /**
   * Mouse move handler
   */
  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.offset.x) / this.zoom;
    const y = (e.clientY - rect.top - this.offset.y) / this.zoom;

    // Update hovered node
    this.hoveredNode = this.getNodeAt(x, y);

    if (this.draggingNode) {
      // Drag node
      this.draggingNode.x = x - this.dragStart.x;
      this.draggingNode.y = y - this.dragStart.y;
    } else if (this.isDraggingCanvas) {
      // Drag canvas
      this.offset.x = e.clientX - this.dragStart.x;
      this.offset.y = e.clientY - this.dragStart.y;
    } else if (this.connecting) {
      // Drawing connection
      this.tempConnection = { x, y };
    }
  }

  /**
   * Mouse up handler
   */
  onMouseUp(e) {
    if (this.connecting) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - this.offset.x) / this.zoom;
      const y = (e.clientY - rect.top - this.offset.y) / this.zoom;

      const targetNode = this.getNodeAt(x, y);
      if (targetNode && targetNode !== this.connecting) {
        this.createConnection(this.connecting, targetNode);
      }

      this.connecting = null;
      this.tempConnection = null;
    }

    this.draggingNode = null;
    this.isDraggingCanvas = false;

    // Save state for undo
    this.saveState();
  }

  /**
   * Wheel handler for zoom
   */
  onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoom *= delta;
    this.zoom = Math.max(0.1, Math.min(3.0, this.zoom));
    this.updateZoomDisplay();
  }

  /**
   * Double click to edit node
   */
  onDoubleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.offset.x) / this.zoom;
    const y = (e.clientY - rect.top - this.offset.y) / this.zoom;

    const node = this.getNodeAt(x, y);
    if (node) {
      this.editNode(node);
    }
  }

  /**
   * Drag over handler
   */
  onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  /**
   * Drop handler - create node from library
   */
  onDrop(e) {
    e.preventDefault();

    const nodeType = e.dataTransfer.getData('node-type');
    if (!nodeType) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.offset.x) / this.zoom;
    const y = (e.clientY - rect.top - this.offset.y) / this.zoom;

    this.createNode(nodeType, x, y);
  }

  /**
   * Create a new node
   */
  createNode(type, x, y) {
    const node = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      x: x,
      y: y,
      width: 180,
      height: 100,
      config: this.getDefaultConfig(type),
      inputs: this.getInputPorts(type),
      outputs: this.getOutputPorts(type)
    };

    this.nodes.push(node);
    this.updateNodeCount();
    this.saveState();

    console.log('Created node:', node);
    return node;
  }

  /**
   * Delete a node
   */
  deleteNode(node) {
    // Remove connections
    this.connections = this.connections.filter(
      conn => conn.from !== node.id && conn.to !== node.id
    );

    // Remove node
    this.nodes = this.nodes.filter(n => n.id !== node.id);

    this.selectedNode = null;
    this.updateNodeCount();
    this.updateConnectionCount();
    this.updatePropertiesPanel(null);
    this.saveState();
  }

  /**
   * Create connection between nodes
   */
  createConnection(fromNode, toNode) {
    // Check if connection already exists
    const exists = this.connections.some(
      conn => conn.from === fromNode.id && conn.to === toNode.id
    );

    if (!exists) {
      this.connections.push({
        id: `conn_${Date.now()}`,
        from: fromNode.id,
        to: toNode.id,
        type: 'data'
      });

      this.updateConnectionCount();
      console.log('Created connection:', fromNode.id, '->', toNode.id);
    }
  }

  /**
   * Get node at position
   */
  getNodeAt(x, y) {
    // Check in reverse order (top nodes first)
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      if (x >= node.x && x <= node.x + node.width &&
          y >= node.y && y <= node.y + node.height) {
        return node;
      }
    }
    return null;
  }

  /**
   * Check if click is on output port
   */
  isOnOutputPort(node, x, y) {
    const portX = node.x + node.width;
    const portY = node.y + node.height / 2;
    const distance = Math.sqrt(Math.pow(x - portX, 2) + Math.pow(y - portY, 2));
    return distance < 10;
  }

  /**
   * Get default config for node type
   */
  getDefaultConfig(type) {
    const configs = {
      'claude-agent': {
        model: 'claude-sonnet-4',
        temperature: 0.7,
        max_tokens: 4096,
        role: 'You are a helpful assistant.'
      },
      'gpt-agent': {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 4096,
        role: 'You are a helpful assistant.'
      },
      'gemini-agent': {
        model: 'gemini-pro',
        temperature: 0.7,
        max_tokens: 4096,
        role: 'You are a helpful assistant.'
      },
      'cron-trigger': {
        schedule: '0 9 * * *',
        timezone: 'UTC'
      },
      'folder-watcher': {
        path: './inbox',
        patterns: ['*.txt', '*.md'],
        recursive: false
      },
      'memory-block': {
        type: 'persistent',
        path: './memory'
      }
    };

    return configs[type] || {};
  }

  /**
   * Get input ports for node type
   */
  getInputPorts(type) {
    const agentTypes = ['claude-agent', 'gpt-agent', 'gemini-agent', 'codestral-agent'];
    if (agentTypes.includes(type)) {
      return ['trigger', 'input'];
    }
    return ['input'];
  }

  /**
   * Get output ports for node type
   */
  getOutputPorts(type) {
    return ['output'];
  }

  /**
   * Render loop
   */
  startRenderLoop() {
    const render = () => {
      this.render();
      requestAnimationFrame(render);
    };
    render();
  }

  /**
   * Render canvas
   */
  render() {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);

    this.ctx.save();
    this.ctx.translate(this.offset.x, this.offset.y);
    this.ctx.scale(this.zoom, this.zoom);

    // Render connections
    this.renderConnections();

    // Render temp connection
    if (this.connecting && this.tempConnection) {
      this.renderTempConnection();
    }

    // Render nodes
    this.renderNodes();

    this.ctx.restore();
  }

  /**
   * Render all nodes
   */
  renderNodes() {
    this.nodes.forEach(node => {
      this.renderNode(node);
    });
  }

  /**
   * Render single node
   */
  renderNode(node) {
    const isSelected = node === this.selectedNode;
    const isHovered = node === this.hoveredNode;

    // Node background
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.strokeStyle = isSelected ? '#ff6b35' : (isHovered ? '#2a2a2a' : '#2a2a2a');
    this.ctx.lineWidth = isSelected ? 2 : 1;

    this.ctx.beginPath();
    this.ctx.roundRect(node.x, node.y, node.width, node.height, 8);
    this.ctx.fill();
    this.ctx.stroke();

    // Node header
    const headerHeight = 30;
    this.ctx.fillStyle = this.getNodeColor(node.type);
    this.ctx.beginPath();
    this.ctx.roundRect(node.x, node.y, node.width, headerHeight, [8, 8, 0, 0]);
    this.ctx.fill();

    // Node title
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px sans-serif';
    this.ctx.fillText(this.getNodeLabel(node.type), node.x + 10, node.y + 20);

    // Output port
    this.ctx.fillStyle = '#8b5cf6';
    this.ctx.beginPath();
    this.ctx.arc(node.x + node.width, node.y + node.height / 2, 6, 0, Math.PI * 2);
    this.ctx.fill();

    // Input port
    this.ctx.fillStyle = '#3b82f6';
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y + node.height / 2, 6, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * Render connections
   */
  renderConnections() {
    this.connections.forEach(conn => {
      const fromNode = this.nodes.find(n => n.id === conn.from);
      const toNode = this.nodes.find(n => n.id === conn.to);

      if (fromNode && toNode) {
        this.renderConnection(
          fromNode.x + fromNode.width,
          fromNode.y + fromNode.height / 2,
          toNode.x,
          toNode.y + toNode.height / 2
        );
      }
    });
  }

  /**
   * Render single connection
   */
  renderConnection(x1, y1, x2, y2) {
    this.ctx.strokeStyle = '#8b5cf6';
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);

    // Bezier curve
    const dx = Math.abs(x2 - x1);
    const offsetX = Math.min(dx / 2, 100);

    this.ctx.bezierCurveTo(
      x1 + offsetX, y1,
      x2 - offsetX, y2,
      x2, y2
    );

    this.ctx.stroke();
  }

  /**
   * Render temporary connection while dragging
   */
  renderTempConnection() {
    const fromNode = this.connecting;
    this.renderConnection(
      fromNode.x + fromNode.width,
      fromNode.y + fromNode.height / 2,
      this.tempConnection.x,
      this.tempConnection.y
    );
  }

  /**
   * Get node color by type
   */
  getNodeColor(type) {
    const colors = {
      'claude-agent': '#8b5cf6',
      'gpt-agent': '#10b981',
      'gemini-agent': '#3b82f6',
      'codestral-agent': '#ff6b35',
      'cron-trigger': '#f59e0b',
      'folder-watcher': '#06b6d4',
      'email-trigger': '#ec4899',
      'memory-block': '#6366f1',
      'prompt-template': '#8b5cf6',
      'drive-output': '#10b981',
      'webhook-output': '#3b82f6'
    };

    return colors[type] || '#606060';
  }

  /**
   * Get node label by type
   */
  getNodeLabel(type) {
    return type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Update properties panel
   */
  updatePropertiesPanel(node) {
    const panelContent = document.getElementById('panel-content');
    if (!panelContent) return;

    if (!node) {
      panelContent.innerHTML = '<div class="empty-state"><p>Select a node to edit properties</p></div>';
      return;
    }

    // TODO: Generate form based on node config
    panelContent.innerHTML = `
      <div style="color: #e0e0e0;">
        <h4 style="margin-bottom: 16px;">${this.getNodeLabel(node.type)}</h4>
        <pre style="font-size: 11px; color: #a0a0a0;">${JSON.stringify(node.config, null, 2)}</pre>
      </div>
    `;
  }

  /**
   * Edit node (double-click)
   */
  editNode(node) {
    console.log('Edit node:', node);
    // TODO: Open modal or inline editor
  }

  /**
   * Zoom controls
   */
  zoomIn() {
    this.zoom *= 1.2;
    this.zoom = Math.min(3.0, this.zoom);
    this.updateZoomDisplay();
  }

  zoomOut() {
    this.zoom *= 0.8;
    this.zoom = Math.max(0.1, this.zoom);
    this.updateZoomDisplay();
  }

  fitToScreen() {
    // TODO: Calculate zoom to fit all nodes
    this.zoom = 1.0;
    this.offset = { x: 0, y: 0 };
    this.updateZoomDisplay();
  }

  updateZoomDisplay() {
    const zoomEl = document.getElementById('zoom-level');
    if (zoomEl) {
      zoomEl.textContent = `${Math.round(this.zoom * 100)}%`;
    }
  }

  /**
   * Update UI counters
   */
  updateNodeCount() {
    const el = document.getElementById('node-count');
    if (el) {
      el.textContent = `${this.nodes.length} nodes`;
    }
  }

  updateConnectionCount() {
    const el = document.getElementById('connection-count');
    if (el) {
      el.textContent = `${this.connections.length} connections`;
    }
  }

  /**
   * Undo/Redo
   */
  saveState() {
    const state = {
      nodes: JSON.parse(JSON.stringify(this.nodes)),
      connections: JSON.parse(JSON.stringify(this.connections))
    };

    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(state);
    this.historyIndex++;

    // Limit history size
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.loadState(this.history[this.historyIndex]);
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.loadState(this.history[this.historyIndex]);
    }
  }

  loadState(state) {
    this.nodes = JSON.parse(JSON.stringify(state.nodes));
    this.connections = JSON.parse(JSON.stringify(state.connections));
    this.updateNodeCount();
    this.updateConnectionCount();
  }

  /**
   * Auto-save
   */
  setupAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      // TODO: Auto-save to local storage or file
      console.log('Auto-save triggered');
    }, 30000); // 30 seconds
  }

  /**
   * Export/Import
   */
  exportData() {
    return {
      version: '1.0.0',
      metadata: {
        name: 'Untitled Agent',
        description: '',
        author: '',
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      },
      nodes: this.nodes,
      connections: this.connections,
      settings: {
        zoom: this.zoom,
        offset: this.offset
      }
    };
  }

  importData(data) {
    if (data.nodes) this.nodes = data.nodes;
    if (data.connections) this.connections = data.connections;
    if (data.settings) {
      this.zoom = data.settings.zoom || 1.0;
      this.offset = data.settings.offset || { x: 0, y: 0 };
    }

    this.updateNodeCount();
    this.updateConnectionCount();
    this.updateZoomDisplay();
    this.saveState();
  }
}

// Make drag work from library
document.addEventListener('DOMContentLoaded', () => {
  const nodeItems = document.querySelectorAll('.node-item');
  nodeItems.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      const nodeType = item.dataset.nodeType;
      e.dataTransfer.setData('node-type', nodeType);
      e.dataTransfer.effectAllowed = 'copy';
    });
  });
});
