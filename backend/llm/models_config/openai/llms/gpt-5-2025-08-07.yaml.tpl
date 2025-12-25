model: gpt-5-2025-08-07
label: "{% trans 'gpt-5-2025-08-07' %}"
model_type: llm
features:
  - multi-tool-call
  - agent-thought
  - stream-tool-call
  - vision
model_properties:
  mode: chat
  context_size: 400000
parameter_rules:
  - name: max_tokens
    use_template: max_tokens
    default: 8192
    min: 1
    max: 128000
  - name: response_format
    label: "{% trans 'Response Format' %}"
    type: string
    help: "{% trans 'specifying the format that the model must output' %}"
    required: false
    options:
      - text
      - json_schema
  - name: json_schema
    use_template: json_schema
  - name: reasoning_effort
    label: "{% trans 'Reasoning Effort' %}"
    type: string
    help: "{% trans 'Constrains effort on reasoning for reasoning models. Currently supported values are minimal, low, medium, and high. Reducing reasoning effort can result in faster responses and fewer tokens used on reasoning in a response' %}"
    required: false
    default: medium
    options:
      - minimal
      - low
      - medium
      - high
  - name: verbosity
    label: "{% trans 'Verbosity' %}"
    type: string
    help: "{% trans 'Constrains the verbosity of the model\'s response. Lower values will result in more concise responses, while higher values will result in more verbose responses. Currently supported values are low, medium, and high' %}"
    required: false
    default: medium
    options:
      - low
      - medium
      - high
  - name: enable_stream
    label: "{% trans 'Streaming' %}"
    type: boolean
    help: "{% trans 'GPT-5 series models require KYC validation for streaming output, if you want to use the models without this limitation, please turn off streaming responses.' %}"
    required: true
    default: true
