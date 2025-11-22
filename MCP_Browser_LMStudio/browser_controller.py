"""
Contrôleur de navigateur avec support PyWebView et Playwright
"""
import asyncio
import base64
import logging
import os
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path
from typing import Optional, List

from models.browser_models import (
    OpenURLResponse, GetHTMLResponse, ClickResponse,
    ScreenshotResponse, BrowserStatusResponse, InteractionLog
)

logger = logging.getLogger(__name__)


class BrowserEngine(ABC):
    """Interface abstraite pour les moteurs de navigateur"""

    @abstractmethod
    async def open_url(self, url: str, wait_time: float = 2.0) -> OpenURLResponse:
        """Ouvre une URL"""
        pass

    @abstractmethod
    async def get_html(self) -> GetHTMLResponse:
        """Récupère le HTML de la page actuelle"""
        pass

    @abstractmethod
    async def click(self, selector: str, wait_after: float = 1.0) -> ClickResponse:
        """Clique sur un élément"""
        pass

    @abstractmethod
    async def screenshot(self, filename: Optional[str] = None, full_page: bool = False) -> ScreenshotResponse:
        """Prend une capture d'écran"""
        pass

    @abstractmethod
    async def get_current_url(self) -> Optional[str]:
        """Retourne l'URL actuelle"""
        pass

    @abstractmethod
    async def get_title(self) -> Optional[str]:
        """Retourne le titre de la page"""
        pass

    @abstractmethod
    async def close(self):
        """Ferme le navigateur"""
        pass


class PlaywrightEngine(BrowserEngine):
    """Implémentation avec Playwright (headless)"""

    def __init__(self):
        self.browser = None
        self.context = None
        self.page = None
        self.current_url = None
        self.current_title = None

    async def initialize(self):
        """Initialise Playwright"""
        try:
            from playwright.async_api import async_playwright
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(headless=True)
            self.context = await self.browser.new_context(
                viewport={'width': 1920, 'height': 1080}
            )
            self.page = await self.context.new_page()
            logger.info("Playwright initialisé avec succès")
        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation de Playwright: {e}")
            raise

    async def open_url(self, url: str, wait_time: float = 2.0) -> OpenURLResponse:
        """Ouvre une URL avec Playwright"""
        try:
            if not self.page:
                await self.initialize()

            await self.page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(wait_time)

            self.current_url = self.page.url
            self.current_title = await self.page.title()

            html = await self.page.content()
            html_preview = html[:500] if len(html) > 500 else html

            logger.info(f"Page ouverte: {url} - Titre: {self.current_title}")

            return OpenURLResponse(
                url=self.current_url,
                title=self.current_title,
                html_preview=html_preview,
                success=True
            )

        except Exception as e:
            logger.error(f"Erreur lors de l'ouverture de {url}: {e}")
            return OpenURLResponse(
                url=url,
                title="",
                html_preview=f"Erreur: {str(e)}",
                success=False
            )

    async def get_html(self) -> GetHTMLResponse:
        """Récupère le HTML de la page actuelle"""
        try:
            if not self.page:
                raise Exception("Navigateur non initialisé")

            html = await self.page.content()

            return GetHTMLResponse(
                url=self.page.url,
                html=html,
                length=len(html)
            )

        except Exception as e:
            logger.error(f"Erreur lors de la récupération du HTML: {e}")
            raise

    async def click(self, selector: str, wait_after: float = 1.0) -> ClickResponse:
        """Clique sur un élément"""
        try:
            if not self.page:
                raise Exception("Navigateur non initialisé")

            await self.page.click(selector, timeout=5000)
            await asyncio.sleep(wait_after)

            logger.info(f"Clic effectué sur: {selector}")

            return ClickResponse(
                selector=selector,
                success=True,
                message=f"Clic effectué avec succès sur {selector}"
            )

        except Exception as e:
            logger.error(f"Erreur lors du clic sur {selector}: {e}")
            return ClickResponse(
                selector=selector,
                success=False,
                message=f"Erreur: {str(e)}"
            )

    async def screenshot(self, filename: Optional[str] = None, full_page: bool = False) -> ScreenshotResponse:
        """Prend une capture d'écran"""
        try:
            if not self.page:
                raise Exception("Navigateur non initialisé")

            # Générer un nom de fichier si non fourni
            if not filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"screenshot_{timestamp}.png"

            # Créer le chemin complet
            logs_dir = Path("logs")
            logs_dir.mkdir(exist_ok=True)
            filepath = logs_dir / filename

            # Prendre la capture
            screenshot_bytes = await self.page.screenshot(
                path=str(filepath),
                full_page=full_page
            )

            # Encoder en base64
            base64_image = base64.b64encode(screenshot_bytes).decode('utf-8')

            logger.info(f"Capture d'écran sauvegardée: {filepath}")

            return ScreenshotResponse(
                filename=filename,
                filepath=str(filepath),
                base64_image=base64_image,
                success=True
            )

        except Exception as e:
            logger.error(f"Erreur lors de la capture d'écran: {e}")
            return ScreenshotResponse(
                filename=filename or "error.png",
                filepath="",
                base64_image=None,
                success=False
            )

    async def get_current_url(self) -> Optional[str]:
        """Retourne l'URL actuelle"""
        return self.page.url if self.page else None

    async def get_title(self) -> Optional[str]:
        """Retourne le titre de la page"""
        return await self.page.title() if self.page else None

    async def close(self):
        """Ferme le navigateur"""
        try:
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if hasattr(self, 'playwright'):
                await self.playwright.stop()
            logger.info("Playwright fermé")
        except Exception as e:
            logger.error(f"Erreur lors de la fermeture de Playwright: {e}")


