# 🏗️ Architecture des MCP Servers - Skynet Depot

**Documentation technique de l'architecture des serveurs MCP**

---

## 📋 Vue d'ensemble

Ce projet fournit deux serveurs MCP (Model Context Protocol) professionnels pour Claude Code CLI :

1. **MCP DevOps Workspace** - Environnement DevOps complet
2. **MCP Fedora Remote Desktop Control** - Gestion bureau à distance

### Stack technique

- **Langage** : TypeScript
- **Runtime** : Node.js >= 18
- **SDK** : @modelcontextprotocol/sdk
- **Validation** : Zod (v3.25+)
- **Transport** : stdio (local), HTTP streamable (futur)

---

## 🎯 Principes de conception

### 1. Modularité

Chaque MCP server est organisé en modules fonctionnels :

```
src/
├── tools/          # Tools MCP organisés par domaine
├── services/       # Couche d'abstraction pour commandes système
├── models/         # Types, schémas Zod, erreurs
├── utils/          # Utilitaires transverses
├── config/         # Configuration (whitelists, politiques)
├── server.ts       # Enregistrement des tools MCP
└── index.ts        # Point d'entrée (stdio transport)
```

### 2. Sécurité par défaut

#### Principe du moindre privilège
- Whitelist de commandes autorisées
- Validation stricte des paths (pas de `..`, `~`)
- Paths limités aux répertoires autorisés

#### Validation à tous les niveaux
```typescript
Input (user) → Zod Schema → Validators → Service → Command Execution → Output
```

#### Pas de secrets dans les logs
- Filtrage automatique via logger sanitisé
- Patterns : `password=***`, `token=***`, `api_key=***`

### 3. Extensibilité

#### Ajouter un nouveau tool

1. Créer le fichier du tool avec schema Zod
2. Implémenter le handler
3. Exporter la définition
4. Enregistrer dans `server.ts`

#### Ajouter un nouveau service

1. Créer le service avec interface claire
2. Utiliser `ShellExecutor` pour commandes système
3. Gérer les erreurs via classes d'erreurs personnalisées

---

## 🔧 Architecture MCP DevOps Workspace

### Modules fonctionnels

#### 1. dev_env (Environnements de développement)
- **Service** : -
- **Tools** :
  - `create_project` : Crée structure projet
  - `setup_python_env` : Crée venv Python
  - `setup_node_env` : Init projet Node.js
  - `install_dependencies` : Installe dépendances
  - `list_envs` : Liste environnements

#### 2. docker (Administration Docker)
- **Service** : `DockerService`
- **Tools** :
  - `list_containers` : Liste containers
  - `container_logs` : Récupère logs
  - `start_container`, `stop_container`, `restart_container`
  - `list_images` : Liste images

#### 3. system (Monitoring système)
- **Service** : -
- **Tools** :
  - `get_system_info` : OS, kernel, uptime
  - `get_resource_usage` : CPU, RAM, disque
  - `list_services` : Services systemd
  - `service_status`, `restart_service`

#### 4. project (Gestion fichiers & Git)
- **Service** : `FileService`, `GitService`
- **Tools** :
  - `list_directory`, `read_file`, `write_file`
  - `git_init`, `git_status`, `git_commit`, `git_push`

#### 5. graphics (Graphisme)
- **Service** : -
- **Tools** :
  - `resize_image`, `convert_format`, `generate_thumbnail`

### Services transverses

#### ShellExecutor
```typescript
class ShellExecutor {
  execute(command, options): Promise<CommandResult>
  run(command, options): Promise<string> // throws on error
  commandExists(command): Promise<boolean>
}
```

- Timeout configurables
- Gestion des erreurs robuste
- Support sudo (avec prudence)

#### Logger
```typescript
class Logger {
  debug(message, ...args)
  info(message, ...args)
  warn(message, ...args)
  error(message, ...args)
  // Sanitization automatique des secrets
}
```

### Flux d'exécution typique

```
Claude Code CLI
      ↓
   stdio transport
      ↓
MCP Server (index.ts)
      ↓
CallToolRequest
      ↓
server.ts (find tool)
      ↓
Tool handler
      ↓
Zod validation (input)
      ↓
Validators (security)
      ↓
Service (business logic)
      ↓
ShellExecutor (command execution)
      ↓
Zod validation (output)
      ↓
Response to Claude
```

---

## 🖥️ Architecture MCP Fedora Remote Desktop

### Modules fonctionnels

#### 1. detection
- **Tools** :
  - `detect_environment` : Détecte Wayland/X11, backends installés
  - `list_remote_desktop_backends` : Liste backends supportés

#### 2. configuration
- **Service** : `BackendManager`, `FirewallService`
- **Tools** :
  - `install_backend` : Installe via dnf
  - `configure_backend` : Configure port, password, encryption
  - `configure_firewall` : Gère firewalld

#### 3. service
- **Tools** :
  - `start_remote_desktop`, `stop_remote_desktop`
  - `status_remote_desktop`

#### 4. network
- **Service** : `NetworkService`
- **Tools** :
  - `test_port_accessibility` : Test localhost/LAN/WAN
  - `get_network_info` : IP, interfaces

#### 5. instructions
- **Tools** :
  - `generate_ssh_tunnel_instructions` : Génère commandes SSH tunnel

### Backends supportés

Système de backends avec interface commune :

```typescript
interface RemoteDesktopBackend {
  id: string;
  name: string;
  protocol: "vnc" | "rdp";
  defaultPort: number;
  compatibility: { wayland: boolean; x11: boolean };

  isInstalled(): Promise<boolean>;
  install(): Promise<void>;
  configure(config): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): Promise<BackendStatus>;
}
```

