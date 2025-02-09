# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2025-02-09

### Fixed
- Removed custom billing cycle anchor from Stripe checkout to fix subscription timing issues
- Simplified Stripe checkout session configuration for better compatibility

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
