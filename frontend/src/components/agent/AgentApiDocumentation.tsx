import React, { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ApiDocumentation, ApiDocTab } from '../shared/ApiDocumentation';

import { useApiDocumentation } from '../../hooks/useApiDocumentation';
import { Agent } from '../../types/agent';

interface AgentApiDocumentationProps {
  agent: Agent | null;
}

export const AgentApiDocumentation: React.FC<AgentApiDocumentationProps> = ({
  agent,
}) => {
  const { t } = useTranslation();
  const { getBaseUrl } = useApiDocumentation();

  const tabs: ApiDocTab[] = useMemo(() => {
    const hasJsonOutput = agent?.status === 'published'; // We'll check published version for json_output
    
    const generateCurlCommand = (apiKey: string) => {
      if (!agent) return t('api.noRequestData');
      
      const basePayload = `{
    "query": "Your question here",
    "conversation_id": null,
    "inputs": {}${hasJsonOutput ? ',\n    "output_schema": {}  // Optional: JSON schema for structured output' : ''}
  }`;
      
      return `# Blocking Mode (wait for complete response)
curl -X POST \\
  "${getBaseUrl()}/api/v1/agents/${agent.uuid}/chat/" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '${basePayload}'

# Streaming Mode (real-time response)
curl -X POST \\
  "${getBaseUrl()}/api/v1/agents/${agent.uuid}/chat/stream/" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Accept: text/event-stream" \\
  -d '${basePayload}'`;
    };

    const generatePythonCode = (apiKey: string) => {
      if (!agent) return t('api.noRequestData');
      
      const baseUrl = getBaseUrl();
      const agentUuid = agent.uuid;
      const schemaParam = hasJsonOutput ? ',\n    output_schema={}  # Optional: JSON schema for structured output' : '';
      
      return `from watercrawl import WaterCrawlAPIClient

# Initialize the client
client = WaterCrawlAPIClient(api_key='${apiKey}', base_url='${baseUrl}')

# Blocking Mode - Get complete response at once
response = client.chat_with_agent(
    agent_id='${agentUuid}',
    query='Your question here',
    conversation_id=None,  # Optional: continue existing conversation
    inputs={}${schemaParam}
)
print(response['message'])

# Streaming Mode - Get response in real-time chunks
for chunk in client.chat_with_agent_stream(
    agent_id='${agentUuid}',
    query='Your question here',
    conversation_id=None,
    inputs={}${schemaParam}
):
    print(chunk, end='', flush=True)`;
    };

    const generateNodeCode = (apiKey: string) => {
      if (!agent) return t('api.noRequestData');
      
      const baseUrl = getBaseUrl();
      const agentUuid = agent.uuid;
      const schemaParam = hasJsonOutput ? ',\n  {}     // output_schema: JSON schema for structured output (optional)' : '';
      
      return `import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize the client with your API key
const client = new WaterCrawlAPIClient('${apiKey}', '${baseUrl}');

// Blocking Mode - Get complete response at once
const response = await client.chatWithAgent(
  '${agentUuid}',
  'Your question here',
  null,  // conversationId: continue existing conversation
  {}${schemaParam}
);
console.log(response.message);

// Streaming Mode - Get response in real-time chunks
const stream = client.chatWithAgentStream(
  '${agentUuid}',
  'Your question here',
  null,
  {}${schemaParam}
);

for await (const chunk of stream) {
  process.stdout.write(chunk);
}`;
    };

    return [
      {
        name: 'cURL',
        contentGenerator: generateCurlCommand,
        documentTitle: 'Agent API Documentation',
        documentUrl: 'https://docs.watercrawl.dev/api/agents/',
        installCommand: 'no additional installation required',
        language: 'bash',
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
    ];
  }, [agent, getBaseUrl, t]);

  return (
    <ApiDocumentation
      titleKey="api.title"
      descriptionKey="api.agent.fullDescription"
      tabs={tabs}
      emptyStateDescriptionKey="api.agent.description"
      showEmptyState={!agent}
    />
  );
};
