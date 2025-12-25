model: c4ai-aya-expanse-32b
label: "{% trans 'c4ai-aya-expanse-32b' %}"
model_type: llm
features:
  - stream-tool-call
model_properties:
  mode: chat
  context_size: 128000
parameter_rules:
  - name: temperature
    use_template: temperature
    default: 0.3
    max: 1.0
  - name: p
    use_template: top_p
    default: 0.75
    min: 0.01
    max: 0.99
  - name: k
    label: "{% trans 'Top k' %}"
    type: int
    help: "{% trans 'Only sample from the top K options for each subsequent token.' %}"
    required: false
    default: 0
    min: 0
    max: 500
  - name: presence_penalty
    use_template: presence_penalty
  - name: frequency_penalty
    use_template: frequency_penalty
  - name: max_tokens
    use_template: max_tokens
    default: 4096
    max: 4096
