model: gemini-2.5-flash-preview-05-20
label: "{% trans 'Gemini 2.5 Flash Preview 05-20' %}"
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
    default: 65536
    min: 1
    max: 65536
  - name: include_thoughts
    type: boolean
    label: "{% trans 'Include Thoughts' %}"
    help: "{% trans 'Indicates whether to include thoughts in the response. If true, thoughts are returned only if the model supports thought and thoughts are available.' %}"
    required: false
    default: false
  - name: thinking_mode
    type: boolean
    label: "{% trans 'Thinking Mode' %}"
    help: "{% trans 'Whether to enable thinking mode. If true and thinking_budget is not set, turn on dynamic thinking.' %}"
    required: true
    default: true
  - name: thinking_budget
    type: integer
    label: "{% trans 'Thinking Budget' %}"
    help: "{% trans 'Indicates the thinking budget in tokens. This value is valid only when thinking mode is enabled. The default values and allowed ranges are model dependent. When enabling the thinking mode, if the thinking budget is not set, the default is to enable dynamic budget reasoning.' %}"
    required: false
    default: 8192
    min: 128
    max: 24576
  - name: grounding
    type: boolean
    label: "{% trans 'Grounding' %}"
    help: "{% trans 'Grounding with Google Search' %}"
    required: true
    default: false
  - name: json_schema
    use_template: json_schema
