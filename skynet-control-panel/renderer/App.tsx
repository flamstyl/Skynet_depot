/**
 * Main App - Skynet Control Panel
 */

import React, { useState } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              ⚡ Skynet Control Panel
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-400">v1.0.0</span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700 px-6">
        <div className="flex space-x-1">
          {['dashboard', 'docker', 'mcp', 'n8n', 'oracle'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'docker' && <DockerPanel />}
        {activeTab === 'mcp' && <MCPPanel />}
        {activeTab === 'n8n' && <N8nPanel />}
        {activeTab === 'oracle' && <OraclePanel />}
      </main>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Docker Containers" value="12" status="running" />
      <StatCard title="MCP Servers" value="3" status="active" />
      <StatCard title="n8n Workflows" value="8" status="idle" />
      <StatCard title="Oracle Instances" value="2" status="running" />
    </div>
  );
}

function StatCard({ title, value, status }: { title: string; value: string; status: string }) {
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-sm font-medium text-slate-400 mb-2">{title}</h3>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold">{value}</span>
        <span className={`text-xs px-2 py-1 rounded ${
          status === 'running' ? 'bg-green-500/20 text-green-400' :
          status === 'active' ? 'bg-blue-500/20 text-blue-400' :
          'bg-gray-500/20 text-gray-400'
        }`}>
          {status}
        </span>
      </div>
    </div>
  );
}

function DockerPanel() {
  return <div className="bg-slate-800 rounded-lg p-6">Docker Management Panel (TODO)</div>;
}

function MCPPanel() {
  return <div className="bg-slate-800 rounded-lg p-6">MCP Servers Panel (TODO)</div>;
}

function N8nPanel() {
  return <div className="bg-slate-800 rounded-lg p-6">n8n Workflows Panel (TODO)</div>;
}

function OraclePanel() {
  return <div className="bg-slate-800 rounded-lg p-6">Oracle Cloud Panel (TODO)</div>;
}
