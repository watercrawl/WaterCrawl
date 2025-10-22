export enum FeedType {
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

export interface FeedMessage {
  id: string;
  message: string;
  timestamp?: string;
  type: FeedType;
  metadata?: Record<string, any>;
}
