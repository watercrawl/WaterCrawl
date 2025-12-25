import datetime
import uuid
from django.contrib.auth.models import AbstractUser
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models.functions import Lower
from django.utils.translation import gettext_lazy as _
from django_minio_backend.utils import get_setting

from common.models import BaseModel
from user.managers import UserManager
from user.utils import generate_random_api_key, generate_random_invitation_code


class User(AbstractUser):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None
    email = models.EmailField(_("Email Address"), unique=True)
    reset_password_expires_at = models.DateTimeField(
        _("Reset Password Expires At"),
        null=True,
        blank=True,
    )
    reset_password_token = models.CharField(
        _("Reset Password Token"),
        max_length=255,
        null=True,
        blank=True,
    )
    email_verification_token = models.CharField(
        _("Email Verification Token"),
        max_length=255,
        null=True,
        blank=True,
    )
    email_verified = models.BooleanField(
        _("Email Verified"),
        default=False,
    )
    privacy_confirmed_at = models.DateTimeField(
        _("Privacy Confirmed At"),
        null=True,
        blank=True,
    )
    terms_confirmed_at = models.DateTimeField(
        _("Terms Confirmed At"),
        null=True,
        blank=True,
    )
    newsletter_confirmed = models.BooleanField(
        _("Newsletter Confirmed"),
        default=False,
    )

    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")
        constraints = [
            models.UniqueConstraint(Lower("email"), name="unique_email"),
        ]

    def __str__(self):
        return self.email


class Team(BaseModel):
    name = models.CharField(
        _("Name"),
        max_length=255,
    )
    members = models.ManyToManyField(
        User,
        verbose_name=_("Members"),
        through="TeamMember",
        related_name="teams",
    )
    stripe_customer_id = models.CharField(
        _("Stripe Customer ID"), max_length=255, null=True, blank=True
    )
    is_default = models.BooleanField(
        _("Is Default"),
        default=False,
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Team")
        verbose_name_plural = _("Teams")

    @property
    def owner(self):
        team_member = TeamMember.objects.filter(team=self).filter(is_owner=True).first()
        return team_member.user if team_member else self.members.order_by("id").first()


class TeamMember(BaseModel):
    user = models.ForeignKey(
        User,
        verbose_name=_("User"),
        on_delete=models.CASCADE,
        related_name="member_teams",
    )
    team = models.ForeignKey(
        Team,
        verbose_name=_("Team"),
        on_delete=models.CASCADE,
        related_name="team_members",
    )
    is_owner = models.BooleanField(
        _("Is Owner"),
        default=False,
    )

    def __str__(self):
        return str(self.user)

    class Meta:
        verbose_name = _("Team Member")
        verbose_name_plural = _("Team Members")


class TeamInvitation(BaseModel):
    team = models.ForeignKey(
        Team,
        verbose_name=_("Team"),
        on_delete=models.CASCADE,
        related_name="invitations",
    )
    invitation_token = models.CharField(
        _("Invitation Token"),
        max_length=255,
        default=generate_random_invitation_code,
        null=True,
    )
    email = models.EmailField(
        _("Email Address"),
        db_index=True,
    )
    activated = models.BooleanField(
        _("Activated"),
        default=False,
    )

    def __str__(self):
        return self.email

    class Meta:
        verbose_name = _("Team Invitation")
        verbose_name_plural = _("Team Invitations")
        unique_together = ("team", "email")


class TeamAPIKey(BaseModel):
    name = models.CharField(
        _("Name"),
        max_length=255,
    )
    team = models.ForeignKey(
        Team,
        verbose_name=_("Team"),
        on_delete=models.CASCADE,
        related_name="api_keys",
    )
    key = models.CharField(
        _("Key"), max_length=255, unique=True, default=generate_random_api_key
    )
    last_used_at = models.DateTimeField(
        _("Last Used At"),
        null=True,
        blank=True,
    )

    def __str__(self):
        return str(self.key)

    class Meta:
        verbose_name = _("Team API Key")
        verbose_name_plural = _("Team API Keys")


class Media(BaseModel):
    """Media library for team-related files."""

    team = models.ForeignKey(
        Team,
        verbose_name=_("Team"),
        on_delete=models.CASCADE,
        related_name="media_files",
    )
    content_type = models.CharField(
        _("Content Type"),
        max_length=255,
        help_text=_("MIME type of the file (e.g., 'text/csv', 'application/json')"),
    )
    file_name = models.CharField(
        _("File Name"),
        max_length=255,
    )
    file = models.FileField(
        _("File"),
        upload_to="media/%Y/%m/%d/",
        storage=None,  # Will use default storage
    )
    size = models.PositiveIntegerField(
        _("Size"),
        help_text=_("File size in bytes"),
    )
    # Generic relation to any object (Agent, Conversation, etc.)
    related_object_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name=_("Related Object Type"),
        related_name="media_files",
        null=True,
        blank=True,
    )
    related_object_id = models.UUIDField(
        _("Related Object ID"),
        null=True,
        blank=True,
    )
    related_object = GenericForeignKey("related_object_type", "related_object_id")
    metadata = models.JSONField(
        _("Metadata"),
        default=dict,
        blank=True,
        help_text=_("Additional metadata (e.g., conversation_id, agent_version_id)"),
    )

    class Meta:
        verbose_name = _("Media")
        verbose_name_plural = _("Media")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["team", "-created_at"]),
            models.Index(fields=["related_object_type", "related_object_id"]),
        ]

    def __str__(self):
        return f"{self.file_name} ({self.team.name})"

    @property
    def download_url(self):
        storage = self.file.storage
        object_name = self.file.name

        response_headers = {
            "response-content-disposition": f'attachment; filename="{object_name.split("/")[-1]}"'
        }

        client = storage.client if storage.same_endpoints else storage.client_external
        return client.presigned_get_object(
            bucket_name=storage.bucket,
            object_name=object_name,
            expires=get_setting("MINIO_URL_EXPIRY_HOURS", datetime.timedelta(days=7)),
            response_headers=response_headers,
        )
