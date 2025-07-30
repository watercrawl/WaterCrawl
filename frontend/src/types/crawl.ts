import { FeedMessage } from "./feed";

export type CrawlStatus = 'new' | 'running' | 'canceled' | 'canceling' | 'failed' | 'finished';

export type CrawlType = 'single' | 'batch';

export interface CrawlRequest {
  uuid: string;
  url: string | null;
  urls: string[];
  crawl_type?: CrawlType;
  status: CrawlStatus;
  options: CrawlOptions;
  created_at: string;
  updated_at: string;
  sitemap: string | null;
  number_of_documents: number;
  duration: string | null;
}

export interface BatchCrawlOptions extends Omit<CrawlOptions, 'spider_options'> {
  spider_options: {
    proxy_server?: string;
  };
};

export type BatchCrawlRequest = Omit<CrawlRequest, 'url' | 'urls' | 'options'> & {
  urls: string[];
  url: null;
  options: BatchCrawlOptions;
};

export interface ResultAttachment {
  uuid: string;
  attachment: string;
  attachment_type: string;
  filename: string;
}

export interface ResultData {
  markdown?: string;
  links?: string[];
  html?: string;
  metadata?: Record<string, string>;
}

export interface CrawlResult {
  uuid: string;
  title: string;
  url: string;
  result: string | ResultData;
  created_at: string;
  attachments: ResultAttachment[];
}

export interface Action {
  type: 'pdf' | 'screenshot';
}

export interface PageOptions {
  exclude_tags: string[];
  include_tags: string[];
  wait_time: number;
  include_html: boolean;
  only_main_content: boolean;
  include_links: boolean;
  timeout?: number;
  accept_cookies_selector?: string;
  locale?: string;
  extra_headers?: Record<string, string>;
  actions?: Action[]
  ignore_rendering?: boolean;
}

export interface SpiderOptions {
  max_depth?: number;
  page_limit?: number;
  allowed_domains?: string[];
  exclude_paths?: string[];
  include_paths?: string[];
  proxy_server: string | null;
}

export interface CrawlOptions {
  spider_options: SpiderOptions;
  page_options: PageOptions;
  plugin_options?: Record<string, object>;
}

export interface CrawlEvent {
  type: 'state' | 'result' | 'feed';
  data: CrawlRequest | CrawlResult | FeedMessage;
}

export interface CrawlState {
  request: CrawlRequest | null;
  results: CrawlResult[];
  isExpanded: boolean;
}
export interface SitemapNode {
  title?: string;
  url: string;
}

export interface SitemapGraph {
  __self__?: SitemapNode;
  __query__?: SitemapNode[];
  [key: string]: SitemapGraph | SitemapNode | SitemapNode[] | undefined;
};