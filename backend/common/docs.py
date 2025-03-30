from django.utils.translation import gettext_lazy as _

API_DESCRIPTION = _("""
# Introduction

This documentation covers all the external APIs that can be accessed using a Team API Key. These APIs are designed for integration with external systems and services.

## Authentication

All endpoints in this documentation require authentication using an API Key. To authenticate your requests:

1. Generate an API Key from the [API Keys Dashboard](https://app.watercrawl.dev/dashboard/api-keys)
2. Include the API Key in your requests using the `X-API-Key` header:

```bash
curl -H "X-API-Key: your_api_key_here" https://api.watercrawl.dev/v1/...
```

### Important Notes:
- Keep your API Key secure and never share it publicly
- You can generate multiple API Keys for different purposes
- You can revoke API Keys at any time from the dashboard
- Each API Key is associated with a specific team

## Rate Limiting
API requests are rate-limited based on your team's plan. Please refer to your plan details for specific limits.
""")

API_KEY_DESCRIPTION = _(
    "API Key for team authentication. Generate from https://app.watercrawl.dev/dashboard/api-keys"
)
