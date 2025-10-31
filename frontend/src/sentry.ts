import * as Sentry from "@sentry/react";
import { browserTracingIntegration, replayIntegration } from "@sentry/react";

//TODO: Move is somewhere else
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



export function initSentry() {
    const cfg = window.__APP_CONFIG__;
    const dsn = cfg?.SENTRY_DSN || import.meta.env.VITE_SENTRY_DSN;
    const release = import.meta.env.VITE_VERSION;

    // Check for empty or missing DSN
    if (!dsn || dsn.trim() === '') {
        console.log('[Sentry] Initialization skipped - no DSN configured');
        return;
    }

    console.log('[Sentry] Initializing with release:', release);

    Sentry.init({
        dsn,
        release,
        integrations: [
            browserTracingIntegration(),
            replayIntegration()
        ],
        tracesSampleRate: cfg?.SENTRY_TRACES_SAMPLE_RATE || import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE,
        replaysSessionSampleRate: cfg?.SENTRY_REPLAYS_SESSION_SAMPLE_RATE || import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
        replaysOnErrorSampleRate: cfg?.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
        environment: cfg?.ENVIRONMENT || import.meta.env.VITE_SENTRY_ENVIRONMENT,
        sendDefaultPii: cfg?.SENTRY_SEND_DEFAULT_PII || import.meta.env.VITE_SENTRY_SEND_DEFAULT_PII,
        enableLogs: cfg?.SENTRY_ENABLE_LOGS || import.meta.env.VITE_SENTRY_ENABLE_LOGS,
    });
}
