import requests
from celery import shared_task

from common.utils import generate_system_anonymous_information
from user.services import (
    ForgotPasswordService,
    TeamInvitationService,
    VerificationService,
)


@shared_task
def send_forget_password_email(email: str):
    service = ForgotPasswordService.make_with_email(email)
    service.send_reset_password_email()


@shared_task
def send_invitation_email(invitation_pk: str):
    service = TeamInvitationService.make_with_pk(invitation_pk)
    service.send_invitation_email()


@shared_task
def send_verification_email(user_pk: str):
    service = VerificationService.make_with_user_pk(user_pk)
    service.send_verification_email()


@shared_task
def send_newsletter_confirmation(email: str):
    data = {"email": email}
    requests.post("https://watercrawl.dev/api/v1/common/subscription/", json=data)


@shared_task
def send_analytics_confirmation():
    data = generate_system_anonymous_information()
    requests.post("https://watercrawl.dev/api/v1/common/installation/", json=data)
