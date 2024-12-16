import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

from common.models import BaseModel
from user.managers import UserManager
from user.utils import generate_random_api_key


class User(AbstractUser):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None
    email = models.EmailField(
        _('email address'),
        unique=True
    )

    USERNAME_FIELD = 'email'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email


class Team(BaseModel):
    name = models.CharField(
        _('name'),
        max_length=255,
    )
    members = models.ManyToManyField(
        User,
        verbose_name=_('members'),
        through='TeamMember',
        related_name='teams',
    )

    def __str__(self):
        return self.name


class TeamMember(BaseModel):
    user = models.ForeignKey(
        User,
        verbose_name=_('user'),
        on_delete=models.CASCADE,
        related_name='member_teams',
    )
    team = models.ForeignKey(
        Team,
        verbose_name=_('team'),
        on_delete=models.CASCADE,
        related_name='team_members',
    )
    is_owner = models.BooleanField(
        _('is owner'),
        default=False,
    )

    def __str__(self):
        return str(self.user)


class TeamInvitation(BaseModel):
    team = models.ForeignKey(
        Team,
        verbose_name=_('team'),
        on_delete=models.CASCADE,
        related_name='invitations',
    )
    email = models.EmailField(
        _('email address'),
    )
    active = models.BooleanField(
        _('active'),
        default=False,
    )

    def __str__(self):
        return self.email

    class Meta:
        unique_together = ('team', 'email')


class TeamAPIKey(BaseModel):
    name = models.CharField(
        _('name'),
        max_length=255,
    )
    team = models.ForeignKey(
        Team,
        verbose_name=_('team'),
        on_delete=models.CASCADE,
        related_name='api_keys',
    )
    key = models.CharField(
        _('key'),
        max_length=255,
        unique=True,
        default=generate_random_api_key
    )

    def __str__(self):
        return str(self.key)
