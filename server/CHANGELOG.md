# Changelog

All notable changes to the Cryptians P2P Marketplace Backend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- WebSocket implementation for real-time chat
- BullMQ job queues for background tasks
- Complete API endpoints for all features
- Swagger/OpenAPI documentation
- Integration tests
- Performance benchmarking

## [0.1.0] - 2025-12-02

### Added

#### Infrastructure
- Complete folder structure with 40+ directories
- Environment configuration with database abstraction (MongoDB/AWS DocumentDB)
- Winston logging infrastructure with file rotation
- Redis integration for caching and rate limiting
- Docker containerization with docker-compose
- PM2 cluster mode configuration
- Graceful shutdown handling

#### Database Models
- User model with embedded review system
- KYC model for document verification
- Listing model for sell orders
- Trade model for P2P trade lifecycle
- Chat and Message models for communication
- Payment model for INR payment proofs
- Dispute model for conflict resolution
- EscrowTransaction model for blockchain tracking
- Notification model for user alerts
- AuditLog model for security auditing

#### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC) middleware
- Permission-based route protection
- 7 user roles (Buyer, Seller, Instant Seller, Support, Support Manager, Admin, Super Admin)

#### Validation
- Joi validation middleware
- 7 comprehensive validator modules
- Multi-language error messages (English & Hindi)
- Parameter interpolation in error messages

#### Security
- Helmet security headers
- CORS configuration
- Rate limiting with Redis backend
- Input sanitization
- Password hashing with bcrypt
- XSS protection

#### Services
- Authentication service
- Fee calculator service with dynamic pricing
- Price feed service (Binance → CoinGecko fallback)
- Notification service
- Audit logging service

#### Constants
- User roles and permissions matrix
- Status enums (Account, KYC, Listing, Trade, Payment, Dispute, Escrow)
- Error codes with HTTP status mappings
- HTTP status code constants

#### Internationalization (i18n)
- Multi-language error messaging system
- English and Hindi translations
- Language detection middleware
- Parameter interpolation support

#### Documentation
- Comprehensive README with setup instructions
- Detailed DEPLOYMENT guide
- DEVELOPMENT guide for contributors
- CHANGELOG template
- Environment variable documentation

#### Middleware
- Request validation middleware
- Authentication middleware
- RBAC authorization middleware
- Rate limiting middleware (8 different configurations)
- Error handling middleware
- Language detection middleware

#### Utilities
- Custom ApiError classes with i18n support
- ApiResponse formatter
- Async handler wrapper
- Structured logging with Winston
- Helper functions

### Technical Details
- **Language**: JavaScript (ES Modules)
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: MongoDB (dev) / AWS DocumentDB (prod)
- **Cache**: Redis 7+
- **Validation**: Joi
- **Logger**: Winston with daily-rotate-file
- **Process Manager**: PM2
- **Container**: Docker & Docker Compose

## Release Notes Template

### [Version] - YYYY-MM-DD

#### Added
- New features and functionality

#### Changed
- Changes to existing functionality

#### Deprecated
- Features that will be removed in upcoming releases

#### Removed
- Removed features

#### Fixed
- Bug fixes

#### Security
- Security improvements and patches

---

## Version History

### Version Numbering

We use Semantic Versioning (SemVer):
- **MAJOR** version: Incompatible API changes
- **MINOR** version: Backwards-compatible functionality additions
- **PATCH** version: Backwards-compatible bug fixes

Example: `1.2.3`
- 1 = Major version
- 2 = Minor version
- 3 = Patch version

### Release Types

- **Alpha**: Internal testing, unstable
- **Beta**: External testing, feature complete
- **RC (Release Candidate)**: Final testing before production
- **Stable**: Production-ready release

---

## Migration Guide

### From 0.1.0 to Future Versions

Migration instructions will be added here when new versions are released.

---

## Contributors

- Initial backend architecture and implementation: Development Team

---

## Links

- [GitHub Repository](https://github.com/your-org/cryptians-backend)
- [Issue Tracker](https://github.com/your-org/cryptians-backend/issues)
- [Documentation](https://docs.cryptians.com)
