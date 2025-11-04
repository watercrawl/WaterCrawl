export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
export interface ApiError {
  message?: string;
  errors?: Record<string, string[]>;
  code?: number;
}

export interface UsageStats {
  total_crawls: number;
  total_documents: number;
  running_crawls: number;
  failed_crawls: number;
  finished_crawls: number;
}

export interface UsageHistory {
  date: string;
  count: number;
}

export interface UsageResponse {
  crawl_history: UsageHistory[];
  document_history: UsageHistory[];
  finished_crawls: number;
  total_documents: number;
  total_crawls: number;
}
