# Models and Services Pattern

## The WaterCrawl Way: Thin Models, Fat Services

### Core Principle
**Models are data containers. Services contain business logic.**

## Model Design Rules

### 1. Always Inherit from BaseModel

```python
from common.models import BaseModel

class MyModel(BaseModel):
    """BaseModel provides:
    - uuid: UUIDField (primary key)
    - created_at: DateTimeField
    - updated_at: DateTimeField
    """
    name = models.CharField(max_length=255)
    team = models.ForeignKey("user.Team", on_delete=models.CASCADE)
```

**Why?**
- Consistent primary keys across all tables
- Automatic timestamp tracking
- UUID prevents ID enumeration attacks

### 2. Multi-Tenant Pattern: Always Add Team FK

```python
class MyResource(BaseModel):
    # ✅ REQUIRED: Every resource must belong to a team
    team = models.ForeignKey(
        "user.Team",
        on_delete=models.CASCADE,
        verbose_name=_("Team"),
        related_name="my_resources",  # Descriptive related name
    )
    
    # Optional: Allow global resources with nullable team
    team = models.ForeignKey(
        "user.Team",
        on_delete=models.CASCADE,
        null=True,  # Global resource if null
        blank=True,
    )
```

**Exceptions:**
- `User` model (users belong to teams via many-to-many)
- `Team` model itself
- Global configuration models

### 3. Use Proper Field Types and Translations

```python
from django.utils.translation import gettext_lazy as _

class MyModel(BaseModel):
    # ✅ Use verbose_name with translation
    title = models.CharField(
        verbose_name=_("Title"),
        max_length=255,
    )
    
    # ✅ Use choices with constants
    status = models.CharField(
        verbose_name=_("Status"),
        choices=consts.STATUS_CHOICES,
        default=consts.STATUS_ACTIVE,
        max_length=20,
    )
    
    # ✅ JSONField for flexible data
    options = models.JSONField(
        verbose_name=_("Options"),
        default=dict,  # ⚠️ Use dict, not {}
    )
    
    # ✅ Use help_text for complex fields
    chunk_size = models.PositiveIntegerField(
        verbose_name=_("Chunk size"),
        help_text=_("Number of tokens per chunk"),
        default=1024,
    )
```

### 4. Define Meta Options

```python
class MyModel(BaseModel):
    class Meta:
        verbose_name = _("My Model")
        verbose_name_plural = _("My Models")
        ordering = ["-created_at"]  # Default ordering
        unique_together = [("team", "name")]  # Unique per team
```

### 5. Add Computed Properties (Not Methods)

```python
class Agent(BaseModel):
    @cached_property  # ✅ Cache expensive queries
    def current_published_version(self):
        return self.versions.filter(
            status=consts.AGENT_VERSION_STATUS_PUBLISHED
        ).first()
    
    @property  # ✅ Simple computed value
    def is_active(self):
        return self.current_published_version is not None
```

**Rules:**
- Use `@property` for simple calculations
- Use `@cached_property` for database queries
- Never perform business logic in properties

### 6. Override save() Only for Data Validation

```python
class KnowledgeBaseDocument(BaseModel):
    def save(self, *args, **kwargs):
        # ✅ OK: Auto-generate title from content
        if not self.title:
            self.title = self.content[:50]
        super().save(*args, **kwargs)
        
        # ❌ WRONG: Don't call external services
        # self.generate_embeddings()  # This belongs in a service!
```

## Service Design Pattern

### 1. Service Class Structure

