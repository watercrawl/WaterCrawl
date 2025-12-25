model: claude-haiku-4-5-20251001
label: "{% trans 'Claude 4.5 Haiku' %}"
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
    default: 64000
    min: 1
    max: 64000
  - name: response_format
    use_template: response_format
