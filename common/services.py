import json
from typing import Generator

from django.http import StreamingHttpResponse


class EventStreamResponse(StreamingHttpResponse):
    def __init__(self, generator: Generator):
        self.generator = generator
        super().__init__(self.callback(), content_type='text/event-stream')
        self['Cache-Control'] = 'no-cache'
        self['X-Accel-Buffering'] = 'no'

    def callback(self):
        for event in self.generator:
            data = json.dumps(event)
            yield f'data: {data}\n\n'
