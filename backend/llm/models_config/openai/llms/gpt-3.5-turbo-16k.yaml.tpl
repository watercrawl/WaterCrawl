model: gpt-3.5-turbo-16k
label: "{% trans 'gpt-3.5-turbo-16k' %}"
model_type: llm
features:
  - multi-tool-call
  - agent-thought
  - stream-tool-call
model_properties:
  mode: chat
  context_size: 16385
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
    max: 16385
  - name: response_format
    use_template: response_format
