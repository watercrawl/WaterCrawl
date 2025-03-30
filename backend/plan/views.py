from django.utils.translation import gettext_lazy as _
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiResponse

from common.permissions import IsEnterpriseMode
from plan.authentication import StripeSignatureAuthentication
from plan import serializers
from plan.models import Plan
from plan.services import StripeService, TeamPlanService
from user.decorators import setup_current_team
from user.permissions import IsAuthenticatedTeam


@extend_schema_view(
    list=extend_schema(
        summary=_("List available plans"),
        description=_(
            "Returns a list of all active subscription plans with their details including pricing, features and limits."
        ),
        tags=["Subscriptions"],
    ),
    retrieve=extend_schema(
        summary=_("Get plan details"),
        description=_(
            "Returns detailed information about a specific subscription plan."
        ),
        tags=["Subscriptions"],
    ),
)
class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.PlanSerializer
    authentication_classes = ()
    permission_classes = ()
    pagination_class = None

    def get_queryset(self):
        return Plan.objects.filter(is_active=True)


@extend_schema_view(
    current=extend_schema(
        summary=_("Get current subscription details"),
        description=_(
            "Returns detailed information about the team's current subscription."
        ),
        tags=["Subscriptions"],
        request=None,
        responses={
            200: serializers.TeamPlanSerializer,
            404: OpenApiResponse(description=_("You have no active subscription")),
        },
    ),
    retrieve=extend_schema(
        summary=_("Get subscription details"),
        description=_(
            "Returns detailed information about the team's current subscription."
        ),
        tags=["Subscriptions"],
    ),
    list=extend_schema(
        summary=_("List team subscriptions"),
        description=_("Returns a list of all active subscriptions for the team."),
        tags=["Subscriptions"],
    ),
    start=extend_schema(
        summary=_("Start a new subscription"),
        description=_("Starts a new subscription for the team."),
        tags=["Subscriptions"],
        responses={
            204: OpenApiResponse(description=_("Subscription started successfully.")),
            200: OpenApiResponse(
                response={
                    "type": "object",
                    "properties": {
                        "redirect_url": {
                            "type": "string",
                            "description": _(
                                "The URL to redirect the user to for payment processing."
                            ),
                        }
                    },
                },
                description=_(
                    "Returns the URL to redirect the user to for payment processing."
                ),
            ),
        },
    ),
    cancel=extend_schema(
        summary=_("Cancel subscription"),
        description=_("Cancels the active subscription for the team."),
        tags=["Subscriptions"],
    ),
    customer_session=extend_schema(
        summary=_("Get customer session URL"),
        description=_(
            "Returns the URL to redirect the user to for payment processing."
        ),
        tags=["Subscriptions"],
        responses={
            200: OpenApiResponse(
                response={
                    "type": "object",
                    "properties": {
                        "redirect_url": {
                            "type": "string",
                            "description": _(
                                "The URL to redirect the user to for payment processing."
                            ),
                        }
                    },
                },
                description=_(
                    "Returns the URL to redirect the user to for payment processing."
                ),
            )
        },
    ),
)
@setup_current_team
class SubscriptionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.SubscriptionSerializer
    permission_classes = (IsAuthenticatedTeam,)
    pagination_class = None

    def get_queryset(self):
        return self.request.current_team.subscriptions.order_by("-created_at")

    @action(
        detail=False,
        methods=["get"],
        url_path="current",
        url_name="current",
        permission_classes=[IsAuthenticatedTeam],
    )
    def current(self, request, pk=None):
        service = TeamPlanService(request.current_team)
        return Response(serializers.TeamPlanSerializer(service).data)

    @action(
        detail=False,
        methods=["post"],
        url_path="start",
        url_name="start",
        permission_classes=[IsAuthenticated, IsAuthenticatedTeam, IsEnterpriseMode],
        serializer_class=serializers.StartSubscriptionSerializer,
    )
    def start(self, request):
        serializer = serializers.StartSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan = serializer.validated_data["plan_uuid"]  # type: Plan

        if not plan.is_default:
            url = StripeService().start_payment(plan, request.current_team)
            return Response({"redirect_url": url})

        if not request.current_team.is_default:
            raise PermissionDenied(_("You cannot start freemium plan for this team"))

        StripeService().start_freemium_plan(plan, request.current_team)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=False,
        methods=["delete"],
        url_path="cancel",
        url_name="cancel",
        permission_classes=[IsAuthenticated, IsAuthenticatedTeam, IsEnterpriseMode],
    )
    def cancel(self, request):
        immediately = request.data.get("immediately", False)
        service = StripeService()
        if immediately:
            service.cancel_subscription_immediately(request.current_team)
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(
            data={"redirect_url": service.cancel_subscription(request.current_team)}
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="renew",
        url_name="renew",
        permission_classes=[IsAuthenticated, IsAuthenticatedTeam, IsEnterpriseMode],
        serializer_class=None,
    )
    def renew(self, request):
        service = StripeService()
        service.renew_subscription(request.current_team)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=False,
        methods=["post"],
        url_path="manage-subscription",
        url_name="manage-subscription",
        permission_classes=[IsAuthenticated, IsAuthenticatedTeam, IsEnterpriseMode],
        serializer_class=None,
    )
    def customer_session(self, request):
        service = StripeService()
        return Response(
            {"redirect_url": service.manage_subscription(request.current_team)}
        )


@extend_schema_view(
    post=extend_schema(
        summary=_("Handle Stripe webhooks"),
        description=_(
            "Processes webhook events from Stripe for subscription and payment updates."
        ),
        tags=["Webhooks"],
        responses={204: None},
    )
)
class StripeWebhookView(APIView):
    authentication_classes = (StripeSignatureAuthentication,)
    permission_classes = ()
    serializer_class = serializers.StripeWebhookSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        stripe_service = StripeService()
        stripe_service.handle_webhook_event(request.data)
        return Response(status=status.HTTP_204_NO_CONTENT)
