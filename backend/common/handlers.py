import traceback

from django.http import Http404
from django.utils.translation import gettext_lazy as _
from rest_framework import status, exceptions
from rest_framework.exceptions import ValidationError
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.response import Response


def water_crawl_exception_handler(exc, context):
    # Default structure for the response
    custom_response_data = {
        "code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "errors": None,
        "message": _("An unexpected error occurred."),
    }

    if isinstance(exc, DjangoValidationError):
        # Handle serializer validation errors
        custom_response_data["code"] = status.HTTP_400_BAD_REQUEST
        custom_response_data["errors"] = {"non_field_errors": exc.messages}
        custom_response_data["message"] = " ".join(exc.messages) or _(
            "Invalid input data."
        )

    if isinstance(exc, ValidationError):
        # Handle serializer validation errors
        errors = exc.detail if not isinstance(exc.detail, list) else []
        message = (
            "".join(exc.detail)
            if isinstance(exc.detail, list)
            else _("Invalid input data.")
        )
        custom_response_data["code"] = status.HTTP_400_BAD_REQUEST
        custom_response_data["errors"] = errors
        custom_response_data["message"] = message

    elif isinstance(
        exc,
        (
            exceptions.NotFound,
            exceptions.AuthenticationFailed,
            exceptions.PermissionDenied,
            exceptions.NotAuthenticated,
            exceptions.APIException,
        ),
    ):
        custom_response_data["code"] = exc.status_code
        custom_response_data["message"] = exc.detail

    elif isinstance(exc, Http404):
        # Handle not found errors
        custom_response_data["code"] = status.HTTP_404_NOT_FOUND
        custom_response_data["message"] = _("Not found.")

    else:
        traceback.print_exc()

    # Override the default response with the custom response structure
    return Response(custom_response_data, status=custom_response_data["code"])
