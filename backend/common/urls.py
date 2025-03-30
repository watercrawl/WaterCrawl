from django.urls import path
from .views import SettingAPIView

urlpatterns = [
    path("settings/", SettingAPIView.as_view(), name="settings"),
]
