import json
import asyncio
from typing import List, Optional, Literal

from langchain_core.messages import ToolMessage
from pydantic import BaseModel, Field
from rest_framework.exceptions import PermissionDenied

from agent.tools.base import BaseBuiltinTool, register_builtin_tool
from core import consts
from core.services import SearchService, CrawlerService, SitemapRequestService
from plan.validators import PlanLimitValidator


class SearchToolInputSchema(BaseModel):
    query: str = Field(description="The search query to perform")
    limit: int = Field(
        description="Maximum number of search results to return", default=5
    )
    depth: Literal["basic", "advanced", "ultimate"] = Field(
        description="Search depth level: 'basic', 'advanced', or 'ultimate'",
        default=consts.SEARCH_DEPTH_BASIC,
    )
    language: Optional[str] = Field(
        description="Search language (e.g., 'lang_en')", default=None
    )
    country: Optional[str] = Field(
        description="Search country (e.g., 'countryUS')", default=None
    )
    time_range: Optional[Literal["any", "day", "week", "month", "year"]] = Field(
        description="Search results time range", default="any"
    )


class ScrapeToolInputSchema(BaseModel):
    urls: List[str] = Field(description="List of URLs to crawl")
    return_types: List[Literal["markdown", "metadata", "screenshot", "links"]] = Field(
        description="Return type of the result to return", default=["markdown"]
    )
    wait_time: int = Field(
        description="Wait time in milliseconds to load the page", default=1000
    )


class SitemapToolInputSchema(BaseModel):
    url: str = Field(description="The website URL to generate a sitemap for")
    search: Optional[str] = Field(
        description="Optional search term to filter URLs in the sitemap. If provided, the sitemap will only include URLs containing the search term. it use bm25 to filter urls.",
        default=None,
    )
    ignore_sitemap_xml: bool = Field(
        description="If true, ignores sitemap.xml and crawls the website instead",
        default=False,
    )
    include_subdomains: bool = Field(
        description="If true, includes URLs from subdomains", default=True
    )
    include_paths: List[str] = Field(
        description="List of glob patterns for paths to include (e.g., '/blog/*')",
        default_factory=list,
    )
    exclude_paths: List[str] = Field(
        description="List of glob patterns for paths to exclude", default_factory=list
    )


@register_builtin_tool("search")
class WaterCrawlSearchTool(BaseBuiltinTool):
    """
    Perform a web search using WaterCrawl's search engine.
    This tool allows searching the web for specific information and returns relevant URLs and snippets.
    """

    name = "Search Tool"
    input_schema = SearchToolInputSchema

    async def arun(self, tool_call_id: str, **params) -> ToolMessage:
        team = self.context.get("team")
        if not team:
            return ToolMessage(
                content="Error: Team context is required for this tool.",
                tool_call_id=tool_call_id,
            )

        query = params.get("query")
        limit = params.get("limit", 5)
        depth = params.get("depth", consts.SEARCH_DEPTH_BASIC)
        language = params.get("language")
        country = params.get("country")
        time_range = params.get("time_range", "any")

        # Validate credit and usage
        validator = PlanLimitValidator(team=team)
        try:
            await asyncio.to_thread(
                validator.validate_search_request,
                {
                    "query": query,
                    "result_limit": limit,
                    "search_options": {"depth": depth},
                },
            )
        except PermissionDenied as e:
            return ToolMessage(
                content=f"Validation Error: {str(e)}", tool_call_id=tool_call_id
            )

        try:
            # Initialize search service with factory method
            search_options = {
                "depth": depth,
                "language": language,
                "country": country,
                "time_range": time_range,
            }

            service = await asyncio.to_thread(
                SearchService.make_with_query,
                team=team,
                query=query,
                result_limit=limit,
                search_options=search_options,
            )

            # Run search service
            await asyncio.to_thread(service.run)

            # Refresh and read results
            await service.search_request.arefresh_from_db()

            if (
                service.search_request.status == consts.CRAWL_STATUS_FINISHED
                and service.search_request.result
            ):
                # Use to_thread for file reading
                result_content = await asyncio.to_thread(
                    service.search_request.result.read
                )
                results = json.loads(result_content.decode("utf-8"))
                return ToolMessage(
                    content=json.dumps(results, indent=2), tool_call_id=tool_call_id
                )
            else:
                return ToolMessage(
                    content=f"Search failed or returned no results. Status: {service.search_request.status}",
                    tool_call_id=tool_call_id,
                )

        except Exception as e:
            return ToolMessage(
                content=f"Error performing search: {str(e)}", tool_call_id=tool_call_id
            )


