model: gemini-2.0-flash-thinking-exp-01-21
label: "{% trans 'Gemini 2.0 Flash Thinking Experimental 01-21' %}"
model_type: llm
features:
  - agent-thought
  - vision
  - document
  - video
  - audio
model_properties:
  mode: chat
  context_size: 1048576
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
    default: 65536
    min: 1
    max: 65536
  - name: json_schema
    use_template: json_schema
