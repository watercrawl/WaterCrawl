from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Team, TeamMember, TeamInvitation, TeamAPIKey, Media


class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 1


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("email", "first_name", "last_name", "is_staff", "email_verified")
    search_fields = ("email", "first_name", "last_name")
    ordering = ("email",)
    list_filter = ("is_staff", "is_active", "email_verified")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Personal info"), {"fields": ("first_name", "last_name")}),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (
            _("Email verification"),
            {"fields": ("email_verified", "email_verification_token")},
        ),
        (
            _("Password reset"),
            {"fields": ("reset_password_token", "reset_password_expires_at")},
        ),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2"),
            },
        ),
    )


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("name", "is_default", "stripe_customer_id", "created_at")
    search_fields = ("name", "stripe_customer_id")
    list_filter = ("is_default", "created_at")
    inlines = [TeamMemberInline]


@admin.register(TeamInvitation)
class TeamInvitationAdmin(admin.ModelAdmin):
    list_display = ("email", "team", "activated", "created_at")
    search_fields = ("email", "team__name")
    list_filter = ("activated", "created_at")


@admin.register(TeamAPIKey)
class TeamAPIKeyAdmin(admin.ModelAdmin):
    list_display = ("name", "team", "key", "last_used_at", "created_at")
    search_fields = ("name", "team__name", "key")
    list_filter = ("created_at", "last_used_at")
    readonly_fields = ("key",)


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = [
        "file_name",
        "team",
        "content_type",
        "size",
        "related_object_type",
        "created_at",
    ]
    list_filter = ["content_type", "created_at", "related_object_type"]
    search_fields = ["file_name", "team__name"]
    readonly_fields = ["uuid", "created_at", "updated_at"]
    raw_id_fields = ["team", "related_object_type"]
