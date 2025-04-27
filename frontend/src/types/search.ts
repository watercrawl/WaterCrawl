export enum SearchType {
  Web = 'web',
}

export enum SearchStatus {
  New = 'new',
  Running = 'running',
  Finished = 'finished',
  Failed = 'failed',
  Cancelled = 'cancelled'
}

export enum Depth {
  Basic = 'basic',
  Advanced = 'advanced',
  Ultimate = 'ultimate'
}

export enum TimeRange {
  Any = 'any',
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Year = 'year'
}

export interface SearchOptions {
  language?: string;
  country?: string;
  time_range?: TimeRange;
  search_type: SearchType;
  depth: Depth;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  description?: string;
  date?: string;
  depth?: Depth;
}

export interface SearchRequest {
  uuid?: string;
  query: string;
  search_options: SearchOptions;
  result_limit?: number;
  duration?: string;
  status?: SearchStatus;
  result?: string | SearchResult[];
  created_at?: string;
  number_of_documents?: number;
}

export interface SearchEvent {
  type: 'state';
  data: SearchRequest;
}
