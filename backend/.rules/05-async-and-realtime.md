# Async Tasks and Real-Time Updates

## Celery Task Pattern

### Task Definition

```python
# tasks.py
from celery import shared_task
from django.utils.translation import gettext as _

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def process_resource_task(self, resource_pk: str):
    """Process resource asynchronously."""
    try:
        service = MyResourceService.make_with_pk(resource_pk)
        service.process()
    except Exception as exc:
        # Retry with exponential backoff
        raise self.retry(exc=exc)
```

### Dispatching Tasks from Views

```python
def perform_create(self, serializer):
    instance = serializer.save(team=self.request.current_team)
    
    # Dispatch with UUID as task_id for tracking
    from .tasks import process_resource_task
    process_resource_task.apply_async(
        kwargs={"resource_pk": str(instance.pk)},
        task_id=str(instance.uuid),  # ✅ Track by UUID
    )
```

### Checking Task Status

```python
from celery.result import AsyncResult

def is_task_running(task_id: str) -> bool:
    result = AsyncResult(task_id)
    return result.state in ("PENDING", "STARTED")
```

## Redis Pub/Sub Pattern

### PubSub Service Base Class

```python
from django_redis import get_redis_connection
import json
from time import time
from django.utils import timezone

class BasePubSupService:
    def send_status(self, event_type, payload=None):
        """Publish event to Redis channel."""
        self.connection.publish(
            self.redis_channel,
            json.dumps({
                "event_type": event_type,
                "payload": payload
            })
        )
    
    def send_feed(self, message, feed_type="info", metadata=None):
        """Send feed message for real-time logs."""
        self.connection.publish(
            self.redis_channel,
            json.dumps({
                "event_type": "feed",
                "payload": {
                    "id": f"{time()}",
                    "type": feed_type,
                    "message": message,
                    "timestamp": timezone.now().isoformat(),
                    "metadata": metadata or {},
                }
            })
        )
```

### Resource-Specific PubSub Service

```python
class MyResourcePubSubService(BasePubSupService):
    def __init__(self, resource):
        self.resource = resource
        self.redis_channel = f"myresource:{resource.uuid}"
        self.connection = get_redis_connection("default")
    
    def check_status(self, prefetched=False):
        """Generator for SSE streaming."""
        pubsub = self.connection.pubsub()
        pubsub.subscribe(self.redis_channel)
        
        # Send initial state
        yield {
            "type": "state",
            "data": MyResourceSerializer(self.resource).data
        }
        
        last_state_time = time()
        
        # Stream updates while task runs
        while AsyncResult(str(self.resource.uuid)).state in ("PENDING", "STARTED"):
            message = pubsub.get_message(timeout=0.1)
            
            if message and message["type"] == "message":
                data = json.loads(message["data"].decode("utf-8"))
                
                if data["event_type"] == "state":
                    self.resource.refresh_from_db()
                    yield {
                        "type": "state",
                        "data": MyResourceSerializer(self.resource).data
                    }
                    last_state_time = time()
                
                elif data["event_type"] == "result":
                    yield {
                        "type": "result",
                        "data": data["payload"]
                    }
            
            # Send periodic state updates
            if time() - last_state_time >= 5:
                self.resource.refresh_from_db()
                yield {
                    "type": "state",
                    "data": MyResourceSerializer(self.resource).data
                }
                last_state_time = time()
        
        # Final state
        self.resource.refresh_from_db()
        yield {
            "type": "state",
            "data": MyResourceSerializer(self.resource).data
        }
        
        pubsub.unsubscribe(self.redis_channel)
        pubsub.close()
```

### Using in Tasks

```python
@shared_task
def process_resource_task(resource_pk: str):
    service = MyResourceService.make_with_pk(resource_pk)
    pubsub = MyResourcePubSubService(service.resource)
    
    # Send status updates
    pubsub.send_status("state")
    pubsub.send_feed("Processing started", "info")
    
    try:
        service.process()
        pubsub.send_feed("Processing complete", "success")
    except Exception as e:
        pubsub.send_feed(f"Error: {str(e)}", "error")
        raise
    finally:
        pubsub.send_status("state")
```

## SSE Response in Views

```python
from common.services import EventStreamResponse

@action(detail=True, methods=["get"], url_path="status")
def check_status(self, request, **kwargs):
    """Stream real-time updates via Server-Sent Events."""
    obj = self.get_object()
    service = MyResourcePubSubService(obj)
    
    return EventStreamResponse(
        service.check_status(prefetched=False)
    )
```

## Channel Naming Convention

```
{resource_type}:{resource_uuid}

Examples:
- crawl:a1b2c3d4-e5f6-7890-abcd-ef1234567890
- search:b2c3d4e5-f6a7-8901-bcde-f12345678901
- sitemap:c3d4e5f6-a7b8-9012-cdef-123456789012
```

## Critical Rules

- ✅ Use UUID as task_id for tracking
- ✅ Publish events at key lifecycle points
- ✅ Use descriptive event_type names
- ✅ Include timestamps in payloads
- ✅ Handle disconnections gracefully
- ✅ Send periodic heartbeats (every 5s)
- ✅ Clean up subscriptions in finally block
- ✅ Refresh model from DB before yielding state
