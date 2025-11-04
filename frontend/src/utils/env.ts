declare global {
    interface Window {
        __APP_CONFIG__?: {
            APP_VERSION?: string;
            SENTRY_DSN?: string;
            ENVIRONMENT?: string;
            SENTRY_TRACES_SAMPLE_RATE?: number;
            SENTRY_REPLAYS_SESSION_SAMPLE_RATE?: number;
            SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE?: number;
            SENTRY_SEND_DEFAULT_PII?: boolean;
            SENTRY_ENABLE_LOGS?: boolean;
            API_URL?: string;
        };
    }
}

export const API_URL: string = window.__APP_CONFIG__?.API_URL || import.meta.env.VITE_API_BASE_URL || '/';