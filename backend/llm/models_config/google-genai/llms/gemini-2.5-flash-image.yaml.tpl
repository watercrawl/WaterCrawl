model: gemini-2.5-flash-image
label: "{% trans 'Nano Banana' %}"
model_type: llm
features:
  - vision
  - document
model_properties:
  mode: chat
  context_size: 32768
parameter_rules:
  - name: temperature
    type: float
    label: "{% trans 'Temperature' %}"
    help: "{% trans 'Creativity allowed in the response' %}"
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
  - name: max_output_tokens
    type: float
    label: "{% trans 'Output length' %}"
    help: "{% trans 'Maximum number of tokens in response' %}"
    required: true
    default: 32768
    min: 1
    max: 32768
