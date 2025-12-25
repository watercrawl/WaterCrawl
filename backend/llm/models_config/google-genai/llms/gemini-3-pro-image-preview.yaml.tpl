model: gemini-3-pro-image-preview
label: "{% trans 'Nano Banana Pro' %}"
model_type: llm
features:
  - vision
  - document
model_properties:
  mode: chat
  context_size: 65536
parameter_rules:
  - name: temperature
    type: float
    label: "{% trans 'Temperature' %}"
    help: "{% trans 'For Gemini 3, best results at default 1.0. Lower values may impact reasoning.' %}"
    required: true
    default: 1
    min: 0
    max: 1
  - name: aspect_ratio
    type: string
    label: "{% trans 'Aspect ratio' %}"
    help: "{% trans 'Aspect ratio of the generated images.' %}"
    required: true
    default: Auto
    options:
      - Auto
      - 1:1
      - 9:16
      - 16:9
      - 3:4
      - 4:3
      - 3:2
      - 2:3
      - 5:4
      - 4:5
      - 21:9
  - name: resolution
    type: string
    label: "{% trans 'Resolution' %}"
    help: "{% trans 'Resolution of the generated images. Defaults to 1K.' %}"
    required: true
    default: 1K
    options:
      - 1K
      - 2K
      - 4K
  - name: include_thoughts
    type: boolean
    label: "{% trans 'Include thoughts' %}"
    help: "{% trans 'Indicates whether to include thoughts in the response. If true, thoughts are returned only if the model supports thought and thoughts are available. Default is false.' %}"
    required: true
    default: true
  - name: grounding
    type: boolean
    label: "{% trans 'Grounding' %}"
    help: "{% trans 'Use Google Search' %}"
    required: true
    default: false
  - name: max_output_tokens
    type: float
    label: "{% trans 'Output length' %}"
    help: "{% trans 'Maximum number of tokens in response' %}"
    required: true
    default: 32768
    min: 1
    max: 32768
