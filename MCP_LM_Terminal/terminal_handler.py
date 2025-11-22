"""
🟣 MCP_LM_Terminal - Gestionnaire de Terminal
Gestion des terminaux interactifs via PTY et subprocess

Fonctionnalités :
- Exécution de commandes shell avec timeout
- Session PTY pour terminal interactif (Linux/Mac)
- Fallback subprocess pour Windows
- Gestion des timeouts et kill automatique
"""

import subprocess
import platform
import logging
import time
import threading
from typing import Dict, Any, Optional
from queue import Queue, Empty

# Détection du système pour choisir le bon backend
IS_WINDOWS = platform.system() == "Windows"

# Import conditionnel de ptyprocess (uniquement Linux/Mac)
if not IS_WINDOWS:
    try:
        from ptyprocess import PtyProcess
        PTY_AVAILABLE = True
    except ImportError:
        PTY_AVAILABLE = False
        logging.warning("ptyprocess non disponible, utilisation de subprocess")
else:
    PTY_AVAILABLE = False

logger = logging.getLogger(__name__)


class TerminalHandler:
    """
    Gestionnaire de terminal pour exécution de commandes shell

    Supporte :
    - Exécution simple via subprocess (toutes plateformes)
    - Session PTY interactive (Linux/Mac uniquement)
    - Timeout automatique
    - Capture stdout/stderr
    """

    def __init__(self, timeout: int = 20):
        """
        Initialise le gestionnaire de terminal

        Args:
            timeout: Timeout par défaut en secondes
        """
        self.timeout = timeout
        self.active_sessions = {}
        self.session_counter = 0

        logger.info(f"TerminalHandler initialisé (timeout: {timeout}s)")
        if PTY_AVAILABLE:
            logger.info("Mode PTY disponible (Linux/Mac)")
        else:
            logger.info("Mode subprocess uniquement (Windows ou PTY indisponible)")

    def execute_command(
        self,
        cmd: str,
        timeout: Optional[int] = None,
        shell: bool = True
    ) -> Dict[str, Any]:
        """
        Exécute une commande shell et retourne le résultat

        Args:
            cmd: Commande à exécuter
            timeout: Timeout en secondes (optionnel, utilise self.timeout par défaut)
            shell: Exécuter via shell (True par défaut)

        Returns:
            Dict contenant stdout, stderr, exit_code, execution_time
        """
        timeout = timeout or self.timeout
        start_time = time.time()

        try:
            logger.debug(f"Exécution : {cmd} (timeout: {timeout}s)")

            # Exécution via subprocess avec timeout
            process = subprocess.Popen(
                cmd,
                shell=shell,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding='utf-8',
                errors='replace'
            )

            # Attente avec timeout
            try:
                stdout, stderr = process.communicate(timeout=timeout)
                exit_code = process.returncode

            except subprocess.TimeoutExpired:
                # Timeout dépassé, kill du process
                logger.warning(f"Timeout dépassé pour : {cmd}")
                process.kill()
                stdout, stderr = process.communicate()
                exit_code = -1
                stderr = f"[TIMEOUT] Commande interrompue après {timeout}s\n" + stderr

            execution_time = time.time() - start_time

            result = {
                "stdout": stdout.strip() if stdout else "",
                "stderr": stderr.strip() if stderr else "",
                "exit_code": exit_code,
                "execution_time": round(execution_time, 2)
            }

            logger.debug(f"Résultat : exit_code={exit_code}, time={execution_time:.2f}s")
            return result

        except Exception as e:
            logger.error(f"Erreur lors de l'exécution de '{cmd}' : {str(e)}")
            return {
                "stdout": "",
                "stderr": f"[ERROR] {str(e)}",
                "exit_code": -1,
                "execution_time": time.time() - start_time
            }

    def create_pty_session(self) -> 'PTYSession':
        """
        Crée une session PTY interactive

        Returns:
            Instance de PTYSession

        Raises:
            NotImplementedError: Si PTY n'est pas disponible (Windows)
        """
        if not PTY_AVAILABLE:
            logger.error("PTY non disponible sur ce système")
            raise NotImplementedError(
                "PTY non disponible. Utilisez Windows Subsystem for Linux (WSL) "
                "ou une machine Linux/Mac pour les sessions PTY."
            )

        session_id = self.session_counter
        self.session_counter += 1

        session = PTYSession(session_id, self.timeout)
        self.active_sessions[session_id] = session

        logger.info(f"Session PTY créée : ID {session_id}")
        return session

    def cleanup(self):
        """Nettoyage de toutes les sessions actives"""
        logger.info(f"Nettoyage de {len(self.active_sessions)} sessions actives")

        for session_id, session in list(self.active_sessions.items()):
            try:
                session.close()
            except Exception as e:
                logger.error(f"Erreur lors de la fermeture de session {session_id}: {e}")

        self.active_sessions.clear()


