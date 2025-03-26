import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.functions import Lower
from django.utils.translation import gettext_lazy as _

from common.models import BaseModel
from user.managers import UserManager
from user.utils import generate_random_api_key


class User(AbstractUser):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None
    email = models.EmailField(_("email address"), unique=True)
    reset_password_expires_at = models.DateTimeField(
        _("reset password expires at"),
        null=True,
        blank=True,
    )
    reset_password_token = models.CharField(
        _("reset password token"),
        max_length=255,
        null=True,
        blank=True,
    )
    email_verification_token = models.CharField(
        _("email verification token"),
        max_length=255,
        null=True,
        blank=True,
    )
    email_verified = models.BooleanField(
        _("email verified"),
        default=False,
    )
    privacy_confirmed_at = models.DateTimeField(
        _("privacy confirmed at"),
        null=True,
        blank=True,
    )
    terms_confirmed_at = models.DateTimeField(
        _("terms confirmed at"),
        null=True,
        blank=True,
    )
    newsletter_confirmed = models.BooleanField(
        _("newsletter confirmed"),
        default=False,
    )

    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
        constraints = [
            models.UniqueConstraint(Lower("email"), name="unique_email"),
        ]

    def __str__(self):
        return self.email


class Team(BaseModel):
    name = models.CharField(
        _("name"),
        max_length=255,
    )
    members = models.ManyToManyField(
        User,
        verbose_name=_("members"),
        through="TeamMember",
        related_name="teams",
    )
    stripe_customer_id = models.CharField(
        _("stripe customer id"), max_length=255, null=True, blank=True
    )
    is_default = models.BooleanField(
        _("is default"),
        default=False,
    )

    def __str__(self):
        return self.name

    @property
    def owner(self):
        team_member = TeamMember.objects.filter(team=self).filter(is_owner=True).first()
        return team_member.user if team_member else self.members.order_by("id").first()


class TeamMember(BaseModel):
    user = models.ForeignKey(
        User,
        verbose_name=_("user"),
        on_delete=models.CASCADE,
        related_name="member_teams",
    )
    team = models.ForeignKey(
        Team,
        verbose_name=_("team"),
        on_delete=models.CASCADE,
        related_name="team_members",
    )
    is_owner = models.BooleanField(
        _("is owner"),
        default=False,
    )

    def __str__(self):
        return str(self.user)


class TeamInvitation(BaseModel):
    team = models.ForeignKey(
        Team,
        verbose_name=_("team"),
        on_delete=models.CASCADE,
        related_name="invitations",
    )
    email = models.EmailField(
        _("email address"),
        db_index=True,
    )
    activated = models.BooleanField(
        _("activated"),
        default=False,
    )

    def __str__(self):
        return self.email

    class Meta:
        unique_together = ("team", "email")


class TeamAPIKey(BaseModel):
    name = models.CharField(
        _("name"),
        max_length=255,
    )
    team = models.ForeignKey(
        Team,
        verbose_name=_("team"),
        on_delete=models.CASCADE,
        related_name="api_keys",
    )
    key = models.CharField(
        _("key"), max_length=255, unique=True, default=generate_random_api_key
    )
    last_used_at = models.DateTimeField(
        _("last used at"),
        null=True,
        blank=True,
    )

    def __str__(self):
        return str(self.key)
