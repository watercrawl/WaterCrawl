model: o3-pro
label: "{% trans 'o3-pro' %}"
model_type: llm
features:
  - agent-thought
  - tool-call
  - vision
model_properties:
  mode: chat
  context_size: 200000
parameter_rules:
  - name: max_tokens
    use_template: max_tokens
    default: 100000
    min: 1
    max: 100000
  - name: reasoning_effort
    label: "{% trans 'reasoning_effort' %}"
    type: string
    help: "{% trans 'constrains effort on reasoning for reasoning models' %}"
    required: false
    options:
      - low
      - medium
      - high
  - name: response_format
    label: "{% trans 'response_format' %}"
    type: string
    help: "{% trans 'specifying the format that the model must output' %}"
    required: false
    options:
      - text
      - json_object
      - json_schema
  - name: json_schema
    use_template: json_schema
