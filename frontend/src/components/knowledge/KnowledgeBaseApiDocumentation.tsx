import React, { useMemo } from 'react';

import { ApiDocumentation, ApiDocTab } from '../shared/ApiDocumentation';

import { useApiDocumentation } from '../../hooks/useApiDocumentation';

interface KnowledgeBaseApiDocumentationProps {
  knowledgeBaseId: string;
  query: string;
  top_k: number;
}

export const KnowledgeBaseApiDocumentation: React.FC<KnowledgeBaseApiDocumentationProps> = ({
  knowledgeBaseId,
  query,
  top_k,
}) => {
  const { getBaseUrl } = useApiDocumentation();

  const tabs: ApiDocTab[] = useMemo(() => {
    const generateCurlCommand = (apiKey: string) => {
      const baseUrl = getBaseUrl();
      const requestBody = {
        query: query || 'your query here',
        top_k: top_k,
      };

      return `curl -X POST "${baseUrl}/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseId}/query/" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '${JSON.stringify(requestBody, null, 2)}'`;
    };

    const generatePythonCommand = (apiKey: string) => {
      const baseUrl = getBaseUrl();

      return `from watercrawl import WaterCrawlAPIClient

# Initialize the client
client = WaterCrawlAPIClient(api_key='${apiKey}', base_url='${baseUrl}')

# Query the knowledge base
results = client.query_knowledge_base(
    knowledge_base_id='${knowledgeBaseId}',
    query='${query || 'your query here'}',
    top_k=${top_k}
)

# Print the results
print(f"Found {len(results)} relevant chunks:")
for i, chunk in enumerate(results, 1):
    print(f"Chunk {i}:")
    print(f"  Content: {chunk['content']}")
    print(f"  Source: {chunk['metadata']['source']}")
    print(f"  Index: {chunk['metadata']['index']}")
    print(f"  UUID: {chunk['metadata']['uuid']}")
    print(f"  Keywords: {', '.join(chunk['metadata']['keywords'])}")
    print("---")`;
    };

    const generateNodeJsCommand = (apiKey: string) => {
      const baseUrl = getBaseUrl();

      return `import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize the client with your API key
const client = new WaterCrawlAPIClient('${apiKey}', '${baseUrl}');

const queryKnowledgeBase = async () => {
  try {
    const results = await client.queryKnowledgeBase(
    '${knowledgeBaseId}', // Knowledge base ID
    '${query || 'your query here'}', // Query
    ${top_k} // Number of results
    );

    console.log(\`Found \${results.length} relevant chunks:\`);
    results.forEach((chunk, index) => {
      console.log(\`Chunk \${index + 1}:\`);
      console.log(\`  Content: \${chunk.content}\`);
      console.log(\`  Source: \${chunk.metadata.source}\`);
      console.log(\`  Index: \${chunk.metadata.index}\`);
      console.log(\`  UUID: \${chunk.metadata.uuid}\`);
      console.log(\`  Keywords: \${chunk.metadata.keywords.join(', ')}\`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error querying knowledge base:', error);
  }
};

queryKnowledgeBase();`;
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
  }, [knowledgeBaseId, query, top_k, getBaseUrl]);

  return (
    <ApiDocumentation
      titleKey="api.title"
      descriptionKey="api.knowledgeBase.fullDescription"
      tabs={tabs}
    />
  );
};
