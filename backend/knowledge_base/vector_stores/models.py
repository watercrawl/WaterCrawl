from typing import Dict, Optional, Any

from pydantic import BaseModel


class Document(BaseModel):
    content: str
    metadata: Dict[str, Any]
    score: Optional[float] = None
    chunk_id: Optional[str] = None
