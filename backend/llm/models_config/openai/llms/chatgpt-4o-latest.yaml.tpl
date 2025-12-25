model: chatgpt-4o-latest
label: "{% trans 'ChatGPT-4o-Latest' %}"
model_type: llm
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
    max: 16384
  - name: response_format
    label: "{% trans 'Response Format' %}"
    type: string
    help: "{ trans 'specifying the format that the model must output' %}"
    required: false
    options:
      - text
      - json_object
