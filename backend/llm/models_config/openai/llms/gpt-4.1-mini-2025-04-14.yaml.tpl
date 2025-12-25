model: gpt-4.1-mini-2025-04-14
label: "{% trans 'gpt-4.1-mini-2025-04-14' %}"
model_type: llm
features:
  - multi-tool-call
  - agent-thought
  - stream-tool-call
  - vision
model_properties:
  mode: chat
  context_size: 1047576
parameter_rules:
  - name: temperature
    use_template: temperature
  - name: top_p
    use_template: top_p
  - name: presence_penalty
    use_template: presence_penalty
  - name: frequency_penalty
    use_template: frequency_penalty
  - name: max_tokens
    use_template: max_tokens
    default: 512
    min: 1
    max: 32768
  - name: response_format
    label: "{% trans 'Response Format' %}"
    type: string
    help: "{% trans 'specifying the format that the model must output' %}"
    required: false
    options:
      - text
      - json_object
      - json_schema
  - name: json_schema
    use_template: json_schema
