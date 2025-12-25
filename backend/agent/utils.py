import asyncio

from pydantic import BaseModel


def serialize_event_data(value):
    if isinstance(value, BaseModel):
        return serialize_event_data(value.model_dump())

    if isinstance(value, dict):
        return {key: serialize_event_data(val) for key, val in value.items()}

    if isinstance(value, (list, tuple, set)):
        return [serialize_event_data(item) for item in value]

    return value


def async_generator_to_sync(func, *args, **kwargs):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    async def runner():
        async for event in func(*args, **kwargs):
            yield event

    async_gen = runner()

    try:
        while True:
            event = loop.run_until_complete(async_gen.__anext__())
            yield event
    except StopAsyncIteration:
        pass
