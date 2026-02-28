from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from django.utils.translation import gettext as _
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from plan.validators import PlanLimitValidator
from user.models import User, Team, TeamAPIKey, TeamMember, TeamInvitation, Media


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
    )

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name"]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(_("Email already exists"))
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.messages)

        return value


class ProfileSerializer(RegisterSerializer):
    privacy_confirmed = serializers.BooleanField(write_only=True)
    terms_confirmed = serializers.BooleanField(write_only=True)

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "password",
            "last_name",
            "privacy_confirmed",
            "terms_confirmed",
            "privacy_confirmed_at",
            "terms_confirmed_at",
            "newsletter_confirmed",
            "is_superuser",
        ]
        read_only_fields = ["email", "privacy_confirmed_at", "terms_confirmed_at"]

    def update(self, instance, validated_data):
        if validated_data.get("password", None):
            instance.set_password(validated_data.pop("password"))
        if validated_data.get("privacy_confirmed", None):
            instance.privacy_confirmed_at = timezone.now()
        if validated_data.get("terms_confirmed", None):
            instance.terms_confirmed_at = timezone.now()
        return super().update(instance, validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True)

    def validate(self, attrs):
        user = User.objects.filter(
            email__iexact=attrs.get("email"), is_active=True
        ).first()
        if user is None:
            raise serializers.ValidationError({"email": _("Invalid email or password")})
        if not user.check_password(attrs.get("password")):
            raise serializers.ValidationError({"email": _("Invalid email or password")})

        if settings.IS_EMAIL_VERIFICATION_ACTIVE and not user.email_verified:
            raise PermissionDenied(_("Email is not verified"))

        return {"user": user}


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = [
            "uuid",
            "name",
            "is_default",
        ]


class APIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamAPIKey
        fields = [
            "uuid",
            "name",
            "key",
            "created_at",
            "last_used_at",
        ]
        read_only_fields = ["uuid", "key", "created_at", "last_used_at"]


class TeamMemberSerializer(serializers.ModelSerializer):
    user = ProfileSerializer(read_only=True)

    class Meta:
        model = TeamMember
        fields = ["uuid", "user", "is_owner"]


class OauthSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(
        choices=["github", "google", "google-signin"], required=True
    )
    token = serializers.CharField(required=True)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class ResetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(required=True, validators=[validate_password])


class TeamInvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamInvitation
        fields = [
            "uuid",
            "email",
            "created_at",
        ]
        read_only_fields = ["uuid", "created_at"]

    def validate(self, attrs):
        PlanLimitValidator(team=self.context["team"]).can_add_new_member()
        return attrs


class MyTeamInvitationSerializer(serializers.ModelSerializer):
    team = TeamSerializer(read_only=True)

    class Meta:
        model = TeamInvitation
        fields = [
            "uuid",
            "team",
            "created_at",
        ]
        read_only_fields = ["uuid", "team", "created_at"]


class RequestEmailVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class InstallSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, validators=[validate_password])
    newsletter_confirmed = serializers.BooleanField(required=False, default=False)
    analytics_confirmed = serializers.BooleanField(required=False, default=False)


class MediaSerializer(serializers.ModelSerializer):
    """Serializer for Media model."""

    related_object_type_name = serializers.CharField(
        source="related_object_type.model",
        read_only=True,
    )

    class Meta:
        model = Media
        fields = [
            "uuid",
            "team",
            "content_type",
            "file_name",
            "size",
            "related_object_type_name",
            "related_object_id",
            "metadata",
            "created_at",
            "updated_at",
            "download_url",
        ]
        read_only_fields = [
            "uuid",
            "team",
            "content_type",
            "file_name",
            "size",
            "related_object_type",
            "related_object_id",
            "metadata",
            "created_at",
            "updated_at",
            "download_url",
        ]


class MediaUploadSerializer(serializers.Serializer):
    """Serializer for media file upload."""

    file = serializers.FileField(help_text="The file to upload")
    metadata = serializers.JSONField(
        required=False,
        default=dict,
        help_text="Optional metadata dictionary (e.g., conversation_id, agent_version_id)",
    )

    def validate_file(self, value):
        """Validate that only PDF and image files are uploaded."""
        # Allowed content types
        allowed_types = [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
            "image/bmp",
        ]

        # Check content type
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                _(
                    "Only PDF and image files (JPEG, PNG, GIF, WebP, SVG, BMP) are allowed."
                )
            )

        # Optional: Check file extension as additional validation
        allowed_extensions = [
            ".pdf",
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".webp",
            ".svg",
            ".bmp",
        ]
        file_ext = (
            value.name.lower()[value.name.rfind(".") :] if "." in value.name else ""
        )

        if file_ext and file_ext not in allowed_extensions:
            raise serializers.ValidationError(
                f"File extension '{file_ext}' is not allowed. Only PDF and image files are accepted."
            )

        return value
