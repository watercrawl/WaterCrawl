"""
This module defines the interfaces (abstract base classes) for the knowledge base components.
These interfaces provide a common API for different implementations of each component.
"""

from abc import ABC, abstractmethod
from typing import List


class BaseProvider(ABC):
    def __init__(self, config: dict):
        self.config = config

    @abstractmethod
    def get_models(self) -> List[dict]:
        pass

    @abstractmethod
    def get_embeddings(self) -> List[dict]:
        pass
