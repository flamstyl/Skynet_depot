#!/usr/bin/env python3
"""
🤖 Grok CLI - Interface conversationnelle propulsée par Grok (xAI)
Style Claude Code / Gemini CLI
"""

import asyncio
import sys
import os
from pathlib import Path
from typing import List, Dict

from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.prompt import Prompt
from rich.syntax import Syntax
from rich.live import Live

# Import des outils
from api.grok_client import GrokClient, GROK_MODELS
from tools.terminal import TerminalTool
from tools.files import FileTool
from tools.mcp import MCPTool


class GrokCLI:
    """CLI conversationnel Grok"""

    def __init__(self):
        self.console = Console()
        self.client = None
        self.terminal = TerminalTool()
        self.files = FileTool()
        self.mcp = MCPTool()

        self.messages: List[Dict[str, str]] = []
        self.current_model = "grok-2-1212"
        self.running = True

        # Prompt système
        self.system_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        """Charge le prompt système"""
        return """Tu es Grok, un assistant de développement intelligent.

Tu as accès à plusieurs outils :

1. **Fichiers** : Tu peux lire et écrire des fichiers du projet
   - Pour lire : mentionne "lis le fichier X" ou "montre-moi X"
   - Pour écrire : propose du code et je l'écrirai

2. **Terminal** : Tu peux exécuter des commandes shell
   - Pour exécuter : mentionne "execute X" ou "lance X"
   - Les commandes dangereuses sont bloquées

3. **Analyse** : Tu peux lister et explorer le projet
   - Pour lister : "liste les fichiers" ou "montre le projet"

Sois direct, efficace et friendly. Utilise le markdown pour formatter tes réponses.
Si on te demande de faire quelque chose, fais-le directement sans demander confirmation (sauf pour les opérations destructives).
"""

    async def initialize(self):
        """Initialise le CLI"""
        try:
            self.client = GrokClient(model=self.current_model)
            self.messages.append({
                "role": "system",
                "content": self.system_prompt
            })

            self.console.print(Panel.fit(
                "[bold cyan]🤖 Grok CLI[/bold cyan]\n"
                f"[dim]Modèle: {self.current_model}[/dim]\n"
                f"[dim]Projet: {Path.cwd().name}[/dim]",
                border_style="cyan"
            ))

            self.console.print("[dim]Tape '/help' pour l'aide, '/exit' pour quitter[/dim]\n")

        except ValueError as e:
            self.console.print(f"[red]❌ {e}[/red]")
            self.console.print("\n[yellow]Pour obtenir une clé API :[/yellow]")
            self.console.print("1. Va sur https://console.x.ai")
            self.console.print("2. Crée une clé API")
            self.console.print("3. Définis : export XAI_API_KEY='ta-clé'")
            sys.exit(1)

    async def run(self):
        """Boucle principale"""
        await self.initialize()

        while self.running:
            try:
                # Prompt utilisateur
                user_input = Prompt.ask("\n[bold cyan]toi[/bold cyan]")

                if not user_input.strip():
                    continue

                # Commandes spéciales
                if user_input.startswith("/"):
                    await self.handle_command(user_input)
                    continue

                # Message normal
                await self.process_message(user_input)

            except KeyboardInterrupt:
                self.console.print("\n[yellow]Utilise /exit pour quitter[/yellow]")
                continue
            except Exception as e:
                self.console.print(f"[red]❌ Erreur: {e}[/red]")

        await self.cleanup()

    async def handle_command(self, command: str):
        """Gère les commandes spéciales"""
        cmd = command.lower().strip()

        if cmd == "/exit" or cmd == "/quit":
            self.console.print("[yellow]👋 À bientôt ![/yellow]")
            self.running = False

        elif cmd == "/help":
            self.show_help()

        elif cmd == "/clear":
            self.messages = [self.messages[0]]  # Garde juste le system prompt
            self.console.clear()
            self.console.print("[green]✓ Historique effacé[/green]")

        elif cmd.startswith("/model"):
            await self.change_model(cmd)

        elif cmd == "/models":
            self.list_models()

        elif cmd == "/stats":
            self.show_stats()

        else:
            self.console.print(f"[red]❌ Commande inconnue: {cmd}[/red]")
            self.console.print("[dim]Tape /help pour voir les commandes[/dim]")

    async def change_model(self, command: str):
        """Change de modèle Grok"""
        parts = command.split()
        if len(parts) < 2:
            self.console.print("[yellow]Usage: /model <nom>[/yellow]")
            self.list_models()
            return

        model = parts[1]
        if model in GROK_MODELS:
            self.current_model = model
            self.client.set_model(model)
            self.console.print(f"[green]✓ Modèle changé: {GROK_MODELS[model]}[/green]")
        else:
            self.console.print(f"[red]❌ Modèle inconnu: {model}[/red]")
            self.list_models()

    def list_models(self):
        """Liste les modèles disponibles"""
        self.console.print("\n[bold]Modèles Grok disponibles :[/bold]")
        for model, desc in GROK_MODELS.items():
            current = "✓" if model == self.current_model else " "
            self.console.print(f"  [{current}] {model} - {desc}")
        self.console.print()

    def show_help(self):
        """Affiche l'aide"""
        help_text = """
# 🤖 Grok CLI - Aide

## Commandes spéciales

- `/help` - Affiche cette aide
- `/exit` ou `/quit` - Quitte le CLI
- `/clear` - Efface l'historique de conversation
- `/model <nom>` - Change de modèle Grok
- `/models` - Liste les modèles disponibles
- `/stats` - Affiche les statistiques

## Utilisation

Parle naturellement avec Grok ! Exemples :

- "Lis le fichier README.md"
- "Liste les fichiers Python du projet"
- "Execute npm install"
- "Crée un fichier test.py avec une fonction hello"
- "Analyse ce projet et explique sa structure"

Grok comprend le contexte et utilise les outils automatiquement.
"""
        self.console.print(Markdown(help_text))

    def show_stats(self):
        """Affiche les stats"""
        msg_count = len([m for m in self.messages if m["role"] != "system"])
        self.console.print(f"\n[bold]Statistiques :[/bold]")
        self.console.print(f"  Messages: {msg_count}")
        self.console.print(f"  Modèle: {self.current_model}")
        self.console.print(f"  Projet: {Path.cwd()}")
        self.console.print()

    async def process_message(self, user_message: str):
        """Traite un message utilisateur"""

        # Ajouter le message utilisateur
        self.messages.append({
            "role": "user",
            "content": user_message
        })

        # Analyser si besoin d'outils
        tool_context = await self.analyze_and_execute_tools(user_message)

        # Si des outils ont été utilisés, ajouter le contexte
        if tool_context:
            self.messages.append({
                "role": "user",
                "content": f"[Résultat des outils]:\n{tool_context}"
            })

        # Obtenir la réponse de Grok
        self.console.print("\n[bold magenta]grok[/bold magenta]> ", end="")

        response_text = ""
        with Live("", refresh_per_second=10, console=self.console) as live:
            async for chunk in self.client.chat(self.messages):
                response_text += chunk
                live.update(Markdown(response_text))

        # Ajouter à l'historique
        self.messages.append({
            "role": "assistant",
            "content": response_text
        })

        self.console.print()  # Newline

    async def analyze_and_execute_tools(self, message: str) -> str:
        """Analyse le message et exécute les outils nécessaires"""
        msg_lower = message.lower()
        results = []

        # Détection lecture fichier
        if any(keyword in msg_lower for keyword in ["lis", "montre", "affiche", "read", "show"]):
            if "fichier" in msg_lower or any(ext in msg_lower for ext in [".py", ".js", ".md", ".txt", ".json"]):
                # Extraire le nom du fichier (simple heuristique)
                words = message.split()
                for word in words:
                    if "." in word and "/" not in word[:1]:  # Simple check
                        content = self.files.read_file(word)
                        results.append(f"Fichier {word}:\n```\n{content}\n```")
                        break

        # Détection liste fichiers
        if any(keyword in msg_lower for keyword in ["liste", "list", "montre les fichiers", "fichiers du projet"]):
            pattern = "*.py" if "python" in msg_lower or ".py" in msg_lower else "*"
            files = self.files.list_files(pattern=pattern)
            results.append(f"Fichiers trouvés ({len(files)}):\n" + "\n".join(f"- {f}" for f in files[:50]))

        # Détection exécution commande
        if any(keyword in msg_lower for keyword in ["execute", "lance", "run", "npm", "pip", "git", "python"]):
            # Extraire la commande (entre guillemets ou après "execute")
            if "execute" in msg_lower or "lance" in msg_lower:
                # Heuristique simple
                if "`" in message:
                    # Commande dans des backticks
                    parts = message.split("`")
                    if len(parts) >= 3:
                        command = parts[1]
                        result = await self.terminal.execute(command)
                        results.append(f"Commande: {command}\nSortie:\n```\n{result['stdout']}\n```")

        return "\n\n".join(results) if results else ""

    async def cleanup(self):
        """Nettoie les ressources"""
        if self.client:
            await self.client.close()
        await self.mcp.disconnect_all()


async def main():
    """Point d'entrée"""
    cli = GrokCLI()
    await cli.run()


if __name__ == "__main__":
    asyncio.run(main())
