# 📋 Changelog

All notable changes to the Open-Hadith-Data API project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.7] - 2025-08-26 🛠️ Health Endpoint Debugging Enhancement

### Fixed
- **Enhanced Health Endpoint Debugging**
  - Added detailed debugging information to help diagnose data loading issues
  - Improved error handling and messaging for different data loading states
  - Added logging for stats object to help with troubleshooting

### Technical
- ✅ Better visibility into data loading process
- ✅ More informative error messages for troubleshooting
- ✅ Enhanced debugging capabilities for health endpoints

---

## [1.5.6] - 2025-08-26 🛠️ Enhanced Health Endpoint Robustness

### Fixed
- **Improved Health Endpoint Error Handling**
  - Enhanced detailed health endpoint to handle cases where hadithData or stats are not yet available
  - Added proper null checks for data manager initialization
  - Improved informative messages for different loading states

### Technical
- ✅ Better error resilience in health monitoring
- ✅ More informative health endpoint responses during startup
- ✅ Graceful handling of uninitialized components

---

## [1.5.5] - 2025-08-26 🛠️ Health Endpoint Improvements

### Fixed
- **Detailed Health Endpoint Data Handling**
  - Added proper error handling for cases where hadithData is not yet loaded
  - Fixed empty data and system objects in detailed health response
  - Improved robustness of health check endpoints

### Technical
- ✅ Graceful handling of uninitialized data in health checks
- ✅ More informative health endpoint responses
- ✅ Better error resilience in health monitoring

---

## [1.5.4] - 2025-08-26 🛠️ Vercel Routing Order Fix

### Fixed
- **Vercel Health Endpoint Routing**
  - Corrected routing order in `vercel.json` to ensure health endpoints are processed before catch-all route
  - Fixed "Unexpected token 'T', "The page c"... is not valid JSON" error for /health endpoint
  - Ensured API routes take precedence over static file serving

### Technical
- ✅ Proper routing precedence for Vercel deployments
- ✅ Health endpoint accessibility
- ✅ API endpoint routing consistency

---

## [1.5.3] - 2025-08-26 🛠️ Public Directory Setup Automation

### Added
- **Automated Public Directory Setup**
  - Created `scripts/setup-public-dir.js` to automate public directory creation
  - Added `postinstall` script to `package.json` to run setup automatically
  - Ensures static files are properly copied to the public directory

### Changed
- **Deployment Reliability**
  - Improved Vercel deployment consistency
  - Enhanced static file handling for cloud deployments
  - Automated setup reduces manual configuration errors

### Technical
- ✅ Automatic public directory setup during installation
- ✅ Static file copying automation
- ✅ Cross-platform compatibility

---

## [1.5.2] - 2025-08-26 📁 Vercel Static Files Configuration

### Changed
- **Static Files Structure**
  - Created top-level `public` directory for Vercel compatibility
  - Moved static files from `server/public` to `public`
  - Updated server configuration to serve static files from new location
  - Updated `vercel.json` routing to reference the top-level public directory

### Fixed
- **Vercel Deployment Issue**
  - Resolved "No Output Directory named 'public' found" error
  - Fixed static file serving for Vercel deployment
  - Maintained backward compatibility with local development

### Technical
- ✅ Vercel deployment compatibility
- ✅ Static file serving from correct directory
- ✅ Route configuration updates

---

## [1.5.1] - 2025-08-26 🛠️ Vercel Configuration Update

### Changed
- **Vercel Configuration Enhancement**
  - Updated `vercel.json` to use the newer format without `builds` section
  - Added `build` script to `package.json` for Vercel compatibility
  - Improved Vercel deployment documentation in README

### Technical
- ✅ Resolved Vercel warning about unused build settings
- ✅ Enhanced compatibility with Vercel's build system
- ✅ Maintained multi-platform deployment support

---

## [1.5.0] - 2025-08-26 ☁️ Vercel Deployment Support

### Added
- **Vercel Deployment Configuration**
  - Created `server.js` serverless function entry point
  - Updated `vercel.json` with proper routing rules for API endpoints
  - Added `.node-version` file to specify Node.js version (18)
  - Enhanced `.vercelignore` to exclude unnecessary files from deployment

- **Multi-Platform Deployment Support**
  - Maintained existing Netlify deployment configuration
  - Added comprehensive deployment instructions for both Vercel and Netlify
  - Updated README with detailed deployment guides

### Changed
- **Serverless Function Architecture**
  - Created unified serverless entry point compatible with both Netlify and Vercel
  - Improved path forwarding configuration for serverless environments
  - Enhanced request handling for cloud deployment platforms

### Technical
- ✅ Serverless function compatibility with Vercel's Node.js runtime
- ✅ Proper routing of API, auth, and health endpoints
- ✅ Environment variable support for production deployments
- ✅ Optimized file exclusion for faster deployments

### Verified
- ✓ Vercel deployment configuration
- ✓ API endpoint routing
- ✓ Authentication flow compatibility
- ✓ Static file serving

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
  - Split large dataset into manageable chunks (Dual-Text Version):
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
