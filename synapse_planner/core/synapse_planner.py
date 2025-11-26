"""
Synapse Planner - Moteur de génération de planning quotidien pour Skynet
Version 1.0.0

Génère automatiquement une feuille de route quotidienne basée sur :
- Configuration des tâches
- Logs système
- Mémoire RAG
- Notes des agents
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

# Import du module de récupération mémoire
from memory_fetcher import get_memory_summary


class SynapsePlanner:
    """Moteur principal de génération de planning."""

    def __init__(self, config_path: str = None, logs_path: str = None):
        """
        Initialise le Synapse Planner.

        Args:
            config_path: Chemin vers synapse_config.json
            logs_path: Chemin vers logs_mock.json
        """
        # Déterminer les chemins par défaut
        self.base_dir = Path(__file__).parent.parent
        self.config_path = config_path or self.base_dir / "data" / "synapse_config.json"
        self.logs_path = logs_path or self.base_dir / "data" / "logs_mock.json"
        self.output_dir = self.base_dir / "outputs"

        # Charger la configuration et les logs
        self.config = self._load_config()
        self.logs = self._load_logs()

        # Récupérer les données mémoire
        self.memory_data = get_memory_summary()

        # Créer le dossier outputs s'il n'existe pas
        self.output_dir.mkdir(exist_ok=True)

    def _load_config(self) -> Dict[str, Any]:
        """Charge la configuration depuis le fichier JSON."""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"❌ Erreur: Fichier de config introuvable: {self.config_path}")
            return {}
        except json.JSONDecodeError as e:
            print(f"❌ Erreur de parsing JSON: {e}")
            return {}

    def _load_logs(self) -> Dict[str, Any]:
        """Charge les logs depuis le fichier JSON."""
        try:
            with open(self.logs_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"❌ Erreur: Fichier de logs introuvable: {self.logs_path}")
            return {"logs": [], "errors": [], "alerts": []}
        except json.JSONDecodeError as e:
            print(f"❌ Erreur de parsing JSON: {e}")
            return {"logs": [], "errors": [], "alerts": []}

    def _generate_task_section(self, section_name: str, icon: str) -> str:
        """
        Génère une section de tâches formatée en Markdown.

        Args:
            section_name: Nom de la section (ex: 'prioritaire')
            icon: Emoji/icône pour la section

        Returns:
            String Markdown formatée
        """
        tasks = self.config.get("tasks", {}).get(section_name, [])

        # Titre de section selon le type
        section_titles = {
            "prioritaire": "🟥 Tâches prioritaires",
            "surveillance": "🟦 Surveillance à effectuer",
            "verification": "🟨 Vérification des logs",
            "messages": "🟩 Messages à envoyer",
            "syntheses": "🟪 Synthèses à produire"
        }

        title = section_titles.get(section_name, f"{icon} {section_name.capitalize()}")
        output = [f"\n## {title}\n"]

        if not tasks:
            output.append("- Aucune tâche configurée\n")
        else:
            for task in tasks:
                output.append(f"- [ ] {task}")

        return "\n".join(output)

    def _generate_memory_section(self) -> str:
        """Génère la section des notes mémoire récentes."""
        output = ["\n## 📘 Notes mémoire récentes\n"]

        recent_memory = self.memory_data.get("recent_memory", [])

        if not recent_memory:
            output.append("- Aucune note récente")
        else:
            for entry in recent_memory:
                output.append(f"- {entry}")

        return "\n".join(output)

    def _generate_agent_notes_section(self) -> str:
        """Génère la section des notes des agents."""
        output = ["\n## 🤖 Notes des agents\n"]

        agent_notes = self.memory_data.get("agent_notes", [])

        if not agent_notes:
            output.append("- Aucune note d'agent")
        else:
            for note in agent_notes:
                output.append(
                    f"- **[{note['timestamp']}] {note['agent']}**: {note['note']}"
                )

        return "\n".join(output)

    def _generate_alerts_section(self) -> str:
        """Génère la section des événements importants."""
        output = ["\n## 🧩 Événements importants détectés\n"]

        # Combiner les alertes de la mémoire et des logs
        memory_alerts = self.memory_data.get("alerts", [])
        log_alerts = self.logs.get("alerts", [])

        all_alerts = memory_alerts + log_alerts

        if not all_alerts:
            output.append("- Aucun événement critique")
        else:
            for alert in all_alerts:
                priority_emoji = {
                    "high": "🔴",
                    "medium": "🟡",
                    "low": "🟢"
                }
                emoji = priority_emoji.get(alert.get("priority", "low"), "⚪")
                message = alert.get("message", "N/A")
                output.append(f"- {emoji} {message}")

        return "\n".join(output)

    def _generate_logs_summary(self) -> str:
        """Génère un résumé des logs système."""
        output = ["\n## 📊 Résumé des logs système\n"]

        stats = self.logs.get("statistics", {})

        if stats:
            output.append(f"- **Tâches totales**: {stats.get('total_tasks', 0)}")
            output.append(f"- **Succès**: {stats.get('successful', 0)}")
            output.append(f"- **Warnings**: {stats.get('warnings', 0)}")
            output.append(f"- **Erreurs**: {stats.get('errors', 0)}")
            output.append(f"- **Agents actifs**: {stats.get('agents_active', 0)}")
        else:
            output.append("- Aucune statistique disponible")

        # Ajouter les erreurs s'il y en a
        errors = self.logs.get("errors", [])
        if errors:
            output.append("\n### ⚠️ Erreurs récentes\n")
            for error in errors:
                status = "✅ Résolu" if error.get("resolved", False) else "❌ Non résolu"
                output.append(f"- [{error['time']}] {error['message']} - {status}")

        return "\n".join(output)

    def _generate_recommendations_section(self) -> str:
        """Génère la section des recommandations."""
        output = ["\n## 💡 Recommandations\n"]

        recommendations = self.memory_data.get("recommendations", [])

        if not recommendations:
            output.append("- Aucune recommandation pour le moment")
        else:
            for rec in recommendations:
                output.append(f"- {rec}")

        return "\n".join(output)

    def generate_daily_plan(self) -> str:
        """
        Génère le plan quotidien complet en format Markdown.

        Returns:
            String contenant le plan formaté en Markdown
        """
        today = datetime.now().strftime("%Y-%m-%d")
        time_now = datetime.now().strftime("%H:%M")

        # En-tête
        plan = [
            f"# 🧠 Tâches du jour — {today}\n",
            f"*Généré par Synapse Planner v{self.config.get('version', '1.0.0')} à {time_now}*\n",
            "---\n"
        ]

        # Sections de tâches principales
        plan.append(self._generate_task_section("prioritaire", "🟥"))
        plan.append(self._generate_task_section("surveillance", "🟦"))
        plan.append(self._generate_task_section("verification", "🟨"))
        plan.append(self._generate_task_section("messages", "🟩"))
        plan.append(self._generate_task_section("syntheses", "🟪"))

        # Séparateur
        plan.append("\n---\n")

        # Sections de contexte
        plan.append(self._generate_memory_section())
        plan.append(self._generate_agent_notes_section())
        plan.append(self._generate_alerts_section())
        plan.append(self._generate_logs_summary())
        plan.append(self._generate_recommendations_section())

        # Footer
        plan.append("\n---\n")
        plan.append(f"\n*Planning généré automatiquement par Synapse Planner*")
        plan.append(f"\n*Prochaine génération: demain à {self.config.get('generation_time', '10:00')}*\n")

        return "\n".join(plan)

    def save_plan(self, plan: str) -> str:
        """
        Sauvegarde le plan dans un fichier Markdown.

        Args:
            plan: Contenu du plan en Markdown

        Returns:
            Chemin du fichier sauvegardé
        """
        output_file = self.output_dir / "taches_du_jour.md"

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(plan)

        return str(output_file)

    def save_metadata(self, task_count: int) -> str:
        """
        Sauvegarde les métadonnées de génération.

        Args:
            task_count: Nombre de tâches générées

        Returns:
            Chemin du fichier de métadonnées
        """
        metadata_file = self.output_dir / "last_generation.txt"
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        metadata = [
            f"Dernière génération : {timestamp}",
            f"Nombre de tâches générées : {task_count}",
            f"Version : {self.config.get('version', '1.0.0')}",
            f"Agents surveillés : {len(self.config.get('agents_monitored', []))}",
            f"Statut : ✅ Succès"
        ]

        with open(metadata_file, 'w', encoding='utf-8') as f:
            f.write("\n".join(metadata))

        return str(metadata_file)

    def count_tasks(self) -> int:
        """Compte le nombre total de tâches configurées."""
        total = 0
        tasks = self.config.get("tasks", {})

        for category in tasks.values():
            if isinstance(category, list):
                total += len(category)

        return total

    def run(self) -> Dict[str, str]:
        """
        Exécute le générateur de planning complet.

        Returns:
            Dictionnaire avec les chemins des fichiers générés
        """
        print("🧠 Synapse Planner — Démarrage...")
        print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

        # Générer le plan
        print("⚙️  Génération du planning...")
        plan = self.generate_daily_plan()

        # Sauvegarder le plan
        plan_file = self.save_plan(plan)
        print(f"✅ Planning sauvegardé: {plan_file}")

        # Sauvegarder les métadonnées
        task_count = self.count_tasks()
        metadata_file = self.save_metadata(task_count)
        print(f"✅ Métadonnées sauvegardées: {metadata_file}")

        print(f"\n📊 {task_count} tâches générées au total")
        print("🎯 Synapse Planner terminé avec succès!\n")

        return {
            "plan_file": plan_file,
            "metadata_file": metadata_file,
            "task_count": task_count
        }


def main():
    """Point d'entrée principal du programme."""
    planner = SynapsePlanner()
    result = planner.run()

    # Afficher un aperçu
    print("=" * 60)
    print("📋 APERÇU DU PLANNING GÉNÉRÉ")
    print("=" * 60)

    with open(result["plan_file"], 'r', encoding='utf-8') as f:
        print(f.read())


if __name__ == "__main__":
    main()
