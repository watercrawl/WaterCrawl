# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2025-04-29

### Added
- Added complete web search functionality with advanced filtering options
- Created SearchRequest model, serializers, and API endpoints
- Implemented search services and task handlers
- Added usage tracking for search requests with credit consumption
- Integrated Google Custom Search API for more reliable and compliant search results
- Added configuration system for Google API credentials (API Key and CSE ID)
- Implemented comprehensive setup instructions in UI for search configuration
- Added searchable language and country dropdown menus in search form
- Added real-time search status monitoring
- Added credit usage tracking for different search depths

### Changed
- Simplified SettingsProvider by removing version compatibility checks
- Refactored dashboard navigation structure with collapsible menu items
- Enhanced search form UI with clear buttons for dropdown selections
- Updated API documentation with search parameters and examples
- Updated Docker configuration to support search functionality

### Fixed
- Fixed TypeScript errors in frontend components
- Enhanced component structure for better maintainability

## [0.6.0] - 2025-04-19

### Added
- Unified Docker build workflow for backend, frontend, and docs
- Manual version bump and release PR workflow for GitHub Actions
- Enhanced sitemap visualization and markdown export

### Changed
- Improved error handling and PR creation in CI workflows
- Improved deployment infrastructure with dynamic Nginx config for MinIO buckets
- Enhanced API docs UI and added code examples (Go/Node/Python)
- Refactored hooks and improved API documentation rendering

### Fixed
- Security audit issues and dependency updates
- Build issues and minor fixes

### Docs
- Updated CONTRIBUTING.md with correct file paths and commands


## [0.5.0] - 2025-04-19

### Added
- Monorepo structure for backend (Django) and frontend (React, Vite)
- PR linting workflow for backend (Ruff) and frontend (ESLint) code quality checks
- Downloadable and viewable sitemap visualization system
- Contribution guidelines and GitHub templates
- Enhanced README with badges and emojis 🎨
- Invitation-based user registration

### Changed
- Improved Docker configurations and documentation
- Enhanced mono-repo tooling and developer experience
- Enable MinIO consistency check on startup
- Update project configuration and documentation 🔧
- Improved Docker setup and documentation

### Fixed
- Add `packageManager` to `package.json`
- Fix Docker build warning
- Update dependencies to address multiple vulnerabilities

### Docs
- Move documentation from another repo to this repo

#### PRs
- Feature/mono repo by @amirasaran in #5
- Add PR linting workflow and improve Docker configurations by @amirasaran in #6
- fix: add packageManager to package json by @amirasaran in #7
- fix: fix docker build warning by @amirasaran in #8
- docs: move documentations from another repo to this repo by @amirasaran in #9
- docs: add contribution guidelines and GitHub templates by @amirasaran in #10
- docs: enhance README with badges and emojis 🎨 by @amirasaran in #11
- chore: update project configuration and documentation 🔧 by @amirasaran in #12
- Feature: Mono-repo Enhancements by @amirasaran in #13
- docs(docker): improve docker setup and documentation by @amirasaran in #16
- chore: Enable MinIO consistency check on startup by @amirasaran in #17
- fix(security): update dependencies to address multiple vulnerabilities by @amirasaran in #18
- feat: implement invitation-based user registration by @amirasaran #21

## [0.4.0] - 2025-03-20

### Added
- Pagination support with customizable page size (25 default, max 100)
- Added filtering capabilities for crawl requests by UUID, URL, status, and date
- Added filtering for crawl results by URL and creation date
- Support for multiple output formats in download endpoint (markdown, json)
- New serializer for full crawl results with prefetching option
- New common pagination module for consistent pagination across the API

### Changed
- Enhanced API documentation with detailed query parameters
- Improved filtering capabilities with advanced filters (contains, startswith, greater than, less than)
- Updated API endpoints to support prefetched result data
- Modified download endpoint to return zip files with formatted content
- Updated crawl status checking to support prefetched results

## [0.3.3] - 2025-02-11

### Changed
- Updated user models, serializers, and services
- Modified common serializers and services
- Updated project settings and version

### Added
- New user migration for newsletter and privacy confirmation

## [0.3.2] - 2025-02-09

### Added
- Automated daily page credit reset for active subscriptions
- Celery beat schedule for running daily tasks

## [0.3.1] - 2025-02-09

### Fixed
- Removed custom billing cycle anchor from Stripe checkout to fix subscription timing issues
- Simplified Stripe checkout session configuration for better compatibility
- Fixed Stripe webhook handling for default plan subscriptions

## [0.3.0] - 2025-02-09

### Added
- Team plan management system with Stripe integration
- Usage tracking and plan-based limits
- Enterprise mode configuration
- Resend email verification endpoint
- Comprehensive admin panel for User, Team, TeamMember, and API key management
- Unique email constraint with case-insensitive lookups
- Plan-based crawl request validation
- Usage history tracking
- Stripe webhook handling for subscription management

