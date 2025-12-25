model: o1-mini-2024-09-12
label: "{% trans 'o1-mini-2024-09-12' %}"
model_type: llm
features:
  - agent-thought
model_properties:
  mode: chat
  context_size: 128000
parameter_rules:
  - name: max_tokens
    use_template: max_tokens
    default: 65536
    min: 1
    max: 65536
  - name: response_format
    label: "{% trans 'response_format' %}"
    type: string
    help: "{% trans 'specifying the format that the model must output' %}"
    required: false
    options:
      - text
      - json_object
deprecated: true
