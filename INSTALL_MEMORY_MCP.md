# Guide d'Installation et de Déploiement pour le Serveur de Mémoire MCP

Ce document détaille la procédure pour déployer votre propre instance du serveur `mcp-memory` en utilisant Cloudflare Workers, Vectorize et D1.

## Prérequis

1.  **Compte Cloudflare :** Vous devez avoir un compte Cloudflare actif.
2.  **Node.js et npm :** Assurez-vous que Node.js (version 16.x ou supérieure) et npm sont installés sur votre machine.
3.  **Git :** Git doit être installé pour cloner le dépôt.
4.  **Wrangler CLI :** L'outil en ligne de commande de Cloudflare. Installez-le globalement si ce n'est pas déjà fait :
    ```bash
    npm install -g wrangler
    ```
5.  **Authentification Wrangler :** Connectez Wrangler à votre compte Cloudflare :
    ```bash
    wrangler login
    ```

## Étapes d'Installation

### 1. Création du Dépôt à partir du Template

-   Rendez-vous sur le dépôt GitHub : [https://github.com/Puliczek/mcp-memory](https://github.com/Puliczek/mcp-memory)
-   Cliquez sur le bouton **"Use this template"** > **"Create a new repository"**.
-   Choisissez un nom pour votre nouveau dépôt (ex: `my-skynet-memory`) et créez-le.

### 2. Clonage Local

-   Clonez le dépôt que vous venez de créer sur votre machine locale :
    ```bash
    git clone https://github.com/VOTRE_NOM_UTILISATEUR/my-skynet-memory.git
    cd my-skynet-memory
    ```

### 3. Installation des Dépendances

-   Installez les dépendances du projet avec npm :
    ```bash
    npm install
    ```

### 4. Création des Ressources Cloudflare

Vous devez maintenant créer les trois services Cloudflare nécessaires : la base de données D1, l'index Vectorize et le Worker.

-   **Créer l'index Vectorize :**
    *   Cet index stockera les embeddings vectoriels.
    *   *Dimensions* doit être **1024** et *Metric* **cosine**, car c'est ce qu'utilise le modèle d'embedding (`@cf/baai/bge-m3`).
    ```bash
    npx wrangler vectorize create mcp-memory-vectorize --dimensions 1024 --metric cosine
    ```

-   **Créer la base de données D1 :**
    *   Cette base stockera le texte brut des souvenirs.
    ```bash
    npx wrangler d1 create mcp-memory-d1
    ```

### 5. Configuration du Projet

-   Ouvrez le fichier `wrangler.toml` à la racine de votre projet.
-   Vous devez lier les ressources que vous venez de créer en ajoutant leurs `binding` respectifs. Le fichier devrait ressembler à ceci (Wrangler peut vous aider à remplir ces informations lors de la première exécution) :

```toml
# Top-level configuration
name = "mcp-memory"
main = "src/index.ts"
compatibility_date = "2024-04-05"
compatibility_flags = ["nodejs_compat"]

# AI binding for embedding model
[ai]
binding = "AI"

# Vectorize binding
[[vectorize]]
binding = "VECTORIZE_INDEX"
index_name = "mcp-memory-vectorize"

# D1 database binding
[[d1_databases]]
binding = "D1_DATABASE"
database_name = "mcp-memory-d1"
database_id = "VOTRE_DATABASE_ID" # Remplacez par l'ID fourni par la commande de création

# Durable Object binding
[durable_objects]
bindings = [
  { name = "MY_MCP", class_name = "MyMCP" }
]

[[migrations]]
tag = "v1"
new_classes = ["MyMCP"]
```

### 6. Déploiement

-   Une fois la configuration terminée, déployez l'application sur Cloudflare :
    ```bash
    npm run deploy
    ```
-   La sortie de la commande vous donnera l'URL de votre nouveau serveur de mémoire (ex: `https://mcp-memory.VOTRE_DOMAINE.workers.dev`).

## Post-Déploiement

-   Votre serveur est maintenant en ligne. Vous pouvez l'intégrer dans vos clients MCP (comme Gemini, Claude, etc.) en utilisant l'URL fournie.
-   Toutes les données seront stockées de manière sécurisée dans votre propre infrastructure Cloudflare.
