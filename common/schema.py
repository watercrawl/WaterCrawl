import copy

from drf_spectacular.openapi import AutoSchema
from drf_spectacular.utils import Direction, _SchemaType, OpenApiResponse
from rest_framework import serializers
from rest_framework.fields import JSONField
from rest_framework.serializers import SerializerMetaclass


class WatterCrawlAutoSchema(AutoSchema):

    def _map_serializer_field(self, field, direction, bypass_extensions=False):
        if isinstance(field, JSONField):
            return {
                "type": "object",
                "additionalProperties": {"type": "string"},
            }
        return super()._map_serializer_field(field, direction, bypass_extensions)

    def get_tags(self, operation_keys=None):
        tokenized_path = self._tokenize_path()
        items = []
        for key in tokenized_path:
            if key not in ["api", "v1", "v2"]:
                items.append(key.title())

        return [" ".join(items[:2])]

    def _get_response_bodies(self, direction: Direction = 'response'):
        responses = super()._get_response_bodies(direction)
        bad_request_schema = self.get_bad_request_schema()
        if bad_request_schema and not responses.get('400'):
            responses['400'] = {
                "description": "Bad Request",
                "content": {
                    "application/json": {
                        "schema": bad_request_schema
                    }
                }
            }

        if hasattr(self.view, 'action') and self.view.action not in ['list', 'create'] and not responses.get('404'):
            responses['404'] = {
                "description": "Not Found",
                "content": {
                    "application/json": {
                        "schema": self.get_not_found_schema()
                    }
                }
            }

        if not responses.get('500'):
            responses['500'] = {
                "description": "Internal Server Error",
                "content": {
                    "application/json": {
                        "schema": self.get_internal_error_schema()
                    }
                }
            }

        return responses

    def get_bad_request_schema(self):
        """
        Generate a schema for validation errors based on a given serializer.
        """

        serializer_class = self.get_request_serializer()

        if not serializer_class:
            return None

        if isinstance(serializer_class, type):
            serializer_class = serializer_class()

        if self.method not in ["POST", "PUT", "PATCH"]:
            return None

        schema = {
            "type": "object",
            "properties": {},
            "required": []
        }

        for field_name, field in serializer_class.get_fields().items():
            if field.read_only:
                continue
            schema["properties"][field_name] = {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "example": ["The error message."]
            }
            if field.required:
                schema["required"].append(field_name)

        schema["properties"]['non_field_errors'] = {
            "type": "array",
            "items": {
                "type": "string"
            },
            "example": ["In the case of errors that are not related to a specific field."]
        }

        return {
            "type": "object",
            "properties": {
                "message:": {"type": "string", "example": "Invalid input data."},
                "errors": schema,
                "code": {"type": "integer", "example": 400}
            }
        }

    def get_internal_error_schema(self):
        return {
            "type": "object",
            "properties": {
                "message:": {"type": "string", "example": "An unexpected error occurred."},
                "errors":  {"type": "object", "example": None},
                "code": {"type": "integer", "example": 500}
            }
        }

    def get_not_found_schema(self):
        return {
            "type": "object",
            "properties": {
                "message:": {"type": "string", "example": "Not found."},
                "errors": {"type": "object", "example": None},
                "code": {"type": "integer", "example": 404}
            }
        }
