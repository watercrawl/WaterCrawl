import base64
import logging
import time
import traceback
from typing import Generator, List, Dict, Any, Optional, AsyncIterator, Union

from django.core.exceptions import ValidationError
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
        cls, role: str, conversation: Conversation, messages: List[BaseMessage] = None
    ) -> "BlockMessageHandler":
        block = MessageBlock(role=role, conversation=conversation)
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

    def __init__(self, chain, include_types: Optional[list[str]] = None):
        self.chain: Runnable = chain
        self.include_types = include_types or ["chat_model", "tool", "chain"]
        self.agent_state = None

    @property
    def messages(self) -> List[BaseMessage]:
        if not self.agent_state:
            return []
        return self.agent_state["messages"]

    async def stream_to_frontend(
        self, input_data: Dict[str, Any]
    ) -> AsyncIterator[Dict[str, Any]]:
        """Main streaming method that handles all event types."""

        runnable_config = RunnableConfig(recursion_limit=100)

        async for event in self.chain.astream_events(
            input_data,
            version="v2",
            include_types=self.include_types,
            config=runnable_config,
            exclude_tags=["sub_agent"],
        ):
            processed = await self._process_event(event)
            if processed:
                yield processed

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
                "tool_call_start",
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
                "tool_call_end",
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
                "tool_call_end",
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
                "content",
                {
                    "source": event["name"],
                    "text": self.get_text_from_ai_message(event["data"]["chunk"]),
                    "run_id": event["run_id"],
                },
            )
        elif event["event"] == "on_chat_model_start":
            return self.make_event(
                "chat_model_start",
                {
                    "run_id": event["run_id"],
                },
            )
        elif event["event"] == "on_chat_model_end":
            return self.make_event(
                "chat_model_end",
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

    def chat(
        self, query: str, files: Optional[List[Media]] = None
    ) -> Generator[dict, None, None]:
        """
        Process chat message and generate streaming response using AgentFactory.

        Args:
            query: The user's text input
            files: Optional list of Media files to attach to the message

        Yields dictionary events that will be formatted by EventStreamResponse.
        """
        messages, message_ids = self.build_current_state(query, files=files)

        # Create context for media library integration
        context = {
            "team": self.conversation.team,
            "agent": self.conversation.agent,
            "agent_version": self.conversation.agent_version,
            "conversation": self.conversation,
        }

        # Create the agent executor with streaming enabled
        agent_executor = AgentFactory.create_agent(
            agent_version=self.conversation.agent_version,
            context_variables=self.conversation.inputs,
            context=context,
        )
        stream = FrontendEventStream(agent_executor)

        yield stream.make_event(
            "conversation",
            {
                "id": str(self.conversation.uuid),
            },
        )

        try:
            yield from async_generator_to_sync(
                stream.stream_to_frontend,
                {
                    "messages": messages,
                },
            )

            # Send completion event
            new_messages = [
                message for message in stream.messages if message.id not in message_ids
            ]
            self.persist_output(new_messages)
            self.fill_title(query)
            yield stream.make_event("title", {"title": self.conversation.title})
            yield stream.make_event("done", {})

        except Exception as e:
            logger.error(f"Agent execution failed: {str(e)}")
            traceback.print_exc()

            yield {"event": "error", "data": {"error": str(e)}}

    def chat_blocking(
        self, query: str, files: Optional[List[Media]] = None
    ) -> MessageBlock:
        """
        Process chat message using AgentFactory and return complete response (blocking mode).

        Args:
            query: The user's text input
            files: Optional list of Media files to attach to the message

        Returns dictionary with conversation and message information.
        """
        # Add user message
        messages, message_ids = self.build_current_state(query, files=files)
        # Create agent executor with streaming enabled
        agent_executor = AgentFactory.create_agent(
            agent_version=self.conversation.agent_version,
            context_variables=self.conversation.inputs,
        )

        try:
            # Execute agent (blocking)
            result = agent_executor.invoke(
                {
                    "messages": messages,
                },
            )

            # remove history from new messages and persist
            new_messages = [
                message
                for message in result["messages"]
                if message.id not in message_ids
            ]
            block = self.persist_output(new_messages)
            self.fill_title(query)
            return block

        except Exception as e:
            logger.error(f"Agent execution failed: {str(e)}")
            traceback.print_exc()
            raise ValidationError(str(e))

    def persist_output(self, messages: List[BaseMessage]) -> MessageBlock:
        return BlockMessageHandler.create(
            role="assistant",
            conversation=self.conversation,
            messages=messages,
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
