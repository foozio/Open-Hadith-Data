# 📋 Changelog

All notable changes to the Open-Hadith-Data API project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.4.0] - 2025-08-24 📦 Data File Splitting Solution & GitHub Compatibility

### Added
- **Data File Splitting System**
  - Created `scripts/split-data.js` for processing large JSON files
  - Generated 9 collection-specific JSON files (all under 100MB)
  - Added `collections-manifest.json` for tracking and validation
  - Implemented comprehensive file size and hadith count statistics

- **Enhanced Data Loading Architecture**
  - New `enhanced-data-loader.js` with dual-mode support
  - Auto-detection of split files vs unified data format
  - Backward compatibility with original hadith-data.json
  - Improved error handling and detailed loading statistics
  - Memory usage optimization (230MB for 124K+ hadiths)

- **GitHub-Compatible File Structure**
  - Split large dataset into manageable chunks:
    - maliks_muwataa.json (2.48MB, 3,188 hadiths)
    - sahih_al_bukhari.json (15.11MB, 14,016 hadiths)
    - sahih_muslim.json (13.72MB, 10,724 hadiths)
    - sunan_abu_dawud.json (9.76MB, 9,180 hadiths)
    - sunan_al_nasai.json (10.19MB, 11,324 hadiths)
    - sunan_al_tirmidhi.json (10.38MB, 7,782 hadiths)
    - sunan_ibn_maja.json (7.37MB, 8,664 hadiths)
    - sunan_al_darimi.json (5.12MB, 6,734 hadiths)
    - musnad_ahmad_ibn_hanbal.json (47.43MB, 52,726 hadiths)

### Changed
- **Data Loading Performance**
  - Load time: 850-1200ms for complete dataset
  - Method transparency: logs show "split-files" vs "unified-file"
  - Enhanced logging with collection-by-collection progress
  - Maintained API interface compatibility

- **Repository Structure**
  - Moved large hadith-data.json to backup location
  - Updated .gitignore to exclude backup files
  - Added data/collections/ directory with organized files
  - Preserved all 124,338 hadiths with full metadata

### Fixed
- **GitHub File Size Limitations**
  - Resolved 125MB+ file upload issues to GitHub forks
  - Eliminated need for Git LFS on public fork repositories
  - All collection files now well under GitHub's 100MB limit
  - Successful git commits without size-related errors

### Technical
- ✅ Automatic fallback system (split files → unified file)
- ✅ Data integrity verification (124,338 hadiths preserved)
- ✅ API endpoint compatibility maintained
- ✅ Server performance optimization
- ✅ Comprehensive error handling and logging

### Verified
- ✓ Server startup successful with split files
- ✓ All API endpoints functional (/collections, /search, /health)
- ✓ Arabic text search working correctly
- ✓ Data loading from collections directory
- ✓ Git commits successful without LFS requirements

---

## [1.3.0] - 2025-08-24 🔐 Google OAuth Integration

### Added
- **Google OAuth 2.0 Authentication**
  - Manual OAuth implementation avoiding plugin version conflicts
  - Secure state parameter generation for CSRF protection
  - Token exchange with Google OAuth endpoints
  - User profile extraction (name, email, picture)
  - Admin role assignment based on email configuration

- **Enhanced Dashboard Authentication**
  - 🌐 "Login with Google" button with Google brand colors
  - Visual OR separator between login methods
  - URL parameter handling for OAuth redirects
  - Success/error message display system
  - Automatic session restoration from OAuth flow

