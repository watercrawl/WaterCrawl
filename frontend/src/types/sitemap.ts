import { FeedMessage } from "./feed";


export enum SitemapStatus {
  New = 'new',
  Running = 'running',
  Finished = 'finished',
  Failed = 'failed',
  Canceled = 'canceled'
}

export interface SitemapOptions {
  include_subdomains: boolean;
  ignore_sitemap_xml: boolean;
  search: string | null;
  include_paths: string[];
  exclude_paths: string[];
}

export interface SitemapRequest {
  uuid?: string;
  url: string;
  status?: SitemapStatus;
  options: SitemapOptions;
  duration?: string;
  result?: string | Array<string>;
  created_at?: string;
  updated_at?: string;
}
export enum EventType {
  Feed = 'feed',
  State = 'state'
}


export interface SitemapEvent {
  type: EventType;
  data: SitemapRequest | FeedMessage;
}