class PTYSession:
    """
    Session PTY interactive pour terminal bi-directionnel
    Disponible uniquement sur Linux/Mac
    """

    def __init__(self, session_id: int, timeout: int = 20):
        """
        Initialise une session PTY

        Args:
            session_id: Identifiant unique de la session
            timeout: Timeout par défaut
        """
        self.session_id = session_id
        self.timeout = timeout
        self.pty = None
        self.output_queue = Queue()
        self.is_active = False

        self._start_pty()

    def _start_pty(self):
        """Démarre le processus PTY avec un shell bash"""
        try:
            # Démarrage d'un shell bash via PTY
            shell = "/bin/bash" if not IS_WINDOWS else "cmd.exe"

            self.pty = PtyProcess.spawn([shell], encoding='utf-8')
            self.is_active = True

            logger.info(f"PTY démarré : {shell} (session {self.session_id})")

            # Démarrage du thread de lecture
            self._start_reader_thread()

        except Exception as e:
            logger.error(f"Erreur démarrage PTY : {str(e)}")
            self.is_active = False
            raise

    def _start_reader_thread(self):
        """Démarre un thread pour lire la sortie PTY en continu"""
        def reader():
            try:
                while self.is_active:
                    try:
                        # Lecture non-bloquante avec timeout
                        output = self.pty.read(1024)
                        if output:
                            self.output_queue.put(output)
                    except Exception as e:
                        if self.is_active:
                            logger.debug(f"Erreur lecture PTY : {e}")
                        break
            except Exception as e:
                logger.error(f"Thread reader PTY crashé : {e}")

        thread = threading.Thread(target=reader, daemon=True)
        thread.start()

    def execute(self, command: str, timeout: Optional[int] = None) -> str:
        """
        Exécute une commande dans le PTY et retourne la sortie

        Args:
            command: Commande à exécuter
            timeout: Timeout en secondes

        Returns:
            Sortie de la commande
        """
        if not self.is_active:
            raise RuntimeError("Session PTY inactive")

        timeout = timeout or self.timeout

        try:
            # Vide la queue avant exécution
            while not self.output_queue.empty():
                try:
                    self.output_queue.get_nowait()
                except Empty:
                    break

            # Envoi de la commande
            self.pty.write(command + "\n")
            time.sleep(0.1)  # Petit délai pour laisser la commande s'exécuter

            # Collecte de la sortie avec timeout
            output_parts = []
            start_time = time.time()

            while time.time() - start_time < timeout:
                try:
                    output = self.output_queue.get(timeout=0.1)
                    output_parts.append(output)
                except Empty:
                    # Si pas de sortie depuis 0.5s, considérer terminé
                    if time.time() - start_time > 0.5:
                        break

            result = "".join(output_parts)
            return result.strip()

        except Exception as e:
            logger.error(f"Erreur exécution PTY : {str(e)}")
            return f"[ERROR] {str(e)}"

    def write(self, data: str):
        """
        Écrit des données dans le PTY

        Args:
            data: Données à écrire
        """
        if not self.is_active:
            raise RuntimeError("Session PTY inactive")

        self.pty.write(data)

    def read(self, timeout: float = 1.0) -> str:
        """
        Lit la sortie disponible du PTY

        Args:
            timeout: Timeout en secondes

        Returns:
            Sortie disponible
        """
        output_parts = []
        start_time = time.time()

        while time.time() - start_time < timeout:
            try:
                output = self.output_queue.get(timeout=0.1)
                output_parts.append(output)
            except Empty:
                break

        return "".join(output_parts)

    def close(self):
        """Ferme la session PTY"""
        logger.info(f"Fermeture session PTY {self.session_id}")

        self.is_active = False

        if self.pty and self.pty.isalive():
            try:
                self.pty.terminate()
                time.sleep(0.1)
                if self.pty.isalive():
                    self.pty.kill()
            except Exception as e:
                logger.error(f"Erreur fermeture PTY : {e}")

    def __del__(self):
        """Destructeur - fermeture automatique"""
        self.close()


# ============= FONCTIONS UTILITAIRES =============

def get_shell_info() -> Dict[str, str]:
    """Retourne les informations sur le shell disponible"""
    system = platform.system()

    if system == "Windows":
        shell = "cmd.exe"
        pty_support = False
    else:
        shell = "/bin/bash"
        pty_support = PTY_AVAILABLE

    return {
        "system": system,
        "shell": shell,
        "pty_support": pty_support,
        "platform": platform.platform()
    }


def test_terminal():
    """Fonction de test du terminal handler"""
    handler = TerminalHandler(timeout=10)

    # Test 1: Commande simple
    print("\n🧪 Test 1: ls -la")
    result = handler.execute_command("ls -la")
    print(f"Exit code: {result['exit_code']}")
    print(f"Output: {result['stdout'][:200]}")

    # Test 2: Commande avec timeout
    print("\n🧪 Test 2: sleep 30 (devrait timeout)")
    result = handler.execute_command("sleep 30", timeout=2)
    print(f"Exit code: {result['exit_code']}")
    print(f"Stderr: {result['stderr'][:200]}")

    # Test 3: PTY session (si disponible)
    if PTY_AVAILABLE:
        print("\n🧪 Test 3: Session PTY")
        session = handler.create_pty_session()
        output = session.execute("echo 'Hello from PTY'")
        print(f"PTY output: {output}")
        session.close()

    handler.cleanup()
    print("\n✅ Tests terminés")


if __name__ == "__main__":
    # Affichage des infos système
    info = get_shell_info()
    print("🟣 Terminal Handler Info:")
    for key, value in info.items():
        print(f"  {key}: {value}")

    # Exécution des tests
    test_terminal()
