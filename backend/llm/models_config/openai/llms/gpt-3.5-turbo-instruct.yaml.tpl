model: gpt-3.5-turbo-instruct
label: "{% trans 'gpt-3.5-turbo-instruct' %}"
model_type: llm
features: [ ]
model_properties:
  mode: completion
  context_size: 4096
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
  - name: response_format
    use_template: response_format
