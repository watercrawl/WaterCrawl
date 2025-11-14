import React, { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ApiDocumentation, ApiDocTab } from '../shared/ApiDocumentation';

import { useApiDocumentation } from '../../hooks/useApiDocumentation';
import { CrawlRequest } from '../../types/crawl';
import { toPythonDict, toNodeJsOptions, toGoMap } from '../../utils/codeFormatters';

interface CrawlApiDocumentationProps {
  request: CrawlRequest | null;
  isBatch: boolean;
}

export const CrawlApiDocumentation: React.FC<CrawlApiDocumentationProps> = ({
  request,
  isBatch,
}) => {
  const { t } = useTranslation();
  const { getBaseUrl } = useApiDocumentation();

  const tabs: ApiDocTab[] = useMemo(() => {
    const generateCurlCommand = (apiKey: string) => {
      if (!request) return t('api.noRequestData');
      const data = isBatch
        ? {
            urls: request.urls,
            options: request.options,
          }
        : {
            url: request.url,
            options: request.options,
          };
      return `curl -X POST \\
  "${getBaseUrl()}/api/v1/core/crawl-requests/${isBatch ? 'batch/' : ''}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '${JSON.stringify(data, null, 2)}'`;
    };

    const generatePythonCode = (apiKey: string) => {
      const baseUrl = getBaseUrl();
      const spiderOptions = request?.options?.spider_options || {};
      const pageOptions = request?.options?.page_options || {};
      const pluginOptions = request?.options?.plugin_options || {};

      if (isBatch) {
        const urls = request?.urls || ['https://example.com', 'https://example.org'];
        return `from watercrawl import WaterCrawlAPIClient

# Initialize the client
client = WaterCrawlAPIClient(api_key='${apiKey}', base_url='${baseUrl}')

# Advanced batch crawling with options
crawl_request = client.create_batch_crawl_request(
    urls=${toPythonDict(urls, 4, 2)},
    spider_options=${toPythonDict(spiderOptions, 4, 2)},
    page_options=${toPythonDict(pageOptions, 4, 2)},
    plugin_options=${toPythonDict(pluginOptions, 4, 2)}
)`;
      } else {
        const url = request?.url || 'https://example.com';
        return `from watercrawl import WaterCrawlAPIClient

# Initialize the client
client = WaterCrawlAPIClient(api_key='${apiKey}', base_url='${baseUrl}')

# Advanced crawling with options
crawl_request = client.create_crawl_request(
    url='${url}',
    spider_options=${toPythonDict(spiderOptions, 4, 2)},
    page_options=${toPythonDict(pageOptions, 4, 2)},
    plugin_options=${toPythonDict(pluginOptions, 4, 2)}
)`;
      }
    };

    const generateNodeCode = (apiKey: string) => {
      const baseUrl = getBaseUrl();
      const spiderOptions = request?.options?.spider_options || {};
      const pageOptions = request?.options?.page_options || {};
      const pluginOptions = request?.options?.plugin_options || {};

      if (isBatch) {
        const urls = request?.urls || ['https://example.com', 'https://example.org'];
        return `import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize the client with your API key
const client = new WaterCrawlAPIClient('${apiKey}', '${baseUrl}');

const crawlRequest = await client.createBatchCrawlRequest(
  ${toNodeJsOptions(urls, 2, 2)},
  ${toNodeJsOptions(spiderOptions, 2, 2)},
  ${toNodeJsOptions(pageOptions, 2, 2)},
  ${toNodeJsOptions(pluginOptions, 2, 2)}
);
console.log(crawlRequest);`;
      } else {
        const url = request?.url || 'https://example.com';
        return `import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize the client with your API key
const client = new WaterCrawlAPIClient('${apiKey}', '${baseUrl}');

const crawlRequest = await client.createCrawlRequest(
  '${url}',
  ${toNodeJsOptions(spiderOptions, 2, 2)},
  ${toNodeJsOptions(pageOptions, 2, 2)},
  ${toNodeJsOptions(pluginOptions, 2, 2)}
);
console.log(crawlRequest);`;
      }
    };

    const generateGoCode = (apiKey: string) => {
      const baseUrl = getBaseUrl();
      const spiderOptions = request?.options?.spider_options || {};
      const pageOptions = request?.options?.page_options || {};
      const pluginOptions = request?.options?.plugin_options || {};

      if (isBatch) {
        const urls = request?.urls || ['https://example.com', 'https://example.org'];
        return `import "github.com/watercrawl/watercrawl-go"

client := watercrawl.NewClient("${apiKey}", "${baseUrl}")  // Empty string uses default base URL

ctx := context.Background()
input := watercrawl.CreateBatchCrawlRequestInput{
    URLs: ${toGoMap(urls, 4, 3)},
    Options: watercrawl.CrawlOptions{
        SpiderOptions: ${toGoMap(spiderOptions, 4, 3)},
        PageOptions: ${toGoMap(pageOptions, 4, 3)},
        PluginOptions: ${toGoMap(pluginOptions, 4, 3)},
    },
}

result, err := client.CreateBatchCrawlRequest(ctx, input)
if err != nil {
    log.Fatal(err)
}`;
      } else {
        const url = request?.url || 'https://example.com';
        return `import "github.com/watercrawl/watercrawl-go"

client := watercrawl.NewClient("${apiKey}", "${baseUrl}")  // Empty string uses default base URL

ctx := context.Background()
input := watercrawl.CreateCrawlRequestInput{
    URL: "${url}",
    Options: watercrawl.CrawlOptions{
        SpiderOptions: ${toGoMap(spiderOptions, 4, 3)},
        PageOptions: ${toGoMap(pageOptions, 4, 3)},
        PluginOptions: ${toGoMap(pluginOptions, 4, 3)},
    },
}

result, err := client.CreateCrawlRequest(ctx, input)
if err != nil {
    log.Fatal(err)
}`;
      }
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
        contentGenerator: generatePythonCode,
        documentTitle: 'Python Client Documentation',
        documentUrl: 'https://docs.watercrawl.dev/clients/python',
        installCommand: 'pip install watercrawl-py',
        language: 'python',
      },
      {
        name: 'Node.js',
        contentGenerator: generateNodeCode,
        documentTitle: 'Node.js Client Documentation',
        documentUrl: 'https://docs.watercrawl.dev/clients/nodejs',
        installCommand: 'npm install @watercrawl/nodejs',
        language: 'javascript',
      },
      {
        name: 'Go',
        contentGenerator: generateGoCode,
        documentTitle: 'Go Client Documentation',
        documentUrl: 'https://github.com/watercrawl/watercrawl-go',
        installCommand: 'go get github.com/watercrawl/watercrawl-go',
        language: 'go',
      },
    ];
  }, [request, isBatch, getBaseUrl, t]);

  return (
    <ApiDocumentation
      titleKey="api.title"
      descriptionKey="api.crawl.fullDescription"
      tabs={tabs}
      emptyStateDescriptionKey="api.crawl.description"
      showEmptyState={!request}
    />
  );
};