- **Environment Configuration**
  - Google OAuth credentials support (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
  - Admin email configuration (`ADMIN_EMAILS`)
  - Proper dotenv loading in server startup

### Fixed
- Server environment variable loading issues
- Logger configuration with pino-pretty dependency
- OAuth redirect URL generation with proper encoding

### Security
- ✅ CSRF protection with random state parameters
- ✅ Secure JWT token generation and validation
- ✅ Role-based access control for admin features

---

## [1.2.0] - 2025-08-24 🔧 Authentication System Stabilization

### Added
- **Simplified Authentication System**
  - JWT-based authentication using jsonwebtoken directly
  - In-memory session storage for development
  - Session ID-based authentication verification
  - Manual authentication implementation avoiding cookie dependencies

- **Working Authentication Endpoints**
  - `POST /auth/login` - User authentication with email/password
  - `GET /auth/status` - Authentication status verification
  - `GET /auth/me` - Current user information retrieval
  - `POST /auth/logout` - Session termination

### Fixed
- **Server Stability Issues**
  - Resolved dependency conflicts with cookie plugins
  - Fixed server crashes due to authentication middleware
  - Eliminated port conflicts by proper process management
  - Simplified rate limiting to avoid storage dependencies

- **Authentication Route Registration**
  - Proper route registration without plugin conflicts
  - Error handling for authentication failures
  - Session management without complex dependencies

### Changed
- Removed problematic `@fastify/cookie` and `@fastify/oauth2` dependencies
- Simplified authentication flow for better stability
- Enhanced error logging with detailed stack traces

---

## [1.1.0] - 2025-08-24 🎨 API Management Dashboard

### Added
- **Comprehensive API Management Dashboard**
  - Modern responsive UI with gradient backgrounds
  - Arabic text support with RTL handling
  - Interactive forms for API token management
  - Real-time statistics display
  - Token usage tracking and analytics

- **API Token Management System**
  - Full CRUD operations for API tokens
  - Configurable permissions (read, write, admin)
  - Custom rate limiting per token
  - Usage statistics and monitoring
  - Secure token key generation with UUID

- **Dashboard Features**
  - 📊 Overview statistics (active tokens, total requests)
  - 🔑 Token management interface
  - ⚡ Quick actions for common tasks
  - 🎯 Modal dialogs for token creation
  - 📱 Mobile-responsive design

- **Storage System**
  - JSON-based storage for users and tokens
  - File-based persistence in `/server/data/`
  - User management with role-based access
  - Token validation and authentication

### UI/UX Improvements
- **Button Styling Customization**
  - Health Check button text color changed to white
  - Improved contrast and readability
  - Consistent color scheme throughout dashboard

- **Modal Systems**
  - Token creation modal with form validation
  - Token display modal with copy functionality
  - Success/error alert systems

---

## [1.0.0] - 2025-08-24 🚀 Initial API Server Implementation

### Added
- **Fastify-based API Server**
  - RESTful API design with comprehensive endpoints
  - Hadith data serving from 9 major Islamic collections
  - 124,338 hadiths loaded from structured JSON data
  - Arabic text support with UTF-8 encoding

- **Core API Endpoints**
  - **Collections API**
    - `GET /api/v1/collections` - List all collections
    - `GET /api/v1/collections/{id}` - Get specific collection
    - `GET /api/v1/collections/{id}/hadiths` - Get hadiths with pagination
    - `GET /api/v1/collections/{id}/hadiths/{hadithId}` - Get specific hadith

  - **Search API**
    - `GET /api/v1/search` - Full-text search across collections
    - `GET /api/v1/search/suggestions` - Search autocomplete
    - `POST /api/v1/search/advanced` - Advanced search with criteria

  - **Statistics API**
    - `GET /api/v1/stats` - Comprehensive data statistics
    - `GET /api/v1/stats/collections/{id}` - Collection-specific stats
    - `GET /api/v1/stats/distribution` - Text length distribution

  - **Health Monitoring**
    - `GET /health` - Basic health check
    - `GET /health/detailed` - Detailed system health

- **Data Management System**
  - **HadithDataManager Class**
    - Efficient data loading and caching
    - Collection indexing for O(1) access
    - Search indexing for fast queries
    - Memory usage optimization

  - **Search Capabilities**
    - Fuzzy text search with relevance scoring
    - Collection-specific filtering
    - File type filtering (regular/mushakkala_mufassala)
    - Pagination support with metadata

- **API Documentation**
  - Comprehensive static documentation at `/docs/`
  - Interactive API reference
  - Usage examples and response formats
  - Collection information with Arabic names

- **Test Interface**
  - **Comprehensive Test Page** (`/test.html`)
    - Interactive API testing interface
    - Arabic text input support
    - Real-time response display
    - Error handling and validation
    - All endpoints testing capability

### Technical Infrastructure
- **Server Configuration**
  - Fastify framework with plugins
  - CORS support for cross-origin requests
  - Security headers with Helmet
  - Rate limiting (100 requests/minute)
  - Static file serving (root and `/docs/` prefix)

- **Data Architecture**
  - Plugin-based modular architecture
  - JSON data format with metadata
  - Efficient caching and indexing
  - Graceful error handling

- **Development Environment**
  - Nodemon for automatic restarts
  - Environment-based configuration
  - Comprehensive logging with Pino
  - Package.json scripts for development

### Collections Included
- 📚 Sahih Al-Bukhari (صحيح البخاري)
- 📚 Sahih Muslim (صحيح مسلم)  
- 📚 Sunan Abu-Dawud (سنن أبي داود)
- 📚 Sunan Al-Tirmidhi (سنن الترمذي)
- 📚 Sunan Al-Nasai (سنن النسائي)
- 📚 Sunan Ibn-Maja (سنن ابن ماجه)
- 📚 Maliks Muwataa (موطأ مالك)
- 📚 Sunan Al-Darimi (سنن الدارمي)
- 📚 Musnad Ahmad Ibn-Hanbal (مسند أحمد بن حنبل)

---

## Development Stack & Dependencies

### Core Technologies
- **Backend**: Node.js with Fastify framework
- **Authentication**: JWT tokens with manual OAuth implementation
- **Data Storage**: JSON files with in-memory caching
- **Frontend**: Vanilla JavaScript with responsive CSS

### Key Dependencies
```json
{
  "fastify": "^4.24.3",
  "@fastify/cors": "^8.4.0",
  "@fastify/helmet": "^11.1.1",
  "@fastify/static": "^6.12.0",
  "@fastify/rate-limit": "^9.0.1",
  "jsonwebtoken": "^9.0.2",
  "dotenv": "^17.2.1",
  "uuid": "^11.1.0",
  "bcryptjs": "^3.0.2"
}
```

### Development Tools
- **Process Management**: Nodemon for auto-restart
- **Testing**: Jest framework (configured)
- **Logging**: Pino with pretty printing
- **Code Quality**: ESLint configuration ready

---

## Infrastructure & Deployment

### Environment Configuration
- **Development**: `npm run dev` (Port 3000)
- **Production**: `npm start`
- **Environment Variables**: `.env` file support
- **Logging**: Configurable log levels

### Security Features
- 🔒 JWT-based authentication
- 🔒 Rate limiting per IP/API key
- 🔒 CORS configuration
- 🔒 Security headers (Helmet)
- 🔒 Input validation and sanitization
- 🔒 Role-based access control

### Performance Optimizations
- ⚡ In-memory data caching
- ⚡ Efficient indexing algorithms
- ⚡ Pagination for large datasets
- ⚡ Optimized search with relevance scoring
- ⚡ Lazy loading where applicable

---

## Future Roadmap

### Planned Features
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Advanced search with AI/ML
- [ ] API versioning system
- [ ] Comprehensive test coverage
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] Performance monitoring
- [ ] Caching layer (Redis)
- [ ] API usage analytics
- [ ] Multi-language support

### Potential Improvements
- [ ] GraphQL API option
- [ ] Real-time subscriptions
- [ ] Advanced authentication (2FA)
- [ ] API marketplace integration
- [ ] Mobile application
- [ ] Data export features
- [ ] Backup and restore system

---

## Contributing

### Development Process
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add some amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass
- Use meaningful commit messages

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Islamic scholarship for the compilation of Hadith collections
- Open source community for tools and frameworks
- Contributors and maintainers of the project
- Arabic text processing community

---

*This changelog is automatically maintained and reflects all significant changes to the project.*