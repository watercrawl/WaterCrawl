model: gemini-pro
label: "{% trans 'Gemini Pro' %}"
model_type: llm
features:
  - agent-thought
  - tool-call
  - stream-tool-call
model_properties:
  mode: chat
  context_size: 30720
parameter_rules:
  - name: temperature
    use_template: temperature
  - name: top_p
    use_template: top_p
  - name: top_k
    type: integer
    label: "{% trans 'Top k' %}"
    help: "{% trans 'Only sample from the top K options for each subsequent token.' %}"
    required: false
  - name: max_tokens
    use_template: max_tokens
    default: 2048
    min: 1
    max: 2048
  - name: response_format
    use_template: response_format
