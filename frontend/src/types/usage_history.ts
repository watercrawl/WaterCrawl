export enum ContentType {
  CrawlRequest = 'core.crawlrequest',
  SitemapRequest = 'core.sitemaprequest',
  SearchRequest = 'core.searchrequest',
  KnowledgeBaseDocument = 'knowledge_base.knowledgebasedocument',
  KnowledgeBaseQuery = 'knowledge_base.knowledgebasequery',
}

export interface TeamAPIKeySummary {
  uuid: string;
  name: string;
}

export interface UsageHistory {
  uuid: string;
  content_type: ContentType;
  content_id: string;
  requested_page_credit: number;
  used_page_credit: number;
  team_api_key: TeamAPIKeySummary | null;
  created_at: string;
  updated_at: string;
}