Implémentations :
- `GnomeRemoteDesktopBackend` (RDP, Wayland+X11)
- `TigerVNCBackend` (VNC, X11)
- `WayVNCBackend` (VNC, Wayland)
- `XrdpBackend` (RDP, X11)

### Niveaux de sécurité

```
Niveau 1 (Secure) :
  Service → localhost:PORT
  Accès → SSH Tunnel uniquement
  Firewall → zone: trusted

Niveau 2 (Moderate) :
  Service → 0.0.0.0:PORT (LAN interface)
  Accès → LAN uniquement
  Firewall → zone: home, source: 192.168.x.x/24

Niveau 3 (Dangerous) :
  Service → 0.0.0.0:PORT
  Accès → Internet
  Firewall → zone: public
  ⚠️ Avertissements + mot de passe fort requis
```

---

## 📊 Diagrammes

### Flux d'exécution MCP

```
┌─────────────────────┐
│  Claude Code CLI    │
│                     │
│  User: "Create      │
│   Python project"   │
└──────────┬──────────┘
           │ JSON-RPC 2.0 (stdio)
           ↓
┌─────────────────────┐
│  MCP Server         │
│                     │
│  CallToolRequest    │
│  name: "create_     │
│   project"          │
│  args: {...}        │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Tool Handler       │
│                     │
│  1. Zod validation  │
│  2. Security checks │
│  3. Execute logic   │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Service Layer      │
│                     │
│  FileService,       │
│  GitService, etc.   │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  ShellExecutor      │
│                     │
│  Executes system    │
│  commands safely    │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  System             │
│                     │
│  Linux commands     │
│  (mkdir, git, etc.) │
└─────────────────────┘
```

### Architecture de sécurité

```
┌─────────────────────────────────────────────┐
│           Security Layers                   │
├─────────────────────────────────────────────┤
│  1. Input Validation (Zod schemas)          │
│     └─ Type checking, required fields       │
├─────────────────────────────────────────────┤
│  2. Path Validation                         │
│     └─ No path traversal, whitelist paths   │
├─────────────────────────────────────────────┤
│  3. Command Whitelisting                    │
│     └─ Only pre-approved commands           │
├─────────────────────────────────────────────┤
│  4. Input Sanitization                      │
│     └─ Strip dangerous characters           │
├─────────────────────────────────────────────┤
│  5. Execution with timeout                  │
│     └─ Kill if exceeds limit                │
├─────────────────────────────────────────────┤
│  6. Log sanitization                        │
│     └─ Remove secrets before logging        │
├─────────────────────────────────────────────┤
│  7. Error handling                          │
│     └─ Don't leak sensitive info            │
└─────────────────────────────────────────────┘
```

---

## 🔄 Patterns et bonnes pratiques

### 1. Gestion des erreurs

```typescript
// Utiliser des classes d'erreurs spécifiques
throw new SecurityError("Path traversal detected", { path });
throw new CommandExecutionError("Docker not running");
throw new ValidationError("Invalid project name");

// Catcher et transformer en réponse MCP
try {
  const result = await tool.handler(input);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
} catch (error) {
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        success: false,
        error: error.name,
        message: error.message,
      })
    }],
    isError: true,
  };
}
```

### 2. Validation en cascade

```typescript
// Schema Zod
const schema = z.object({
  projectPath: z.string(),
  name: z.string().regex(/^[a-zA-Z0-9_-]+$/),
});

// Validation fonctionnelle
const validatedInput = schema.parse(input);
const safePath = validatePath(validatedInput.projectPath);
validateProjectName(validatedInput.name);

// Exécution sécurisée
await service.execute(safePath, validatedInput.name);
```

### 3. Separation of Concerns

```
Tools (interface MCP)
  ↓ uses
Services (business logic)
  ↓ uses
ShellExecutor / FileSystem (infrastructure)
```

---

## 📈 Performance

### Optimisations implémentées

1. **Cache** (futur) :
   - Résultats système (uptime, version OS) cachés
   - Invalidation intelligente

2. **Async/Await** :
   - Opérations I/O non bloquantes
   - Promesses parallèles quand possible

3. **Timeouts** :
   - Toutes les commandes ont un timeout
   - Évite les blocages infinis

### Métriques (cibles futures)

- Temps de réponse moyen : < 500ms
- Timeout par défaut : 30s
- Max file size : 10 MB
- Max concurrent tools : Illimité (Node.js async)

---

## 🧪 Tests

### Structure des tests

```
tests/
├── unit/
│   ├── services/
│   ├── utils/
│   └── validators/
└── integration/
    ├── tools/
    └── scenarios/
```

### Stratégie de tests

1. **Tests unitaires** :
   - Validators
   - Services (avec mocks)
   - Utilitaires

2. **Tests d'intégration** :
   - Tools MCP end-to-end
   - Scénarios réels

3. **Tests de sécurité** :
   - Path traversal attacks
   - Command injection attempts
   - Input validation bypass

---

## 🚀 Déploiement

### Méthodes de déploiement

#### 1. Local (développement)
```bash
npm run build
npm start
```

#### 2. systemd service (production)
```ini
[Unit]
Description=MCP DevOps Workspace
After=network.target

[Service]
Type=simple
User=mcp
WorkingDirectory=/opt/mcp-devops-workspace
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

#### 3. Docker (isolation complète)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

---

## 📝 Maintenance

### Logs

- **Emplacement** : stdout/stderr (capturés par Claude Code)
- **Niveaux** : debug, info, warn, error
- **Format** : `[2025-01-XX] [LEVEL] message`
- **Sanitization** : Automatique (secrets masqués)

### Monitoring (futur)

- Métriques Prometheus
- Healthchecks
- Alerting sur erreurs fréquentes

---

**Documentation maintenue par Skynet Depot**
