model: o1-preview-2024-09-12
label: "{% trans 'o1-preview-2024-09-12' %}"
model_type: llm
features:
  - agent-thought
model_properties:
  mode: chat
  context_size: 128000
parameter_rules:
  - name: max_tokens
    use_template: max_tokens
    default: 32768
    min: 1
    max: 32768
  - name: response_format
    label: "{% trans 'response_format' %}"
    type: string
    help: "{% trans 'specifying the format that the model must output' %}"
    required: false
    options:
      - text
      - json_object
deprecated: true
