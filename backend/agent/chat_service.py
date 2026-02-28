import base64
import logging
import time
import traceback
from typing import Generator, List, Dict, Any, Optional, AsyncIterator, Union, Set

from langchain_core.messages import (
    SystemMessage,
    AIMessage,
    HumanMessage,
    BaseMessage,
    ToolMessage,
    FunctionMessage,
    AIMessageChunk,
)
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable, RunnableConfig
from langgraph.types import Command

from agent import consts
from agent.models import Conversation, Message, Agent, AgentVersion, MessageBlock
from agent.factories import AgentFactory
from agent.utils import async_generator_to_sync, serialize_event_data
from llm.factories import ChatModelFactory
from user.models import Media

logger = logging.getLogger(__name__)


class BlockMessageHandler:
    def __init__(self, block: MessageBlock):
        self.block = block
        self.tool_call_id_map = {}

    @classmethod
    def create(
        cls,
        role: str,
        conversation: Conversation,
        messages: List[BaseMessage] = None,
        structured_response: Optional[Dict[str, Any]] = None,
    ) -> "BlockMessageHandler":
        block = MessageBlock(
            role=role,
            conversation=conversation,
            structured_response=structured_response,
        )
        block.save()
        messages = messages or []
        handler = cls(block)
        for message in messages:
            handler._add_message(message)
        return handler

    def _add_message(self, message: BaseMessage) -> Message:
        kwargs = {
            "name": message.name,
            "content": message.content,
            "message_type": message.type,
            "additional_kwargs": message.additional_kwargs,
            "response_metadata": message.response_metadata,
            "tool_calls": serialize_event_data(message.tool_calls)
            if hasattr(message, "tool_calls")
            else [],
            "tool_call_id": message.tool_call_id
            if hasattr(message, "tool_call_id")
            else None,
        }

        return self.block.messages.create(
            conversation=self.block.conversation, **kwargs
        )


class ChatMessageHistory:
    def __init__(self, conversation: Conversation):
        self.conversation = conversation
        self._messages_ids = []

    @property
    def messages(self) -> List[BaseMessage]:
        messages = Message.objects.filter(conversation=self.conversation).order_by(
            "created_at"
        )

        result = []
        for message in messages:
            self._messages_ids.append(str(message.uuid))
            kwargs = {
                "id": str(message.uuid),
                "name": message.name,
                "content": message.content,
                "additional_kwargs": message.additional_kwargs,
                "response_metadata": message.response_metadata,
            }
            class_type = None
            match message.message_type:
                case "system":
                    class_type = SystemMessage
                case "human":
                    class_type = HumanMessage
                case "tool":
                    class_type = ToolMessage
                    kwargs["tool_call_id"] = message.tool_call_id
                case "ai":
                    class_type = AIMessage
                    kwargs["tool_calls"] = message.tool_calls
                case "function":
                    class_type = FunctionMessage

            if class_type:
                result.append(class_type(**kwargs))
            else:
                logger.warning(f"Unknown message type: {message.message_type}")

        return result

    @property
    def messages_ids(self) -> List[str]:
        return self._messages_ids


