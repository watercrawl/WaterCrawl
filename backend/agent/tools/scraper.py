from typing import Type

from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

from core.services import CrawlerService


class ScraperParameters(BaseModel):
    url: str = Field(description="url to scrape")


class ScrapperTool(BaseTool):
    name = "scrapper"
    description = "scrapper"
    args_schema: Type[BaseModel] = ScraperParameters

    def _run(self, url: str) -> str:
        CrawlerService.make_with_urls([url], self.agent.knowledge_base.team).run()
