model: gpt-4-0125-preview
label: "{% trans 'gpt-4-0125-preview' %}"
model_type: llm
features:
  - multi-tool-call
  - agent-thought
  - stream-tool-call
model_properties:
  mode: chat
  context_size: 128000
parameter_rules:
  - name: temperature
    use_template: temperature
  - name: top_p
    use_template: top_p
  - name: presence_penalty
    use_template: presence_penalty
  - name: frequency_penalty
    use_template: frequency_penalty
  - name: max_tokens
    use_template: max_tokens
    default: 512
    min: 1
    max: 4096
  - name: seed
    label: "{% trans 'Seed' %}"
    type: int
    help: "{% trans 'If specified, model will make a best effort to sample deterministically, such that repeated requests with the same seed and parameters should return the same result. Determinism is not guaranteed, and you should refer to the system_fingerprint response parameter to monitor changes in the backend.' %}"
    required: false
  - name: response_format
    label: "{% trans 'Response Format' %}"
    type: string
    help: "{% trans 'specifying the format that the model must output' %}"
    required: false
    options:
      - text
      - json_object
