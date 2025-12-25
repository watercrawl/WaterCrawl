model: gemini-2.0-flash
label: "{% trans 'Gemini 2.0 Flash' %}"
model_type: llm
features:
  - tool-call
  - multi-tool-call
  - agent-thought
  - vision
  - stream-tool-call
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
    default: 8192
    min: 1
    max: 8192
  - name: grounding
    type: boolean
    label: "{% trans 'Grounding' %}"
    help: "{% trans 'Grounding with Google Search' %}"
    required: true
    default: false
  - name: url_context
    type: boolean
    label: "{% trans 'URL context' %}"
    help: "{% trans 'Browse the url context' %}"
    required: true
    default: false
  - name: code_execution
    type: boolean
    label: "{% trans 'Code execution' %}"
    help: "{% trans 'Lets Gemini use code to solve complex tasks' %}"
    required: true
    default: false
  - name: json_schema
    use_template: json_schema