```python
class MyResourceService:
    """Service for managing MyResource business logic."""
    
    def __init__(self, resource: MyResource):
        """Always initialize with a model instance."""
        self.resource = resource
    
    # Factory Methods (Class Methods)
    
    @classmethod
    def make_with_pk(cls, pk: str) -> "MyResourceService":
        """Fetch resource by primary key."""
        return cls(MyResource.objects.get(pk=pk))
    
    @classmethod
    def make_with_team_and_name(cls, team: Team, name: str):
        """Fetch by custom criteria."""
        return cls(MyResource.objects.get(team=team, name=name))
    
    @classmethod
    def create_resource(cls, team: Team, **kwargs) -> "MyResourceService":
        """Create new resource."""
        resource = MyResource.objects.create(team=team, **kwargs)
        return cls(resource)
    
    # Business Logic Methods (Instance Methods)
    
    def process(self):
        """Perform business operation."""
        # Update model
        self.resource.status = consts.STATUS_PROCESSING
        self.resource.save(update_fields=["status"])
        
        # Call external services
        self._send_notification()
        
        # Dispatch async task
        from .tasks import process_resource_task
        process_resource_task.apply_async(
            kwargs={"resource_pk": self.resource.pk}
        )
    
    def _send_notification(self):
        """Private helper method."""
        EmailService().set_subject("Processing started").send()
```

### 2. Service Method Patterns

#### Creation Pattern
```python
@classmethod
def create_with_defaults(cls, team: Team, name: str):
    """Create resource with default configuration."""
    resource = MyResource.objects.create(
        team=team,
        name=name,
        config={
            "timeout": 15000,
            "retry_count": 3,
        }
    )
    
    # Create related objects
    resource.api_keys.create(name="Default")
    
    return cls(resource)
```

#### Update Pattern
```python
def update_config(self, new_config: dict):
    """Update resource configuration."""
    # Validate
    self._validate_config(new_config)
    
    # Update
    self.resource.config.update(new_config)
    self.resource.save(update_fields=["config", "updated_at"])
    
    # Side effects
    self._invalidate_cache()
    
    return self
```

#### Deletion Pattern
```python
def soft_delete(self):
    """Soft delete (set status to archived)."""
    self.resource.status = consts.STATUS_ARCHIVED
    self.resource.save(update_fields=["status"])
    
    # Cleanup
    self._revoke_pending_tasks()
    
    return self

def hard_delete(self):
    """Permanently delete."""
    resource_pk = self.resource.pk
    
    # Cleanup first
    self._delete_related_files()
    
    # Delete
    self.resource.delete()
    
    # Log
    logger.info(f"Deleted resource {resource_pk}")
```

### 3. Service Dependencies

```python
class CrawlerService:
    def __init__(self, crawl_request: CrawlRequest):
        self.crawl_request = crawl_request
        
        # ✅ Inject dependent services
        self.proxy_service = ProxyService.get_proxy_for_crawl_request(
            crawl_request
        )
        self.pubsub_service = CrawlPupSupService(crawl_request)
        self.config_helpers = CrawlHelpers(crawl_request)
    
    def run(self):
        """Services orchestrate other services."""
        # Update status
        self.crawl_request.status = consts.CRAWL_STATUS_RUNNING
        self.crawl_request.save()
        
        # Notify via pub/sub
        self.pubsub_service.send_status("state")
        
        # Execute crawl with proxy
        subprocess.run([
            "scrapy", "crawl", "SiteScrapper",
            f"--proxy={self.proxy_service.proxy_url}",
        ])
```

### 4. Cached Properties in Services

```python
class CrawlHelpers:
    def __init__(self, crawl_request: CrawlRequest):
        self.crawl_request = crawl_request
    
    @cached_property
    def allowed_domains(self):
        """Parse and cache allowed domains."""
        domains = self.crawl_request.options.get(
            "spider_options", {}
        ).get("allowed_domains", [])
        
        if not domains:
            parsed = urlparse(self.crawl_request.url)
            domain = parsed.netloc
            if domain.startswith("www."):
                domain = domain[4:]
            domains = [f"*.{domain}", domain]
        
        return domains
    
    @cached_property
    def include_html(self):
        """Extract and cache config option."""
        return self.crawl_request.options.get(
            "page_options", {}
        ).get("include_html", False)
```

## Real-World Examples

### Example 1: TeamService