class FrontendEventStream:
    """Unified processor for astream_events to frontend consumption."""

    def __init__(
        self,
        chain,
        include_types: Optional[list[str]] = None,
        event_types: Optional[Set[str]] = None,
    ):
        self.chain: Runnable = chain
        self.include_types = include_types or ["chat_model", "tool", "chain"]
        self.agent_state = None
        self.event_types = (
            event_types  # None means all events, empty set means all events
        )
        self.last_event_time = time.time()

    @property
    def messages(self) -> List[BaseMessage]:
        if not self.agent_state:
            return []
        return self.agent_state["messages"]

    @property
    def structured_response(self) -> Optional[Dict[str, Any]]:
        if not self.agent_state:
            return None
        return self.agent_state.get("structured_response")

    def should_send_event(self, event: dict) -> bool:
        """Check if event should be sent based on event_types filter.

        Always send: ping, conversation, done, error
        If event_types is None or empty set, send all events.
        Otherwise, only send events in the filter.
        """
        event_name = event.get("event")

        # Always send these critical events
        if event_name in consts.CRITICAL_EVENT_TYPES:
            return True

        # If no filter or empty filter, send all events
        if self.event_types is None or len(self.event_types) == 0:
            return True

        # Otherwise check if event is in filter
        return event_name in self.event_types

    async def stream_to_frontend(
        self, input_data: Dict[str, Any]
    ) -> AsyncIterator[Dict[str, Any]]:
        """Main streaming method that handles all event types with keepalive pings."""

        runnable_config = RunnableConfig(recursion_limit=100)

        async for event in self.chain.astream_events(
            input_data,
            version="v2",
            include_types=self.include_types,
            config=runnable_config,
            exclude_tags=["sub_agent"],
        ):
            # Check if we need to send a keepalive ping
            current_time = time.time()
            if current_time - self.last_event_time >= 10:
                yield {
                    "event": consts.EVENT_TYPE_PING,
                    "data": {"timestamp": int(current_time)},
                }
                self.last_event_time = current_time

            processed = await self._process_event(event)
            if processed and self.should_send_event(processed):
                yield processed
                self.last_event_time = current_time

        if self.structured_response:
            structured_event = self.make_event(
                consts.EVENT_TYPE_STRUCTURED_RESPONSE,
                self.structured_response,
            )
            if self.should_send_event(structured_event):
                yield structured_event

    async def _process_event(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Process individual events based on type."""
        event_type = event["event"]

        # Route to appropriate handler
        if event_type.startswith("on_tool_"):
            return await self._handle_tool_event(event)
        elif event_type.startswith("on_chat_model_"):
            return self._handle_chat_model_event(event)
        elif event_type.startswith("on_chain_"):
            return self._handle_chain_event(event)

        return None

    async def _handle_tool_event(
        self, event: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Handle tool events including Command objects from middleware."""
        event_type = event["event"]
        event_name = event["name"]

        if event_type == "on_tool_start":
            return self.make_event(
                consts.EVENT_TYPE_TOOL_CALL_START,
                {
                    "run_id": event["run_id"],
                    "name": event_name,
                    "input": event["data"]["input"],
                    "parent_ids": event["parent_ids"],
                    "status": "start",
                },
            )

        elif event_type == "on_tool_end":
            # Handle Command objects from middleware like TodoListMiddleware
            output = event["data"]["output"]
            processed_output = await self._extract_command_output(output, event_name)

            return self.make_event(
                consts.EVENT_TYPE_TOOL_CALL_END,
                {
                    "run_id": event["run_id"],
                    "name": event_name,
                    "output": processed_output,
                    "parent_ids": event["parent_ids"],
                    "status": "end",
                },
            )

        elif event_type == "on_tool_error":
            return self.make_event(
                consts.EVENT_TYPE_TOOL_CALL_END,
                {
                    "run_id": event["run_id"],
                    "name": event_name,
                    "error": str(event["data"]["error"]),
                    "parent_ids": event["parent_ids"],
                    "status": "error",
                },
            )
        return None

    async def _extract_command_output(self, output: Any, tool_name: str) -> Any:
        """Extract JSON-serializable data from Command objects."""
        if isinstance(output, Command) and hasattr(output, "update"):
            # Handle TodoListMiddleware and similar middleware
            if tool_name == "write_todos" and "todos" in output.update:
                return {
                    "todos": output.update["todos"],
                }
            return output.update

        return output

    def get_text_from_ai_message(self, chunk: AIMessageChunk):
        text = chunk.text
        if text:
            return text
        return ""

    def _handle_chat_model_event(
        self, event: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Handle chat model streaming events."""
        if event["event"] == "on_chat_model_stream":
            return self.make_event(
                consts.EVENT_TYPE_CONTENT,
                {
                    "source": event["name"],
                    "text": self.get_text_from_ai_message(event["data"]["chunk"]),
                    "run_id": event["run_id"],
                },
            )
        elif event["event"] == "on_chat_model_start":
            return self.make_event(
                consts.EVENT_TYPE_CHAT_MODEL_START,
                {
                    "run_id": event["run_id"],
                },
            )
        elif event["event"] == "on_chat_model_end":
            return self.make_event(
                consts.EVENT_TYPE_CHAT_MODEL_END,
                {
                    "run_id": event["run_id"],
                },
            )
        return None

    def _handle_chain_event(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Handle chain events."""
        # if event["event"] == "on_chain_stream":
        #     if hasattr(event["data"]["chunk"], "text"):
        #
        #         return self.make_event(
        #             "content",
        #             {
        #                 "source": event["name"],
        #                 "text": event["data"]["chunk"].text,
        #                 'run_id': event['run_id'],
        #                 'parent_ids': event['parent_ids'],
        #             }
        #         )
        #     else:
        #         print("on_chain_stream",event["data"]["chunk"])

        if event["event"] == "on_chain_end" and event["name"] in ["LangGraph", "agent"]:
            self.agent_state = event["data"]["output"]
        return None

    def make_event(self, event_type: str, data: dict = None):
        return {
            "event": event_type,
            "data": serialize_event_data(data or {}),
            "timestamp": time.time(),
        }


class ConversationService:
    """Service for managing a conversation."""

    def __init__(self, conversation: Conversation):
        self.conversation = conversation

    @classmethod
    def get_or_create_conversation(
        cls,
        team,
        agent: Agent,
        agent_version: AgentVersion,
        user_identifier: str,
        conversation_id: str = None,
        inputs: dict = None,
    ) -> "ConversationService":
        """Get existing conversation or create new one."""
        if conversation_id:
            try:
                conversation = Conversation.objects.get(
                    uuid=conversation_id, team=team, agent=agent
                )
                # Update inputs if provided
                if inputs:
                    conversation.inputs = inputs
                    conversation.save(update_fields=["inputs", "updated_at"])
                return cls(conversation)
            except Conversation.DoesNotExist:
                pass  # Will create new conversation below

        # Create new conversation
        conversation = Conversation.objects.create(
            team=team,
            agent=agent,
            agent_version=agent_version,
            user_identifier=user_identifier,
            inputs=inputs or {},
        )
        return cls(conversation)

    def build_current_state(self, query: str, files: Optional[List[Media]] = None):
        # Build message content with files if provided
        message_content = self._build_message_content(query, files)

        # Add the user message
        BlockMessageHandler.create(
            role="user",
            conversation=self.conversation,
            messages=[HumanMessage(content=message_content)],
        )

        history = ChatMessageHistory(self.conversation)
        return history.messages, history.messages_ids

    def _build_message_content(
        self, query: str, files: Optional[List[Media]] = None
    ) -> Union[str, List[Dict[str, Any]]]:
        """
        Build message content with optional file attachments.

        If no files are provided, returns the query string directly.
        If files are provided, returns a list of content blocks following
        LangChain's multimodal content format.

        Args:
            query: The text query from the user
            files: Optional list of Media objects to attach

        Returns:
            Either a string (text only) or list of content blocks (multimodal)
        """
        if not files:
            return query

        content_blocks = []

        # Add text content first
        content_blocks.append({"type": "text", "text": query})

        # Add file content blocks
        for media_file in files:
            content_block = self._create_file_content_block(media_file)
            if content_block:
                content_blocks.append(content_block)

        return content_blocks

    def _create_file_content_block(self, media_file: Media) -> Optional[Dict[str, Any]]:
        """
        Create a LangChain content block from a Media file.

        Supports:
        - Images: Creates image content block with base64 data
        - PDFs/Documents: Creates file content block with base64 data
        - Audio: Creates audio content block with base64 data

        Args:
            media_file: The Media object containing the file

        Returns:
            A content block dictionary or None if unsupported
        """
        mime_type = media_file.content_type

        try:
            # Read file content and encode as base64
            file_content = media_file.file.read()
            base64_data = base64.b64encode(file_content).decode("utf-8")

            # Determine content block type based on MIME type
            if mime_type in consts.IMAGE_MIME_TYPES:
                return {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": mime_type,
                        "data": base64_data,
                    },
                }
            elif mime_type in consts.FILE_MIME_TYPES:
                return {
                    "type": "file",
                    "source": {
                        "type": "base64",
                        "media_type": mime_type,
                        "data": base64_data,
                    },
                }
            elif mime_type in consts.AUDIO_MIME_TYPES:
                return {
                    "type": "audio",
                    "source": {
                        "type": "base64",
                        "media_type": mime_type,
                        "data": base64_data,
                    },
                }
            else:
                # Unsupported file type - try as generic file
                logger.warning(
                    f"Unsupported MIME type: {mime_type}, treating as generic file"
                )
                return {
                    "type": "file",
                    "source": {
                        "type": "base64",
                        "media_type": mime_type,
                        "data": base64_data,
                    },
                }
        except Exception as e:
            logger.error(f"Error reading file {media_file.file_name}: {str(e)}")
            return None

    def create_agent_executor(
        self, output_schema: Optional[Dict[str, Any]] = None, sub_agent=False
    ):
        # Create context for media library integration
        context = {
            "team": self.conversation.team,
            "agent": self.conversation.agent,
            "agent_version": self.conversation.agent_version,
            "conversation": self.conversation,
        }

        # Create the agent executor with streaming enabled
        return AgentFactory.create_agent(
            agent_version=self.conversation.agent_version,
            context_variables=self.conversation.inputs,
            context=context,
            output_schema=output_schema,
            sub_agent=sub_agent,
        )

    def chat(
        self,
        query: str,
        files: Optional[List[Media]] = None,
        output_schema: Optional[Dict[str, Any]] = None,
        event_types: Optional[Set[str]] = None,
    ) -> Generator[dict, None, None]:
        """
        Process chat message and generate streaming response using AgentFactory.

        Args:
            query: The user's text input
            files: Optional list of Media files to attach to the message
            output_schema: Optional JSON Schema for structured output (used when agent has
                          json_output=True but no predefined schema)
            event_types: Optional set of event types to filter (e.g., {'content', 'tool_call_start'})
                        If None or empty set, all events are sent.
                        Note: ping, conversation, done, and error events are always sent.

        Yields dictionary events that will be formatted by EventStreamResponse.
        Sends keepalive pings every 10 seconds if no events are generated.
        """
        messages, message_ids = self.build_current_state(query, files=files)
        agent_executor = self.create_agent_executor(output_schema=output_schema)

        # Create stream with event filtering
        stream = FrontendEventStream(agent_executor, event_types=event_types)

        yield stream.make_event(
            consts.EVENT_TYPE_CONVERSATION,
            {
                "id": str(self.conversation.uuid),
            },
        )

        try:
            for event in async_generator_to_sync(
                stream.stream_to_frontend,
                {
                    "messages": messages,
                },
            ):
                yield event

            # Persist output and send completion events
            new_messages = [
                message for message in stream.messages if message.id not in message_ids
            ]
            self.persist_output(new_messages, stream.structured_response)
            self.fill_title(query)

            # Title and done events (always sent due to critical status)
            yield stream.make_event(
                consts.EVENT_TYPE_TITLE, {"title": self.conversation.title}
            )
            yield stream.make_event(consts.EVENT_TYPE_DONE, {})

        except Exception as e:
            logger.error(f"Agent execution failed: {str(e)}")
            traceback.print_exc()
            yield {"event": consts.EVENT_TYPE_ERROR, "data": {"error": str(e)}}

    def chat_sync(
        self,
        query: str,
        files: Optional[List[Media]] = None,
        output_schema: Optional[Dict[str, Any]] = None,
        sub_agent: bool = False,
    ) -> MessageBlock:
        """
        Synchronous chat method that consumes streaming events and returns final MessageBlock.
        Used for subagent calls that need blocking behavior.

        Args:
            query: The user's text input
            files: Optional list of Media files to attach to the message
            output_schema: Optional JSON Schema for structured output
            sub_agent: Whether this is a subagent call

        Returns:
            MessageBlock containing the agent's response
        """
        # Consume all streaming events
        for _ in self.chat(
            query, files=files, output_schema=output_schema, event_types=None
        ):
            pass  # Just consume events, we'll return the persisted block

        # Return the last persisted message block
        return self.conversation.blocks.order_by("-created_at").first()

    def persist_output(
        self,
        messages: List[BaseMessage],
        structured_response: Optional[Dict[str, Any]] = None,
    ) -> MessageBlock:
        return BlockMessageHandler.create(
            role="assistant",
            conversation=self.conversation,
            messages=messages,
            structured_response=structured_response,
        ).block

    def fill_title(self, query: str) -> Optional[str]:
        if self.conversation.title:
            return None

        chat_model = ChatModelFactory.create_chat_model_from_provider_config(
            provider_config=self.conversation.agent_version.provider_config,
            llm_model_key=self.conversation.agent_version.llm_model_key,
        )

        title_prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """Extract the **main subject** of the user's message or conversation.
             Return ONLY a short noun phrase (3–6 words).""",
                ),
                ("human", "{text}"),
            ]
        )

        result = (title_prompt | chat_model).invoke({"text": query})
        self.conversation.title = result.content[:50]
        self.conversation.save(update_fields=["title", "updated_at"])
        return self.conversation.title
