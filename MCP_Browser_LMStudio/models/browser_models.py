"""
Models Pydantic pour le contrôleur de navigateur
"""
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from datetime import datetime


class OpenURLRequest(BaseModel):
    """Requête pour ouvrir une URL"""
    url: str = Field(..., description="URL à ouvrir")
    wait_time: Optional[float] = Field(2.0, description="Temps d'attente après chargement (secondes)")


class OpenURLResponse(BaseModel):
    """Réponse après ouverture d'une URL"""
    url: str
    title: str
    html_preview: str = Field(..., description="Aperçu des 500 premiers caractères du HTML")
    timestamp: datetime = Field(default_factory=datetime.now)
    success: bool


class GetHTMLResponse(BaseModel):
    """Réponse contenant le HTML complet de la page"""
    url: str
    html: str
    length: int
    timestamp: datetime = Field(default_factory=datetime.now)


class ClickRequest(BaseModel):
    """Requête pour cliquer sur un élément"""
    selector: str = Field(..., description="Sélecteur CSS de l'élément à cliquer")
    wait_after: Optional[float] = Field(1.0, description="Temps d'attente après le clic (secondes)")


class ClickResponse(BaseModel):
    """Réponse après un clic"""
    selector: str
    success: bool
    message: str
    timestamp: datetime = Field(default_factory=datetime.now)


class ScreenshotRequest(BaseModel):
    """Requête pour prendre une capture d'écran"""
    filename: Optional[str] = Field(None, description="Nom du fichier (généré automatiquement si non fourni)")
    full_page: Optional[bool] = Field(False, description="Capture de la page entière")


class ScreenshotResponse(BaseModel):
    """Réponse après capture d'écran"""
    filename: str
    filepath: str
    base64_image: Optional[str] = Field(None, description="Image encodée en base64")
    timestamp: datetime = Field(default_factory=datetime.now)
    success: bool


class BrowserStatusResponse(BaseModel):
    """Statut du navigateur"""
    running: bool
    engine: str = Field(..., description="pywebview ou playwright")
    current_url: Optional[str] = None
    title: Optional[str] = None


class InteractionLog(BaseModel):
    """Log d'une interaction avec le navigateur"""
    timestamp: datetime = Field(default_factory=datetime.now)
    action: str = Field(..., description="Type d'action: open, click, screenshot, get_html")
    details: dict
    success: bool


class MemoryHistoryResponse(BaseModel):
    """Historique des interactions"""
    total_interactions: int
    interactions: List[InteractionLog]