@register_builtin_tool("scrape")
class WaterCrawlScrapeTool(BaseBuiltinTool):
    """
    Crawl specific URLs to extract their content using WaterCrawl's crawling engine.
    Returns the extracted markdown content and metadata from the pages.
    """

    name = "Scrape Tool"
    input_schema = ScrapeToolInputSchema

    async def arun(self, tool_call_id: str, **params) -> ToolMessage:
        team = self.context.get("team")
        if not team:
            return ToolMessage(
                content="Error: Team context is required for this tool.",
                tool_call_id=tool_call_id,
            )

        urls = params.get("urls", [])
        if not urls:
            return ToolMessage(
                content="Error: At least one URL is required for crawling.",
                tool_call_id=tool_call_id,
            )

        return_types = params.get("return_types", ["markdown"])
        wait_time = params.get("wait_time", 1)

        # Validate credit and usage
        validator = PlanLimitValidator(team=team)
        try:
            await asyncio.to_thread(
                validator.validate_crawl_request,
                {
                    "urls": urls,
                    "options": {"spider_options": {"page_limit": len(urls)}},
                },
            )
        except PermissionDenied as e:
            return ToolMessage(
                content=f"Validation Error: {str(e)}", tool_call_id=tool_call_id
            )

        try:
            service = await asyncio.to_thread(
                CrawlerService.make_with_urls,
                urls=urls,
                team=team,
                spider_options=None,
                page_options={
                    "wait_time": max(wait_time, 30000),
                    "include_links": "links" in return_types,
                    "actions": [{"type": "screenshot"}]
                    if "screenshot" in return_types
                    else [],
                },
            )

            # Run the crawl
            await asyncio.to_thread(service.run)

            # Refresh and collect results
            await service.crawl_request.arefresh_from_db()

            if service.crawl_request.status == consts.CRAWL_STATUS_FINISHED:
                # Fetch results from the database
                results = []

                async for crawl_result in service.crawl_request.results.all():
                    # Read the result file
                    result_data_raw = await asyncio.to_thread(crawl_result.result.read)
                    result_data = json.loads(result_data_raw.decode("utf-8"))
                    result = {
                        "url": crawl_result.url,
                        "links": result_data.get("links", [])
                        if "links" in return_types
                        else [],
                        "content": result_data.get("markdown", "")
                        if "markdown" in return_types
                        else "",
                        "metadata": result_data.get("metadata", {})
                        if "metadata" in return_types
                        else {},
                    }
                    if "screenshot" in return_types:
                        attachment = await crawl_result.attachments.filter(
                            attachment_type="screenshot"
                        ).afirst()
                        if attachment:
                            result["screenshot"] = attachment.attachment.url
                    results.append(result)

                if not results:
                    return ToolMessage(
                        content="Crawl completed but no content was extracted.",
                        tool_call_id=tool_call_id,
                    )

                return ToolMessage(
                    content=json.dumps(results, indent=2), tool_call_id=tool_call_id
                )
            else:
                return ToolMessage(
                    content=f"Crawl failed. Status: {service.crawl_request.status}",
                    tool_call_id=tool_call_id,
                )

        except Exception as e:
            return ToolMessage(
                content=f"Error performing crawl: {str(e)}", tool_call_id=tool_call_id
            )


@register_builtin_tool("sitemap")
class WaterCrawlSitemapTool(BaseBuiltinTool):
    """
    Generate or retrieve a sitemap for a given website URL.
    Returns a list of URLs discovered on the website.
    """

    name = "Sitemap Tool"
    input_schema = SitemapToolInputSchema

    async def arun(self, tool_call_id: str, **params) -> ToolMessage:
        team = self.context.get("team")
        if not team:
            return ToolMessage(
                content="Error: Team context is required for this tool.",
                tool_call_id=tool_call_id,
            )

        url = params.get("url")
        search = params.get("search")
        ignore_sitemap_xml = params.get("ignore_sitemap_xml", False)
        include_subdomains = params.get("include_subdomains", True)
        include_paths = params.get("include_paths", [])
        exclude_paths = params.get("exclude_paths", [])

        # Validate credit and usage
        validator = PlanLimitValidator(team=team)
        try:
            await asyncio.to_thread(
                validator.validate_sitemap_request,
                {"url": url, "options": {"ignore_sitemap_xml": ignore_sitemap_xml}},
            )
        except PermissionDenied as e:
            return ToolMessage(
                content=f"Validation Error: {str(e)}", tool_call_id=tool_call_id
            )

        try:
            # Initialize sitemap service with factory method
            options = {
                "search": search,
                "ignore_sitemap_xml": ignore_sitemap_xml,
                "include_subdomains": include_subdomains,
                "include_paths": include_paths,
                "exclude_paths": exclude_paths,
            }

            service = await asyncio.to_thread(
                SitemapRequestService.make_with_url, team=team, url=url, options=options
            )

            # Run sitemap service
            await asyncio.to_thread(service.run)

            # Refresh and read results
            await service.sitemap.arefresh_from_db()

            if (
                service.sitemap.status == consts.CRAWL_STATUS_FINISHED
                and service.sitemap.result
            ):
                result_content = await asyncio.to_thread(service.sitemap.result.read)
                results = json.loads(result_content.decode("utf-8"))
                return ToolMessage(
                    content=json.dumps(results, indent=2), tool_call_id=tool_call_id
                )
            else:
                return ToolMessage(
                    content=f"Sitemap generation failed or returned no results. Status: {service.sitemap.status}",
                    tool_call_id=tool_call_id,
                )

        except Exception as e:
            return ToolMessage(
                content=f"Error generating sitemap: {str(e)}", tool_call_id=tool_call_id
            )
