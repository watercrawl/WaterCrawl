model: gemini-3-pro-preview
label: "{% trans 'Gemini 3 Pro Preview' %}"
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
    type: float
    label: "{% trans 'Temperature' %}"
    help: "{% trans 'For Gemini 3, best results at default 1.0. Lower values may impact reasoning.' %}"
    required: true
    default: 1
    min: 0
    max: 2
  - name: include_thoughts
    type: boolean
    label: "{% trans 'Include thoughts' %}"
    help: "{% trans 'Indicates whether to include thoughts in the response. If true, thoughts are returned only if the model supports thought and thoughts are available. Default is false.' %}"
    required: true
    default: false
  - name: media_resolution
    type: string
    label: "{% trans 'Media resolution' %}"
    help: "{% trans 'Gemini 3 introduces fine-grained control over multimodal visual processing via the `media_resolution` parameter. Higher resolution improves the models ability to read small text or recognize fine details, but increases token usage and latency.

Recommended Settings:
- Images: `media_resolution_high` (1120 tokens) - Recommended for most image analysis tasks to ensure best quality.
- PDF: `media_resolution_medium` (560 tokens) - Great for document understanding; quality usually saturates at medium.
- Video (Regular): `media_resolution_low` or `medium` (70 tokens/frame) - Sufficient for most action recognition and description tasks.
- Video (Text-heavy): `media_resolution_high` (280 tokens/frame) - Needed only when use cases involve reading dense text (OCR) or tiny details in video frames.

Note: If not specified, the model uses the best default value based on the media type.
' %}"
    required: true
    default: Default
    options:
      - Default
      - Low
      - Medium
      - High
  - name: thinking_level
    type: string
    label: "{% trans 'Thinking level' %}"
    help: "{% trans 'Indicates the thinking level. Default is High.' %}"
    required: true
    default: High
    options:
      - Low
      - High
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
  - name: max_output_tokens
    type: float
    label: "{% trans 'Output length' %}"
    help: "{% trans 'The maximum number of tokens to generate in the response.' %}"
    required: true
    default: 65536
    min: 1
    max: 65536
