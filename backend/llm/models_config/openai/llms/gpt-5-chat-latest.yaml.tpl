model: gpt-5-chat-latest
label: "{% trans 'gpt-5-chat-latest' %}"
model_type: llm
features:
  - agent-thought
  - vision
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
    default: 8192
    min: 1
    max: 16384