class PyWebViewEngine(BrowserEngine):
    """
    Implémentation avec PyWebView (fenêtre visible ou minimode)
    Note: PyWebView n'est pas complètement asynchrone, cette implémentation
    utilise des wrappers pour compatibilité avec l'interface async
    """

    def __init__(self):
        self.window = None
        self.current_url = None
        self.current_title = None
        logger.warning("PyWebView n'est pas recommandé pour usage en production. Utilisez Playwright.")

    async def initialize(self):
        """Initialise PyWebView"""
        try:
            import webview
            self.webview = webview
            # PyWebView nécessite un thread séparé
            logger.info("PyWebView prêt (fenêtre créée à la première ouverture d'URL)")
        except ImportError:
            raise Exception("PyWebView n'est pas installé. Installez-le avec: pip install pywebview")

    async def open_url(self, url: str, wait_time: float = 2.0) -> OpenURLResponse:
        """Ouvre une URL avec PyWebView"""
        logger.warning("PyWebView open_url: implémentation limitée")
        return OpenURLResponse(
            url=url,
            title="PyWebView - Non implémenté",
            html_preview="PyWebView ne supporte pas l'extraction HTML facilement. Utilisez Playwright.",
            success=False
        )

    async def get_html(self) -> GetHTMLResponse:
        """Récupère le HTML (non supporté par PyWebView facilement)"""
        raise NotImplementedError("get_html n'est pas supporté par PyWebView. Utilisez Playwright.")

    async def click(self, selector: str, wait_after: float = 1.0) -> ClickResponse:
        """Clique sur un élément (non supporté par PyWebView facilement)"""
        raise NotImplementedError("click n'est pas supporté par PyWebView. Utilisez Playwright.")

    async def screenshot(self, filename: Optional[str] = None, full_page: bool = False) -> ScreenshotResponse:
        """Prend une capture d'écran (limité avec PyWebView)"""
        raise NotImplementedError("screenshot n'est pas supporté par PyWebView. Utilisez Playwright.")

    async def get_current_url(self) -> Optional[str]:
        return self.current_url

    async def get_title(self) -> Optional[str]:
        return self.current_title

    async def close(self):
        """Ferme le navigateur"""
        logger.info("PyWebView fermé")


class BrowserController:
    """
    Contrôleur principal du navigateur
    Gère le moteur (Playwright ou PyWebView) et l'historique des interactions
    """

    def __init__(self, engine: str = "playwright"):
        """
        Initialise le contrôleur de navigateur

        Args:
            engine: "playwright" ou "pywebview"
        """
        self.engine_name = engine.lower()
        self.engine: Optional[BrowserEngine] = None
        self.interaction_history: List[InteractionLog] = []
        self._running = False

    async def start(self):
        """Démarre le navigateur"""
        if self.engine_name == "playwright":
            self.engine = PlaywrightEngine()
        elif self.engine_name == "pywebview":
            self.engine = PyWebViewEngine()
        else:
            raise ValueError(f"Moteur inconnu: {self.engine_name}. Utilisez 'playwright' ou 'pywebview'")

        await self.engine.initialize()
        self._running = True
        logger.info(f"Contrôleur de navigateur démarré avec {self.engine_name}")

    async def stop(self):
        """Arrête le navigateur"""
        if self.engine:
            await self.engine.close()
            self._running = False
            logger.info("Contrôleur de navigateur arrêté")

    def _log_interaction(self, action: str, details: dict, success: bool):
        """Enregistre une interaction dans l'historique"""
        log = InteractionLog(
            action=action,
            details=details,
            success=success
        )
        self.interaction_history.append(log)

    async def open_url(self, url: str, wait_time: float = 2.0) -> OpenURLResponse:
        """Ouvre une URL"""
        if not self._running:
            await self.start()

        response = await self.engine.open_url(url, wait_time)
        self._log_interaction("open", {"url": url}, response.success)
        return response

    async def get_html(self) -> GetHTMLResponse:
        """Récupère le HTML de la page actuelle"""
        if not self._running:
            raise Exception("Navigateur non démarré")

        response = await self.engine.get_html()
        self._log_interaction("get_html", {"url": response.url}, True)
        return response

    async def click(self, selector: str, wait_after: float = 1.0) -> ClickResponse:
        """Clique sur un élément"""
        if not self._running:
            raise Exception("Navigateur non démarré")

        response = await self.engine.click(selector, wait_after)
        self._log_interaction("click", {"selector": selector}, response.success)
        return response

    async def screenshot(self, filename: Optional[str] = None, full_page: bool = False) -> ScreenshotResponse:
        """Prend une capture d'écran"""
        if not self._running:
            raise Exception("Navigateur non démarré")

        response = await self.engine.screenshot(filename, full_page)
        self._log_interaction("screenshot", {"filename": response.filename}, response.success)
        return response

    async def get_status(self) -> BrowserStatusResponse:
        """Retourne le statut du navigateur"""
        current_url = None
        title = None

        if self._running and self.engine:
            current_url = await self.engine.get_current_url()
            title = await self.engine.get_title()

        return BrowserStatusResponse(
            running=self._running,
            engine=self.engine_name,
            current_url=current_url,
            title=title
        )

    def get_history(self) -> List[InteractionLog]:
        """Retourne l'historique des interactions"""
        return self.interaction_history
