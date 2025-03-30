from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from django.utils.translation import gettext as _
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from user.models import User, Team, TeamAPIKey, TeamMember, TeamInvitation


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

        if not user.email_verified:
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
