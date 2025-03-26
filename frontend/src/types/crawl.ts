export type CrawlStatus = 'new' | 'running' | 'cancelled' | 'canceling' | 'failed' | 'finished';

export interface CrawlRequest {
  uuid: string;
  url: string;
  status: CrawlStatus;
  options: CrawlOptions;
  created_at: string;
  updated_at: string;
  number_of_documents: number;
  duration: string | null;
}

export interface ResultAttachment {
  uuid: string;
  attachment: string;
  attachment_type: string;
  filename: string;
}

export interface CrawlResult {
  uuid: string;
  title: string;
  url: string;
  result: string;
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
}

export interface SpiderOptions {
  max_depth?: number;
  page_limit?: number;
  allowed_domains?: string[];
  exclude_paths?: string[];
  include_paths?: string[];
}

export interface CrawlOptions {
  spider_options: SpiderOptions;
  page_options: PageOptions;
  plugin_options?: Record<string, object>;
}

export interface CrawlEvent {
  type: 'state' | 'result';
  data: CrawlRequest | CrawlResult;
}

export interface CrawlState {
  request: CrawlRequest | null;
  results: CrawlResult[];
  isExpanded: boolean;
}