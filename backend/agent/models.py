from django.db import models
from django.utils.translation import gettext_lazy as _

from common.models import BaseModel


class Agent(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    system_prompt = models.TextField(null=True, blank=True)
    provider_config = models.ForeignKey(
        "llm.ProviderConfig",
        on_delete=models.SET_NULL,
        verbose_name=_("config provider"),
        related_name="agents",
        null=True,
        blank=True,
    )
    llm_model = models.ForeignKey(
        "llm.LLMModel",
        on_delete=models.CASCADE,
        verbose_name=_("llm model"),
        related_name="agents",
        null=True,
        blank=True,
    )
    team = models.ForeignKey(
        "user.Team",
        on_delete=models.CASCADE,
        verbose_name=_("team"),
        related_name="agents",
        null=True,
        blank=True,
    )


class Tool(BaseModel):
    tool_type = models.CharField(max_length=255)
    agent = models.ForeignKey(
        "agent.Agent",
        on_delete=models.CASCADE,
        verbose_name=_("agent"),
        related_name="tools",
    )
    config = models.JSONField()


class Conversation(BaseModel):
    title = models.CharField(max_length=255, null=True, blank=True)
    user_identifier = models.CharField(max_length=255, null=True, blank=True)
    agent = models.ForeignKey(
        "agent.Agent",
        on_delete=models.CASCADE,
        verbose_name=_("agent"),
        related_name="conversations",
        null=True,
        blank=True,
    )
    team = models.ForeignKey(
        "user.Team",
        on_delete=models.CASCADE,
        verbose_name=_("team"),
        related_name="conversations",
    )


class Message(BaseModel):
    conversation = models.ForeignKey(
        "agent.Conversation",
        on_delete=models.CASCADE,
        verbose_name=_("conversation"),
        related_name="messages",
    )
    role = models.CharField(max_length=255)
    content = models.TextField()
