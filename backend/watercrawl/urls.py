"""
URL configuration for watercrawl project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path
from django.urls.conf import include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

from common.views import TeamSchemaView, home_page

urlpatterns = [

    path("", home_page),
    path("admin/", admin.site.urls),
    # YOUR PATTERNS
    path("api/schema/team/", TeamSchemaView.as_view(), name="team_schema"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    # Optional UI:
    path("api/schema/swagger-ui/", SpectacularSwaggerView.as_view(), name="swagger-ui"),
    path("api/schema/redoc/", SpectacularRedocView.as_view(), name="redoc"),
    path("api/v1/user/", include("user.urls")),
    path("api/v1/common/", include("common.urls")),
    path("api/v1/core/", include("core.urls")),
    path("api/v1/plan/", include("plan.urls")),
]
