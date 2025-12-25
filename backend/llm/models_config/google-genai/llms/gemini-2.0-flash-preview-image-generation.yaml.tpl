model: gemini-2.0-flash-preview-image-generation
label: "{% trans 'Gemini 2.0 Flash Preview Image Generation' %}"
model_type: llm
features:
  - vision
  - document
  - video
  - audio
model_properties:
  mode: chat
  context_size: 32000
parameter_rules:
  - name: temperature
    use_template: temperature
    default: 1
    min: 0
    max: 2
  - name: top_p
    use_template: top_p
  - name: top_k
    type: integer
    label: "{% trans 'Top k' %}"
    help: "{% trans 'Only sample from the top K options for each subsequent token.' %}"
    required: false
  - name: max_tokens
    use_template: max_tokens
    default: 8192
    min: 1
    max: 8192
  - name: json_schema
    use_template: json_schema
