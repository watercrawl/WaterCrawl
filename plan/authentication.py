from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed
from django.utils.translation import gettext_lazy as _
from stripe import Webhook, SignatureVerificationError
from django.conf import settings


class StripeSignatureAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication class for Stripe webhooks that verifies
    the signature in the Stripe-Signature header.
    """

    def authenticate(self, request):
        # Get the signature from headers
        signature = request.headers.get('Stripe-Signature')
        if not signature:
            raise AuthenticationFailed(_('No Stripe signature found'))

        try:
            # Verify the signature
            Webhook.construct_event(
                payload=request.body,
                sig_header=signature,
                secret=settings.STRIPE_WEBHOOK_SECRET
            )
            # Return None for the user since webhook requests are not associated with any user
            return (None, None)
        except SignatureVerificationError:
            raise AuthenticationFailed(_('Invalid Stripe signature'))
        except Exception as e:
            raise AuthenticationFailed(str(e))