```python
class TeamService:
    def __init__(self, team: Team):
        self.team = team
    
    @classmethod
    def create_team(cls, user: User, name: str = None, is_owner=True):
        """Create team with owner."""
        if not name:
            name = cls.default_team_name(user.email)
        
        team = Team.objects.create(name=name)
        
        # Create default API key
        APIKeyService.create_api_key(team)
        
        # Add user as member
        return cls(team).add_user(user, is_owner)
    
    @classmethod
    def create_or_get_default_team(cls, user: User):
        """Atomic team creation with Redis lock."""
        with redis_lock(f"create_or_get_default_team_{user.pk}"):
            team = user.teams.first()
            if team:
                return cls(team)
            return cls.create_team(user, is_owner=True)
    
    def add_user(self, user: User, is_owner=False):
        """Add user to team."""
        self.team.team_members.create(user=user, is_owner=is_owner)
        return self
    
    def invite(self, email: str):
        """Send team invitation."""
        if self.team.members.filter(email__iexact=email).exists():
            raise ValidationError(_("User already in team"))
        
        invitation = self.team.invitations.update_or_create(
            email=email,
            defaults={"activated": False}
        )
        
        # Send email via service
        TeamInvitationService(invitation).send_invitation_email()
        
        return invitation
```

### Example 2: CrawlerService

```python
class CrawlerService:
    def __init__(self, crawl_request: CrawlRequest):
        self.crawl_request = crawl_request
        self.proxy_service = ProxyService.get_proxy_for_crawl_request(
            crawl_request
        )
        self.pubsub_service = CrawlPupSupService(crawl_request)
    
    @classmethod
    def make_with_urls(cls, urls: list[str], team: Team, 
                       spider_options=None, page_options=None):
        """Create crawl request from URLs."""
        crawl_request = CrawlRequest.objects.create(
            team=team,
            urls=urls,
            crawl_type=consts.CRAWL_TYPE_BATCH if len(urls) > 1 
                       else consts.CRAWL_TYPE_SINGLE,
            options={
                "spider_options": spider_options or {},
                "page_options": page_options or {},
            }
        )
        return cls(crawl_request)
    
    def run(self):
        """Execute crawl."""
        self.crawl_request.status = consts.CRAWL_STATUS_RUNNING
        self.crawl_request.save()
        self.pubsub_service.send_status("state")
        
        subprocess.run(
            ["scrapy", "crawl", "SiteScrapper", 
             "-a", f"crawl_request_uuid={self.crawl_request.pk}"],
            cwd=settings.BASE_DIR
        )
    
    def stop(self):
        """Cancel running crawl."""
        self.crawl_request.status = consts.CRAWL_STATUS_CANCELING
        self.crawl_request.save()
        
        # Revoke Celery task
        from watercrawl.celery import app
        app.control.revoke(str(self.crawl_request.uuid), terminate=True)
        
        self.crawl_request.status = consts.CRAWL_STATUS_CANCELED
        self.crawl_request.save()
```

## Anti-Patterns to Avoid

### ❌ Business Logic in Models
```python
# WRONG
class CrawlRequest(BaseModel):
    def start_crawl(self):
        self.status = consts.CRAWL_STATUS_RUNNING
        self.save()
        subprocess.run(["scrapy", ...])  # Don't do this!
```

### ❌ Business Logic in Views
```python
# WRONG
class CrawlRequestView(GenericViewSet):
    def create(self, request):
        crawl = CrawlRequest.objects.create(...)
        crawl.status = "running"  # Don't do this!
        subprocess.run(["scrapy", ...])  # Don't do this!
```

### ✅ Correct: Use Services
```python
# CORRECT
class CrawlRequestView(GenericViewSet):
    def perform_create(self, serializer):
        instance = serializer.save(team=self.request.current_team)
        
        # Service handles all business logic
        run_spider.apply_async(
            kwargs={"crawl_request_pk": instance.pk}
        )
```

## Summary Checklist

- [ ] Model inherits from `BaseModel`
- [ ] Model has `team` foreign key (if team-scoped)
- [ ] Model fields use `verbose_name` with translations
- [ ] Model has proper `Meta` class
- [ ] Constants defined in `consts.py`
- [ ] Service class created with same name + "Service"
- [ ] Service initialized with model instance
- [ ] Factory methods are `@classmethod`
- [ ] Business logic in service, not model/view
- [ ] Service methods return `self` for chaining
- [ ] Related objects created in service, not model
- [ ] External calls happen in service, not model
