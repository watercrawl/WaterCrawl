from rest_framework import serializers
from django.utils.translation import gettext_lazy as _

from core.models import CrawlResult
from llm import consts as llm_consts
from knowledge_base.models import (
    KnowledgeBase,
    KnowledgeBaseDocument,
    KnowledgeBaseChunk,
    RetrievalSetting,
    KnowledgeBaseQuery,
)
from llm.models import ProviderConfig
from llm.models_config.config import ModelConfigLoader, ModelType
from llm.services import ProviderConfigService, ModelAvailabilityService
from plan.validators import PlanLimitValidator


class ProviderConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderConfig
        fields = ["uuid", "title"]
        read_only_fields = ["uuid", "title"]


class RetrievalSettingSerializer(serializers.ModelSerializer):
    reranker_provider_config = ProviderConfigSerializer(read_only=True)
    reranker_provider_config_id = serializers.UUIDField(
        write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = RetrievalSetting
        fields = [
            "uuid",
            "name",
            "retrieval_type",
            "is_default",
            "reranker_enabled",
            "reranker_model_key",
            "reranker_provider_config",
            "reranker_provider_config_id",
            "reranker_model_config",
            "top_k",
            "hybrid_alpha",
            "retrieval_cost",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uuid", "retrieval_cost", "created_at", "updated_at"]

    def validate_reranker_provider_config_id(self, value):
        if not value:
            return None
        provider_config = (
            ProviderConfigService.get_team_provider_configs(self.context["team"])
            .filter(pk=value)
            .first()
        )
        if not provider_config:
            raise serializers.ValidationError(_("Invalid reranker provider config id."))
        return provider_config

    def validate(self, attrs):
        reranker_provider_config = attrs.get("reranker_provider_config_id", None)

        # Validate reranker settings
        if attrs.get("reranker_enabled"):
            if not reranker_provider_config:
                raise serializers.ValidationError(
                    {
                        "reranker_provider_config_id": _(
                            "Reranker provider config is required when reranker is enabled."
                        )
                    }
                )
            if not attrs.get("reranker_model_key"):
                raise serializers.ValidationError(
                    {
                        "reranker_model_key": _(
                            "Reranker model key is required when reranker is enabled."
                        )
                    }
                )
            # If reranker is enabled, hybrid_alpha should not be used
            if attrs.get("hybrid_alpha") is not None:
                attrs["hybrid_alpha"] = None

        # Validate retrieval type vs embedding
        knowledge_base = self.context.get("knowledge_base")
        if knowledge_base:
            retrieval_type = attrs.get("retrieval_type")
            if retrieval_type in [
                RetrievalSetting.RETRIEVAL_TYPE_VECTOR,
                RetrievalSetting.RETRIEVAL_TYPE_HYBRID,
            ]:
                if not knowledge_base.embedding_provider_config:
                    raise serializers.ValidationError(
                        _(
                            "Vector search and hybrid search require the knowledge base to have embedding configuration."
                        )
                    )

        if reranker_provider_config:
            attrs["reranker_provider_config"] = reranker_provider_config
            attrs.pop("reranker_provider_config_id", None)

        return attrs

    def create(self, validated_data):
        knowledge_base = self.context["knowledge_base"]
        validated_data["knowledge_base"] = knowledge_base

        # If this is set as default, unset other defaults
        if validated_data.get("is_default"):
            RetrievalSetting.objects.filter(
                knowledge_base=knowledge_base, is_default=True
            ).update(is_default=False)

        instance = super().create(validated_data)
        return instance

    def update(self, instance, validated_data):
        # If this is set as default, unset other defaults
        if validated_data.get("is_default") and not instance.is_default:
            RetrievalSetting.objects.filter(
                knowledge_base=instance.knowledge_base, is_default=True
            ).exclude(pk=instance.pk).update(is_default=False)

        return super().update(instance, validated_data)


class KnowledgeBaseDetailSerializer(serializers.ModelSerializer):
    embedding_model_key = serializers.CharField(required=False, allow_null=True)
    embedding_provider_config = ProviderConfigSerializer(read_only=True)
    embedding_provider_config_id = serializers.UUIDField(
        write_only=True, required=False, allow_null=True
    )

    summarization_model_key = serializers.CharField(required=False, allow_null=True)
    summarization_provider_config = ProviderConfigSerializer(read_only=True)
    summarization_provider_config_id = serializers.UUIDField(
        write_only=True, required=False, allow_null=True
    )
    chunk_size = serializers.IntegerField(
        required=False, allow_null=True, min_value=800
    )
    default_retrieval_setting = RetrievalSettingSerializer(
        read_only=True,
    )
    initial_retrieval_setting = RetrievalSettingSerializer(
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = KnowledgeBase
        fields = [
            "uuid",
            "title",
            "description",
            "chunk_size",
            "chunk_overlap",
            "embedding_model_key",
            "embedding_provider_config",
            "embedding_provider_config_id",
            "summarization_model_key",
            "summarization_provider_config",
            "summarization_provider_config_id",
            "summarizer_type",
            "summarizer_llm_config",
            "summarizer_context",
            "knowledge_base_each_document_cost",
            "document_count",
            "status",
            "default_retrieval_setting",
            "initial_retrieval_setting",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "uuid",
            "created_at",
            "updated_at",
            "status",
            "knowledge_base_each_document_cost",
            "document_count",
            "default_retrieval_setting",
        ]

    def validate_embedding_provider_config_id(self, value):
        if not value:
            return None
        provider_config = (
            ProviderConfigService.get_team_provider_configs(self.context["team"])
            .filter(pk=value)
            .first()
        )
        if not provider_config:
            raise serializers.ValidationError(
                _("Invalid embedding provider config id.")
            )
        return provider_config

    def validate_summarization_provider_config_id(self, value):
        if not value:
            return None
        provider_config = (
            ProviderConfigService.get_team_provider_configs(self.context["team"])
            .filter(pk=value)
            .first()
        )

        if not provider_config:
            raise serializers.ValidationError(
                _("Invalid summarization provider config id.")
            )
        return provider_config

    def validate(self, attrs):
        embedding_provider_config = attrs.pop("embedding_provider_config_id", None)  # type: ProviderConfig
        summarization_provider_config = attrs.pop(
            "summarization_provider_config_id", None
        )  # type: ProviderConfig

        if embedding_provider_config:
            if "embedding_model_key" not in attrs:
                raise serializers.ValidationError(
                    {"embedding_model_key": _("Embedding model key is required.")}
                )

            if not ModelAvailabilityService.is_model_available(
                provider_config=embedding_provider_config,
                model_type=llm_consts.MODEL_TYPE_EMBEDDING,
                model_key=attrs["embedding_model_key"],
            ):
                raise serializers.ValidationError(
                    {"embedding_model_key": _("Invalid embedding model Key.")}
                )

        if summarization_provider_config:
            if "summarization_model_key" not in attrs:
                raise serializers.ValidationError(
                    {
                        "summarization_model_key": _(
                            "Summarization model id is required."
                        )
                    }
                )

            try:
                llm_model_config = ModelConfigLoader(
                    provider_name=summarization_provider_config.provider_name,
                    model_type=ModelType.LLM,
                    model_name=attrs["summarization_model_key"],
                ).load()

            except FileNotFoundError:
                raise serializers.ValidationError(
                    {"summarization_model_key": _("Invalid summarization model Key.")}
                )

            if errors := llm_model_config.has_config_error(
                attrs.get("summarizer_llm_config", {})
            ):
                raise serializers.ValidationError({"summarizer_llm_config": errors})

        # Add provider configs back to attrs so they can be saved
        if embedding_provider_config:
            attrs["embedding_provider_config"] = embedding_provider_config
        if summarization_provider_config:
            attrs["summarization_provider_config"] = summarization_provider_config

        if not attrs.get("initial_retrieval_setting") and not self.instance:
            raise serializers.ValidationError(
                {
                    "initial_retrieval_setting": _(
                        "Initial retrieval setting is required."
                    )
                }
            )

        validated_data = PlanLimitValidator(
            team=self.context["team"],
        ).validate_create_knowledge_base(attrs)

        return validated_data

    def update(self, instance, validated_data):
        validated_data.pop("initial_retrieval_setting", None)
        return super().update(instance, validated_data)


class KnowledgeBaseSerializer(KnowledgeBaseDetailSerializer):
    class Meta(KnowledgeBaseDetailSerializer.Meta):
        fields = ["uuid", "title", "description", "created_at", "updated_at"]
        read_only_fields = ["uuid", "created_at", "updated_at"]


class KnowledgeBaseDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeBaseDocument
        fields = [
            "uuid",
            "title",
            "source",
            "error",
            "status",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uuid", "created_at", "updated_at"]


class KnowledgeBaseDocumentDetailSerializer(KnowledgeBaseDocumentSerializer):
    class Meta(KnowledgeBaseDocumentSerializer.Meta):
        fields = KnowledgeBaseDocumentSerializer.Meta.fields + ["content"]

    def validate(self, attrs):
        knowledge_base = self.context["knowledge_base"]
        return PlanLimitValidator(
            team=self.context["team"],
        ).validate_create_knowledge_base_document_from_manual(knowledge_base, attrs)


class KnowledgeBaseChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeBaseChunk
        fields = [
            "uuid",
            "index",
            "document",
            "content",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uuid", "created_at", "updated_at", "embedding"]


class QueryKnowledgeBaseSerializer(serializers.Serializer):
    query = serializers.CharField(required=True)
    top_k = serializers.IntegerField(
        required=False, default=10, min_value=1, max_value=50
    )
    retrieval_setting_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="UUID of retrieval setting to use (defaults to knowledge base default)",
    )


class SummarizeKnowledgeBaseSerializer(serializers.Serializer):
    num_documents = serializers.IntegerField(required=False, default=10)


class FillKnowledgeBaseFromUrlsSerializer(serializers.Serializer):
    urls = serializers.ListField(
        child=serializers.URLField(), required=False, min_length=1
    )

    def validate(self, attrs):
        return PlanLimitValidator(
            team=self.context["team"],
        ).validate_create_knowledge_base_document_from_urls(
            self.context["knowledge_base"], attrs
        )


class FillKnowledgeBaseFromCrawlResultsSerializer(serializers.Serializer):
    crawl_result_uuids = serializers.ListField(
        child=serializers.UUIDField(), required=True
    )

    def validate_crawl_result_uuids(self, value):
        if not value:
            raise serializers.ValidationError(_("crawl_result_uuids cannot be empty."))

        team = self.context["team"]  # type: Team

        results = CrawlResult.objects.filter(request__team=team, uuid__in=value)
        if not results.exists():
            raise serializers.ValidationError(
                _("No valid crawl results found for the provided UUIDs.")
            )

        return results

    def validate(self, attrs):
        return PlanLimitValidator(
            team=self.context["team"],
        ).validate_create_knowledge_base_document_from_crawl_results(
            self.context["knowledge_base"], attrs["crawl_result_uuids"].count(), attrs
        )


class FillKnowledgeBaseFromCrawlRequestsSerializer(serializers.Serializer):
    crawl_request_uuid = serializers.UUIDField(required=True)

    def validate_crawl_request_uuid(self, value):
        team = self.context["team"]
        crawl_request = team.crawl_requests.filter(uuid=value).first()
        if not crawl_request:
            raise serializers.ValidationError(_("Invalid crawl request UUID."))
        return crawl_request

    def validate(self, attrs):
        return PlanLimitValidator(
            team=self.context["team"],
        ).validate_create_knowledge_base_document_from_crawl_requests(
            self.context["knowledge_base"], attrs["crawl_request_uuid"], attrs
        )


class FillKnowledgeBaseFromFileSerializer(serializers.Serializer):
    files = serializers.ListField(
        child=serializers.FileField(allow_empty_file=False), required=True
    )

    def validate_files(self, value):
        if not value:
            raise serializers.ValidationError(_("Files cannot be empty."))
        for file in value:
            if not file.name.lower().endswith(
                (".md", ".txt", ".text", ".html", ".docx", ".csv")
            ):
                raise serializers.ValidationError(
                    _("File must be a pdf, docx, image, or text.")
                )
        return value

    def validate(self, attrs):
        return PlanLimitValidator(
            team=self.context["team"],
        ).validate_create_knowledge_base_document_from_file(
            self.context["knowledge_base"], attrs
        )


class ContextAwareEnhancerSerializer(serializers.Serializer):
    provider_config_id = serializers.UUIDField(write_only=True, required=True)
    llm_model_key = serializers.CharField(write_only=True, required=True)
    llm_model_config = serializers.JSONField(
        write_only=True, required=True, allow_null=True
    )
    content = serializers.CharField(required=True)

    def validate_provider_config_id(self, value):
        provider_config = (
            ProviderConfigService.get_team_provider_configs(self.context["team"])
            .filter(pk=value)
            .first()
        )
        if not provider_config:
            raise serializers.ValidationError(_("Invalid provider config id."))
        return provider_config

    def validate(self, attrs):
        provider_config = attrs["provider_config_id"]  # type: ProviderConfig
        if not ModelAvailabilityService.is_model_available(
            provider_config=provider_config,
            model_type=llm_consts.MODEL_TYPE_LLM,
            model_key=attrs["llm_model_key"],
        ):
            raise serializers.ValidationError(
                {"llm_model_key": _("Invalid llm model Key.")}
            )

        # TODO: Validate model config
        # if errors := model_config.has_config_error(attrs.get("llm_model_config", {})):
        #     raise serializers.ValidationError(
        #         {"llm_model_config": errors}
        #     )

        return {
            "provider_config": provider_config,
            "content": attrs["content"],
            "llm_model_key": attrs["llm_model_key"],
            "llm_model_config": attrs["llm_model_config"],
        }


class EnhancedContentSerializer(serializers.Serializer):
    content = serializers.CharField()


class KnowledgeBaseQuerySerializer(serializers.ModelSerializer):
    """Serializer for knowledge base query history."""

    class Meta:
        model = KnowledgeBaseQuery
        fields = [
            "uuid",
            "knowledge_base",
            "retrieval_setting",
            "query_text",
            "status",
            "results_count",
            "retrieval_cost",
            "error_message",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "uuid",
            "status",
            "results_count",
            "retrieval_cost",
            "error_message",
            "created_at",
            "updated_at",
        ]
