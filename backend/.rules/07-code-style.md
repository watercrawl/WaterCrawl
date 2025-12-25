# Code Style and Conventions

## Python Style (PEP 8 + Django)

### Imports Order
```python
# 1. Standard library
import json
from datetime import timedelta

# 2. Third-party
from django.db import models
from rest_framework.viewsets import GenericViewSet

# 3. Local
from common.models import BaseModel
from .services import MyService
```

### Naming
- Classes: `PascalCase`
- Functions/methods: `snake_case`
- Constants: `UPPER_SNAKE_CASE`
- Variables: `snake_case`

### Translations
```python
from django.utils.translation import gettext_lazy as _

# In models
verbose_name = _("Title")

# In views/services
from django.utils.translation import gettext as _
raise ValidationError(_("Invalid input"))
```

## Django Conventions

### Model Field Ordering
```python
class MyModel(BaseModel):
    # 1. Fields
    name = models.CharField(max_length=255)
    team = models.ForeignKey("user.Team", on_delete=models.CASCADE)
    
    # 2. Meta
    class Meta:
        verbose_name = _("My Model")
    
    # 3. __str__
    def __str__(self):
        return self.name
    
    # 4. Properties
    @property
    def is_active(self):
        return self.status == consts.STATUS_ACTIVE
```

### QuerySet Best Practices
```python
# ✅ Chain on separate lines
queryset = (
    MyModel.objects
    .filter(team=team)
    .select_related("team")
    .order_by("-created_at")
)

# ✅ Use exists() for boolean
if MyModel.objects.filter(name=name).exists():
    pass

# ✅ Use first() not [0]
item = queryset.first()
```

## Critical Rules

- ✅ Always inherit from `BaseModel`
- ✅ Always add `team` FK for multi-tenant
- ✅ Always use `@setup_current_team` decorator
- ✅ Always filter by `request.current_team`
- ✅ Use Service classes for business logic
- ✅ Use Factory classes for object creation
- ✅ Translate all user-facing text
- ✅ Use type hints
