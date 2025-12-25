model: gemini-pro-vision
label: "{% trans 'Gemini Pro Vision' %}"
model_type: llm
features:
  - vision
model_properties:
  mode: chat
  context_size: 12288
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
    required: true
    default: 4096
    min: 1
    max: 4096
