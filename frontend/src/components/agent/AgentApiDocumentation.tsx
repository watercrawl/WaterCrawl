import React, { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ApiDocumentation, ApiDocTab } from '../shared/ApiDocumentation';

import { useApiDocumentation } from '../../hooks/useApiDocumentation';
import { Agent, ContextParameters } from '../../types/agent';

interface AgentApiDocumentationProps {
  agent: Agent | null;
  contextVariables?: ContextParameters[];
}

export const AgentApiDocumentation: React.FC<AgentApiDocumentationProps> = ({
  agent,
  contextVariables = [],
}) => {
  const { t } = useTranslation();
  const { getBaseUrl } = useApiDocumentation();

  // Build inputs object for examples
  const inputsExample = useMemo(() => {
    if (contextVariables.length === 0) return '{}';
    const inputs: Record<string, any> = {};
    contextVariables.forEach(v => {
      if (v.parameter_type === 'number') {
        inputs[v.name] = 0;
      } else if (v.parameter_type === 'boolean') {
        inputs[v.name] = false;
      } else {
        inputs[v.name] = 'value';
      }
    });
    return JSON.stringify(inputs, null, 2).split('\n').map((line, i) => i === 0 ? line : '  ' + line).join('\n');
  }, [contextVariables]);
  
  const inputsComment = useMemo(() => 
    contextVariables.length > 0 
      ? `  # Context variables: ${contextVariables.map(v => v.name).join(', ')}`
      : '  # Optional: context variables'
  , [contextVariables]);

  const tabs: ApiDocTab[] = useMemo(() => {
    const hasJsonOutput = agent?.status === 'published'; // We'll check published version for json_output
    
    const generateCurlCommand = (apiKey: string) => {
      if (!agent) return t('api.noRequestData');
      
      const basicPayload = `{
  "query": "Your question here",
  "user": "user@example.com",
  "conversation_id": null,
  "inputs": ${inputsExample},
  "files": []${hasJsonOutput ? ',\n  "output_schema": {}' : ''}
}`;
      
      const filteredPayload = `{
  "query": "Your question here",
  "user": "user@example.com",
  "conversation_id": null,
  "inputs": ${inputsExample},
  "files": [],
  "event_types": ["message", "done"]${hasJsonOutput ? ',\n  "output_schema": {}' : ''}
}`;
      
      return `# Basic Streaming Request (all events)
curl -X POST \\
  "${getBaseUrl()}/api/v1/agent/agents/${agent.uuid}/chat-message/" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '${basicPayload}'

# Filtered Events (only message and done events)
curl -X POST \\
  "${getBaseUrl()}/api/v1/agent/agents/${agent.uuid}/chat-message/" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '${filteredPayload}'

# Notes:
# - All responses are Server-Sent Events (SSE) streams
# - Keepalive pings are sent every 10 seconds if no events occur
# - Available event types: message, tool_call, tool_result, conversation, title, done, error, ping`;
    };

    const generatePythonCode = (apiKey: string) => {
      if (!agent) return t('api.noRequestData');
      
      const baseUrl = getBaseUrl();
      const agentUuid = agent.uuid;
      const schemaParam = hasJsonOutput ? ',\n    output_schema={}  # Required: JSON schema for structured output' : '';
      
      const inputsPython = inputsExample.replace(/\n/g, '\n    ');
      
      return `from watercrawl import WaterCrawlAPIClient

# Initialize the client
client = WaterCrawlAPIClient(api_key='${apiKey}', base_url='${baseUrl}')

# Stream chat responses (SSE - Server-Sent Events)
# Note: This endpoint only supports streaming mode
for event in client.chat_with_agent(
    agent_id='${agentUuid}',
    query='Your question here',
    user='user@example.com',  # Required: user identifier
    conversation_id=None,  # Optional: continue existing conversation
    inputs=${inputsPython},${inputsComment}
    files=[],
    event_types=None  # Optional: filter events (e.g., ['message', 'done'])${schemaParam}
):
    # Handle different event types
    if event['event'] == 'message':
        # Stream message chunks as they arrive
        print(event['data'], end='', flush=True)
    elif event['event'] == 'tool_call':
        # Agent is calling a tool
        print(f"\\nTool: {event['data']['tool_name']}")
    elif event['event'] == 'done':
        # Stream completed
        print("\\nDone")
    elif event['event'] == 'ping':
        # Keepalive ping (sent every 10s if no events)
        pass

# Available event types:
# - message: Text chunks from the agent
# - tool_call: When agent calls a tool
# - tool_result: Result from tool execution
# - conversation: Conversation metadata
# - title: Generated conversation title
# - done: Stream completion
# - error: Error occurred
# - ping: Keepalive signal`;
    };

    const generateNodeCode = (apiKey: string) => {
      if (!agent) return t('api.noRequestData');
      
      const baseUrl = getBaseUrl();
      const agentUuid = agent.uuid;
      const schemaParam = hasJsonOutput ? ',\n  outputSchema: {}  // Required: JSON schema for structured output' : '';
      const inputsNode = inputsExample.replace(/\n/g, '\n  ');
      const inputsCommentNode = contextVariables.length > 0 
        ? `  // Context variables: ${contextVariables.map(v => v.name).join(', ')}`
        : '  // Optional: context variables';
      
      return `import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize the client with your API key
const client = new WaterCrawlAPIClient('${apiKey}', '${baseUrl}');

// Stream chat responses (SSE - Server-Sent Events)
// Note: This endpoint only supports streaming mode
const stream = client.chatWithAgent({
  agentId: '${agentUuid}',
  query: 'Your question here',
  user: 'user@example.com',  // Required: user identifier
  conversationId: null,  // Optional: continue existing conversation
  inputs: ${inputsNode},${inputsCommentNode}
  files: [],
  eventTypes: null  // Optional: filter events (e.g., ['message', 'done'])${schemaParam}
});

for await (const event of stream) {
  // Handle different event types
  if (event.event === 'message') {
    // Stream message chunks as they arrive
    process.stdout.write(event.data);
  } else if (event.event === 'tool_call') {
    // Agent is calling a tool
    console.log(\`\\nTool: \${event.data.tool_name}\`);
  } else if (event.event === 'done') {
    // Stream completed
    console.log('\\nDone');
  } else if (event.event === 'ping') {
    // Keepalive ping (sent every 10s if no events)
  }
}

// Available event types:
// - message: Text chunks from the agent
// - tool_call: When agent calls a tool
// - tool_result: Result from tool execution
// - conversation: Conversation metadata
// - title: Generated conversation title
// - done: Stream completion
// - error: Error occurred
// - ping: Keepalive signal`;
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
  }, [agent, getBaseUrl,contextVariables, inputsComment, inputsExample, t]);

  return (
    <ApiDocumentation
      titleKey="api.title"
      descriptionKey="api.agent.fullDescription"
      tabs={tabs}
      emptyStateDescriptionKey="api.agent.description"
      showEmptyState={!agent}
      showHeader={false}
      showBorder={false}
    />
  );
};
