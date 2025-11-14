import React, { useMemo } from 'react';

import { ApiDocumentation, ApiDocTab } from '../shared/ApiDocumentation';

import { useApiDocumentation } from '../../hooks/useApiDocumentation';
import { SitemapRequest } from '../../types/sitemap';
import { toPythonDict, toNodeJsOptions } from '../../utils/codeFormatters';

interface SitemapApiDocumentationProps {
  request?: SitemapRequest | null;
}

export const SitemapApiDocumentation: React.FC<SitemapApiDocumentationProps> = ({ request }) => {
  const { getBaseUrl } = useApiDocumentation();

  const tabs: ApiDocTab[] = useMemo(() => {
    const generateCurlCommand = (apiKey: string) => {
      const baseUrl = getBaseUrl();

      return `curl -X POST "${baseUrl}/api/v1/core/sitemaps/" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '${JSON.stringify(request, null, 2)}'`;
    };

    const generatePythonCommand = (apiKey: string) => {
      const baseUrl = getBaseUrl();

      return `from watercrawl import WaterCrawlAPIClient

# Initialize the client
client = WaterCrawlAPIClient(api_key='${apiKey}', base_url='${baseUrl}')

# Create sitemap request
sitemap_request = client.create_sitemap_request(
    url='${request?.url || 'https://example.com'}',
    options=${toPythonDict(request?.options, 4, 2)}
)

# Get request UUID
request_uuid = sitemap_request.uuid
print(f"Sitemap request ID: {request_uuid}")`;
    };

    const generateNodeJsCommand = (apiKey: string) => {
      const baseUrl = getBaseUrl();

      return `import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize the client with your API key
const client = new WaterCrawlAPIClient('${apiKey}', '${baseUrl}');

const sitemapRequest = await client.createSitemapRequest({
  url: '${request?.url || 'https://example.com'}',
  options: ${toNodeJsOptions(request?.options, 2, 2)}
});

console.log('Sitemap request created:', sitemapRequest.uuid);`;
    };

    return [
      {
        name: 'cURL',
        contentGenerator: generateCurlCommand,
        documentTitle: 'API Documentation',
        documentUrl: 'https://docs.watercrawl.dev/api/documentation/',
        installCommand: 'no additional installation required',
        language: 'python',
      },
      {
        name: 'Python',
        contentGenerator: generatePythonCommand,
        documentTitle: 'Python Client Documentation',
        documentUrl: 'https://docs.watercrawl.dev/clients/python',
        installCommand: 'pip install watercrawl-py',
        language: 'python',
      },
      {
        name: 'Node.js',
        contentGenerator: generateNodeJsCommand,
        documentTitle: 'Node.js Client Documentation',
        documentUrl: 'https://docs.watercrawl.dev/clients/nodejs',
        installCommand: 'npm install @watercrawl/nodejs',
        language: 'javascript',
      },
    ];
  }, [request, getBaseUrl]);

  return (
    <ApiDocumentation
      titleKey="api.title"
      descriptionKey="api.sitemap.fullDescription"
      tabs={tabs}
      emptyStateDescriptionKey="api.sitemap.description"
      showEmptyState={!request}
    />
  );
};
