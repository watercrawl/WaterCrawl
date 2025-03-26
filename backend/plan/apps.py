from django.apps import AppConfig


class PlanConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'plan'

    def ready(self):
        from plan import signals