### Changed
- Enhanced user authentication system
- Improved email templates (removed emojis, simplified text)
- Added translations for user-facing messages
- Better spider include/exclude paths handling
- Updated admin interface with improved filters and search
- Enhanced team member management
- Improved error handling and validation messages

### Fixed
- Spider options handling for include/exclude paths
- Email verification and authentication issues
- Case-sensitive email lookup issues
- Team member invitation process

### Security
- Added unique email constraint
- Improved API key management
- Enhanced authentication validation

## [0.2.1] - 2025-01-21

### Added
- New `TeamSchemaView` for dedicated team API documentation
- Custom schema generator for filtering team-specific endpoints
- Separate documentation files for better organization
- Tags for all API endpoints:
  - Auth
  - Profile
  - Team
  - API Key
  - Crawl Requests
  - Crawl Results
  - Reports
  - Plugins
  - Common
- Token refresh and verify views with proper documentation
- Theme customization for documentation UI

### Changed
- Moved API documentation strings to dedicated files
- Improved endpoint descriptions and documentation structure
- Updated API key authentication to track last used timestamp
- Enhanced schema security configuration
- Reorganized URL patterns for better documentation access
- Updated settings for better API documentation title and description
- Changed "Get the current team" to "Get/Update the current team" for clarity

### Fixed
- API key authentication display in ReDoc
- Documentation organization and endpoint grouping
- Swagger UI and ReDoc configuration
- Unused imports and code cleanup

### Removed
- Redundant schema URL configuration
- Unused plan URLs
- Manual operation sorting in favor of tag-based organization

## [0.2.0] - 2025-01-15

### Added
- Integrated Playwright for dynamic page rendering and JavaScript execution
- Support for PDF and Screenshot attachments for crawl results
- Advanced page interaction options (wait time, cookie acceptance, locale settings)
- Improved Docker build process with multi-platform support
- Added API version endpoint
- Extended crawler options with timeout, cookies, locale, and headers support
- Duration tracking for crawl requests
- Support for longer URLs (up to 2048 characters)

### Changed
- Enhanced page rendering with Playwright middleware
- Improved JavaScript handling and dynamic content extraction
- Enhanced Docker workflow with better caching and versioning
- Improved domain handling in spider options
- Updated concurrent request settings
- Better organization of crawler constants and types

### Infrastructure
- Added multi-platform Docker builds (linux/amd64, linux/arm64)
- Improved Docker caching and build optimization
- Added version tracking in Docker builds

## [0.1.1] - 2024-12-25

### Changed
- Fixed dependency versions in requirements.txt

## [0.1.0] - 2024-12-25

### Added
- Plugin service for managing crawl plugins
- Plugin schema API endpoint
- Active plugins loader utility
- Dynamic middleware and pipeline loading for plugins

### Changed
- Updated watercrawl-plugin to version 0.1.0
- Updated watercrawl-openai to version 0.1.0
- Improved spider middleware configuration
- Enhanced plugin system architecture

## [0.0.2] - 2024-12-19

### Added
- Email service for sending templated emails
- Frontend settings service for managing UI configurations
- OAuth integration with GitHub and Google
- Password reset functionality with email notifications
- Email verification system
- Team invitation system improvements
- New user templates for email communications

### Changed
- Enhanced user authentication system
- Improved team management functionality
- Updated permission system with login and signup controls
- Modified team invitation workflow
- Restructured common services and views

### Dependencies
- Added html2text for email template processing

[0.0.2]: https://github.com/watercrawl/watercrawl/releases/tag/0.0.2

## [0.0.1] - 2024-12-16

### Added
- Initial release of WaterCrawl
- Core web crawling functionality using Scrapy (v2.12.0)
- Django-based web application (v5.1.4)
- REST API using Django REST Framework (v3.15.2)
- Asynchronous task processing with Celery (v5.4.0)
- Redis integration for task queue management
- MinIO integration for file storage
- User authentication and authorization system
- OpenAI integration capabilities
- Docker support with multi-container setup
- Swagger/OpenAPI documentation using drf-spectacular

### Features
- Web page crawling and data extraction
- Asynchronous task management
- User management system
- API documentation
- Containerized deployment support
- Scalable architecture with separate services
- Database integration with PostgreSQL
- File storage system using MinIO
- Celery beat for scheduled tasks

### Dependencies
- Python 3.11+
- Django 5.1.4
- Scrapy 2.12.0
- Celery 5.4.0
- Redis (latest)
- PostgreSQL 17.2
- Nginx
- GunicornWSGI server
- MinIO (optional, can use S3 or local storage)
- Additional dependencies listed in requirements.txt

### Infrastructure Components
- Web Application Server (Gunicorn)
- Celery Worker with Beat Scheduler
- Nginx Web Server
- PostgreSQL Database
- Redis for Caching and Message Broker
- MinIO/S3 for Object Storage (optional)

[0.0.1]: https://github.com/watercrawl/watercrawl/releases/tag/0.0.1
