import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.functions import Lower
from django.utils.translation import gettext_lazy as _

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
