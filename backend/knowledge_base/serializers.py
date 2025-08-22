from rest_framework import serializers
from django.utils.translation import gettext_lazy as _

from core.models import CrawlResult
from knowledge_base.models import (
    KnowledgeBase,
    KnowledgeBaseDocument,
    KnowledgeBaseChunk,
)
from llm.models import ProviderConfig
from llm.serializers import LLMModelSerializer, EmbeddingModelSerializer
from llm.services import ProviderConfigService, LLMModelService
from plan.validators import PlanLimitValidator


class ProviderConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderConfig
        fields = ["uuid", "title"]
        read_only_fields = ["uuid", "title"]


class KnowledgeBaseDetailSerializer(serializers.ModelSerializer):
    embedding_model = EmbeddingModelSerializer(read_only=True)
    embedding_model_id = serializers.UUIDField(
        write_only=True, required=False, allow_null=True
    )
    embedding_provider_config = ProviderConfigSerializer(read_only=True)
    embedding_provider_config_id = serializers.UUIDField(
        write_only=True, required=False, allow_null=True
    )

    summarization_model = LLMModelSerializer(read_only=True)
    summarization_model_id = serializers.UUIDField(
        write_only=True, required=False, allow_null=True
    )
    summarization_provider_config = ProviderConfigSerializer(read_only=True)
    summarization_provider_config_id = serializers.UUIDField(
        write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = KnowledgeBase
        fields = [
            "uuid",
            "title",
            "description",
            "chunk_size",
            "chunk_overlap",
            "embedding_model",
            "embedding_model_id",
            "embedding_provider_config",
            "embedding_provider_config_id",
            "summarization_model",
            "summarization_model_id",
            "summarization_provider_config",
            "summarization_provider_config_id",
            "summarizer_type",
            "summarizer_temperature",
            "summarizer_context",
            "knowledge_base_each_document_cost",
            "document_count",
            "status",
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

        if embedding_provider_config and (
            "embedding_model_id" not in attrs
            or not embedding_provider_config.available_embedding_models.filter(
                pk=attrs["embedding_model_id"]
            ).exists()
        ):
            raise serializers.ValidationError(
                {"embedding_model_id": _("Invalid embedding model id.")}
            )

        if summarization_provider_config:
            if "summarization_model_id" not in attrs:
                raise serializers.ValidationError(
                    {"summarization_model_id": _("Summarization model id is required.")}
                )

            llm_model = summarization_provider_config.available_llm_models.filter(
                pk=attrs["summarization_model_id"]
            ).first()
            if not llm_model:
                raise serializers.ValidationError(
                    {"summarization_model_id": _("Invalid summarization model id.")}
                )

            if not LLMModelService(llm_model).validate_temperature(
                attrs.get("summarizer_temperature")
            ):
                raise serializers.ValidationError(
                    {"summarizer_temperature": _("Invalid summarizer temperature.")}
                )

        attrs["embedding_provider_config"] = embedding_provider_config
        attrs["summarization_provider_config"] = summarization_provider_config

        return PlanLimitValidator(
            team=self.context["team"],
        ).validate_create_knowledge_base(attrs)

    def update(self, instance, validated_data):
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
            "keywords",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uuid", "created_at", "updated_at", "embedding"]


class QueryKnowledgeBaseSerializer(serializers.Serializer):
    query = serializers.CharField(required=True)
    top_k = serializers.IntegerField(
        required=False, default=10, min_value=1, max_value=50
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
    llm_model_id = serializers.UUIDField(write_only=True, required=True)
    temperature = serializers.FloatField(
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
        llm_model = provider_config.available_llm_models.filter(
            pk=attrs["llm_model_id"]
        ).first()

        if not LLMModelService(llm_model).validate_temperature(attrs["temperature"]):
            raise serializers.ValidationError(
                {"temperature": _("Invalid temperature.")}
            )

        if not llm_model:
            raise serializers.ValidationError(
                {"llm_model_id": _("Invalid llm model id.")}
            )
        return {
            "provider_config": provider_config,
            "llm_model": llm_model,
            "content": attrs["content"],
            "temperature": attrs["temperature"],
        }


class EnhancedContentSerializer(serializers.Serializer):
    content = serializers.CharField()
