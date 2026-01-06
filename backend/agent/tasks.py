from celery import shared_task
import logging

from celery.signals import worker_ready

from agent import consts
from agent.executors import MCPHelper
from agent.models import Tool
from agent.services import MCPServerService
from agent.tools.base import BuiltinToolRegistry

logger = logging.getLogger(__name__)


@worker_ready.connect
def update_builtin_tools(sender, **kwargs):
    for key, tool_class in BuiltinToolRegistry.read_all().items():
        Tool.objects.update_or_create(
            key=key,
            tool_type=consts.TOOL_TYPE_BUILT_IN,
            defaults={
                "name": tool_class.get_name(),
                "description": tool_class.get_description(),
                "input_schema": tool_class.get_input_schema(),
                "output_schema": tool_class.get_output_schema(),
            },
        )


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def validate_mcp_server_task(self, mcp_server_pk: str):
    service = MCPServerService.make_with_pk(mcp_server_pk)
    MCPHelper(service.mcp_server).validate_and_save_tools()
