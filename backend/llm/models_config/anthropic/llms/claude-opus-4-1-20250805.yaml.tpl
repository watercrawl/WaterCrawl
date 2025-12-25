model: claude-opus-4-1-20250805
label: "{% trans 'Claude Opus 4.1' %}"
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
    default: 32000
    min: 1
    max: 32000
  - name: response_format
    use_template: response_format
