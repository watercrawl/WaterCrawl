# WaterCrawl Backend Architecture Overview

## Project Identity
- **Name**: WaterCrawl
- **Version**: 0.12.0
- **Type**: Django-based web crawling platform with LLM integration
- **Python**: >=3.13,<4
- **Framework**: Django 5.2.8 + Django REST Framework 3.15.2

## Core Technology Stack
- **Web Framework**: Django 5.2.8 with DRF
- **Database**: PostgreSQL (via psycopg2-binary)
- **Cache/Queue**: Redis 5.2.1
- **Task Queue**: Celery 5.4.0 with django-celery-beat
- **Crawling**: Scrapy 2.13.3 + Playwright (scrapy-splash)
- **LLM Framework**: LangChain (langchain-core, langchain-openai, langchain-community)
- **Vector Store**: OpenSearch (opensearch-py)
- **Storage**: MinIO (django-minio-backend)
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Payments**: Stripe
- **Monitoring**: Sentry

## Application Architecture

### Layered Architecture Pattern
```
┌─────────────────────────────────────┐
│         Views Layer (API)           │  ← DRF ViewSets, @decorators
├─────────────────────────────────────┤
│       Services Layer (Logic)        │  ← Business logic, orchestration
├─────────────────────────────────────┤
│      Factories Layer (Creation)     │  ← Object creation, configuration
├─────────────────────────────────────┤
│       Models Layer (Data)           │  ← Django ORM, database schema
├─────────────────────────────────────┤
│    External Systems (Integrations)  │  ← Scrapy, Celery, Redis, LLMs
└─────────────────────────────────────┘
```

### Module Organization

```
backend/
├── watercrawl/          # Django project settings
├── common/              # Shared utilities, BaseModel
├── user/                # Authentication, teams, API keys
├── core/                # Web crawling, search, sitemaps
├── agent/               # AI agents with tools & conversations
├── llm/                 # LLM provider management
├── knowledge_base/      # Document ingestion, embeddings, RAG
├── plan/                # Subscriptions, billing, usage tracking
└── spider/              # Scrapy crawling engine
```

## Key Architectural Principles

### 1. Multi-Tenant Architecture
- **Every resource belongs to a Team**
- Team isolation via `team` foreign key on all models
- Automatic team filtering in views via `request.current_team`
- Supports both JWT + Team ID header and API key authentication

### 2. Service Object Pattern
- **All business logic lives in Service classes**
- Models are thin (data containers only)
- Services are instantiated with model instances
- Factory methods for creation (`make_with_pk`, `create_team`, etc.)

### 3. Factory Pattern for Object Creation
- Factories create complex objects (LLM models, embeddings, text splitters)
- Configuration-driven creation
- Easy to extend with new providers
- Centralized instantiation logic

### 4. Real-Time Updates via Redis Pub/Sub
- Celery tasks publish events to Redis channels
- Views stream events via Server-Sent Events (SSE)
- Pattern: `{resource_type}:{uuid}` channel naming

### 5. Async Processing with Celery
- Long-running operations (crawling, embeddings) run in Celery
- Task IDs match resource UUIDs for tracking
- Redis as message broker and result backend

## Request Flow Example

```
1. Client → POST /api/v1/core/crawl-requests/
   Headers: Authorization: Bearer <JWT>, X-Team-ID: <uuid>

2. Middleware → @setup_current_team decorator
   → Sets request.current_team from X-Team-ID or X-API-Key

3. View → CrawlRequestView.create()
   → Validates with serializer
   → perform_create() saves with team=request.current_team
   → Dispatches Celery task

4. Celery Worker → run_spider(crawl_request_pk)
   → CrawlerService.run() executes Scrapy subprocess
   → Publishes events to Redis channel

5. Client ← GET /api/v1/core/crawl-requests/{uuid}/status/
   → SSE stream yields events from Redis Pub/Sub
   → Real-time updates as crawl progresses
```

## Module Responsibilities

| Module | Purpose | Key Models | Key Services |
|--------|---------|------------|--------------|
| **user** | Auth & teams | User, Team, TeamMember, TeamAPIKey | UserService, TeamService, APIKeyService |
| **core** | Web operations | CrawlRequest, SearchRequest, SitemapRequest | CrawlerService, SearchService, SitemapService |
| **agent** | AI agents | Agent, AgentVersion, Tool, Conversation | (To be implemented) |
| **llm** | LLM configs | LLMModel, ProviderConfig, EmbeddingModel | ChatModelFactory, ProviderFactory |
| **knowledge_base** | RAG system | KnowledgeBase, Document, Chunk | TextSplitterFactory, EmbedderFactory |
| **plan** | Billing | Plan, Subscription, Usage | SubscriptionService, UsageService |
| **common** | Shared code | BaseModel | EmailService, FrontendSettingService |

## Development Guidelines

### When Adding New Features
1. **Create models** in appropriate app's `models.py`
2. **Create service class** in `services.py` with business logic
3. **Create serializers** in `serializers.py` for API representation
4. **Create views** in `views.py` using DRF ViewSets
5. **Register URLs** in app's `urls.py`
6. **Add permissions** using `IsAuthenticatedTeam` or custom
7. **Create Celery tasks** in `tasks.py` if async needed
8. **Add tests** in `tests.py`

### Critical Rules
- ✅ **ALWAYS** use `BaseModel` for new models (provides UUID, timestamps)
- ✅ **ALWAYS** add `team` foreign key for multi-tenant resources
- ✅ **ALWAYS** use Service classes for business logic
- ✅ **NEVER** put business logic in models or views
- ✅ **ALWAYS** use `@setup_current_team` decorator on team-scoped views
- ✅ **ALWAYS** filter by `request.current_team` in querysets
- ✅ **ALWAYS** use factory classes for complex object creation

## Naming Conventions
- Models: `PascalCase` (e.g., `CrawlRequest`, `AgentVersion`)
- Services: `PascalCase` ending in `Service` (e.g., `CrawlerService`)
- Factories: `PascalCase` ending in `Factory` (e.g., `ChatModelFactory`)
- Views: `PascalCase` ending in `View` or `ViewSet`
- URLs: `kebab-case` (e.g., `crawl-requests`, `api-keys`)
- Python files: `snake_case` (e.g., `services.py`, `factories.py`)
