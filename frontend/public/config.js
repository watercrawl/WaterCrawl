// Default runtime configuration for local development
// This file is replaced at runtime in Docker deployments via docker-entrypoint.sh
window.__APP_CONFIG__ = {
  SENTRY_DSN: null,
  APP_VERSION: null,
  API_URL: null,
  ENVIRONMENT: null,
  SENTRY_TRACES_SAMPLE_RATE: null,
  SENTRY_REPLAYS_SESSION_SAMPLE_RATE: null,
  SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE: null,
  SENTRY_SEND_DEFAULT_PII: false,
  SENTRY_ENABLE_LOGS: false,
};

