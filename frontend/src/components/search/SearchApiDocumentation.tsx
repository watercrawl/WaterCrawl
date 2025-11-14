import React, { useMemo } from 'react';

import { ApiDocumentation, ApiDocTab } from '../shared/ApiDocumentation';

import { useApiDocumentation } from '../../hooks/useApiDocumentation';
import { TimeRange, Depth, SearchType } from '../../types/search';

interface SearchApiDocumentationProps {
  query?: string;
  options?: {
    language: string;
    timeRange: TimeRange;
    numResults: number;
    country: string;
    depth: Depth;
  } | null;
}

export const SearchApiDocumentation: React.FC<SearchApiDocumentationProps> = ({
  query = 'example search query',
  options = null,
}) => {
  const { getBaseUrl } = useApiDocumentation();

  const defaultOptions = {
    language: '',
    country: '',
    timeRange: TimeRange.Any,
    numResults: 5,
    depth: Depth.Basic,
  };

  const searchOptions = options || defaultOptions;

  const tabs: ApiDocTab[] = useMemo(() => {
    const generateCurlCommand = (apiKey: string) => {
      const searchBody = {
        query: query,
        search_options: {
          language: searchOptions.language || undefined,
          country: searchOptions.country || undefined,
          time_range: searchOptions.timeRange || undefined,
          search_type: SearchType.Web,
          depth: searchOptions.depth || Depth.Basic,
        },
        result_limit: searchOptions.numResults || 5,
      };

      // Filter out undefined values for cleaner JSON
      const searchOptionsCopy = { ...searchBody.search_options };
      Object.keys(searchOptionsCopy).forEach(key => {
        if (searchOptionsCopy[key as keyof typeof searchOptionsCopy] === undefined) {
          delete searchOptionsCopy[key as keyof typeof searchOptionsCopy];
        }
      });
      searchBody.search_options = searchOptionsCopy;

      return `curl -X POST "${getBaseUrl()}/api/v1/core/search/" \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: ${apiKey}" \\
  -d '${JSON.stringify(searchBody, null, 2)}'`;
    };

    const generatePythonCommand = (apiKey: string) => {
      const baseUrl = getBaseUrl();

      return `from watercrawl import WaterCrawlAPIClient

# Initialize the client
client = WaterCrawlAPIClient(api_key='${apiKey}', base_url='${baseUrl}')

# Create search request
search_request = client.create_search_request(
    query='${query}',
    search_options={
        'language': ${searchOptions.language ? `'${searchOptions.language}'` : 'None'},
        'country': ${searchOptions.country ? `'${searchOptions.country}'` : 'None'},
        'time_range': ${searchOptions.timeRange ? `'${searchOptions.timeRange}'` : 'None'},
        'search_type': 'web',
        'depth': '${searchOptions.depth}'
    },
    result_limit=${searchOptions.numResults},
    sync=True,      # Default: True - wait for results
    download=True  # Default: True - get download links. Set to False for direct JSON results
)

# Get search results
print(f"Search request ID: {search_request.id}")
print(f"Status: {search_request.status}")
print(f"Results count: {len(search_request.results) if search_request.results else 0}")
`;
    };

    const generateNodeJsCommand = (apiKey: string) => {
      const baseUrl = getBaseUrl();

      return `import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize the client with your API key
const client = new WaterCrawlAPIClient('${apiKey}', '${baseUrl}');

// Create a search request
const searchRequest = await client.createSearchRequest(
  '${query}',
  {
    language: ${searchOptions.language ? `'${searchOptions.language}'` : 'null'},
    country: ${searchOptions.country ? `'${searchOptions.country}'` : 'null'},
    time_range: ${searchOptions.timeRange ? `'${searchOptions.timeRange}'` : 'null'},
    search_type: 'web',
    depth: '${searchOptions.depth}'
  },
  ${searchOptions.numResults},
  true,       // Default: true - wait for results
  true   // Default: true - get download links. Set to false for direct JSON results
);

console.log('Search request ID:', searchRequest.id);
console.log('Status:', searchRequest.status);
console.log('Results count:', searchRequest.results ? searchRequest.results.length : 0);
`;
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
  }, [query, searchOptions, getBaseUrl]);

  return (
    <ApiDocumentation
      titleKey="api.title"
      descriptionKey="api.search.fullDescription"
      tabs={tabs}
    />
  );
};
