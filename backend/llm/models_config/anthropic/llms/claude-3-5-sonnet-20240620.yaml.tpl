model: claude-3-5-sonnet-20240620
label: "{% trans 'Claude 3.5 Sonnet (June 2024)' %}"
model_type: llm
features:
  - agent-thought
  - vision
  - tool-call
  - stream-tool-call
  - document
model_properties:
  mode: chat
  context_size: 200000
parameter_rules:
  - name: temperature
    use_template: temperature
  - name: top_p
    use_template: top_p
  - name: top_k
    use_template: top_k
  - name: max_tokens
    use_template: max_tokens
    required: true
    default: 8192
    min: 1
    max: 8192
  - name: response_format
    use_template: response_format
