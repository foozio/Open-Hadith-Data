# 🕌 Open Hadith Data API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-v4.24+-blue.svg)](https://www.fastify.io/)

A comprehensive RESTful API for accessing Islamic Hadith collections from nine major sources, including the Six Books (Al-Kutub Al-Sittah). Features full Arabic text support, advanced search capabilities, and a modern management dashboard.

## 📋 Features

### 🔍 **Comprehensive Hadith Access**
- **62,174 Hadiths** from 9 major Islamic collections
- **Dual text versions**: With and without Arabic diacritics
- **Collection-specific filtering** and pagination
- **Advanced search** with relevance scoring
- **Full Arabic text support** with UTF-8 encoding

### 🔐 **Secure Authentication**
- **Google OAuth 2.0** integration
- **JWT-based** session management
- **Role-based access control** (Admin/User)
- **API token management** with custom permissions

### 📊 **Management Dashboard**
- **Modern responsive UI** with Arabic support
- **Real-time statistics** and usage analytics
- **Token management** with CRUD operations
- **Interactive API testing** interface

### ⚡ **High Performance**
- **In-memory caching** for fast data access
- **Efficient indexing** algorithms
- **Rate limiting** and security headers
- **RESTful design** with comprehensive endpoints

## 📚 Collections Included

| Collection | Arabic Name | ID |
|------------|-------------|-----|
| Sahih Al-Bukhari | صحيح البخاري | `sahih_al_bukhari` |
| Sahih Muslim | صحيح مسلم | `sahih_muslim` |
| Sunan Abu-Dawud | سنن أبي داود | `sunan_abu_dawud` |
| Sunan Al-Tirmidhi | سنن الترمذي | `sunan_al_tirmidhi` |
| Sunan Al-Nasai | سنن النسائي | `sunan_al_nasai` |
| Sunan Ibn-Maja | سنن ابن ماجه | `sunan_ibn_maja` |
| Maliks Muwataa | موطأ مالك | `maliks_muwataa` |
| Sunan Al-Darimi | سنن الدارمي | `sunan_al_darimi` |
| Musnad Ahmad Ibn-Hanbal | مسند أحمد بن حنبل | `musnad_ahmad_ibn_hanbal` |

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or higher
- **npm** v8 or higher
- **Google OAuth credentials** (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Open-Hadith-Data.git
   cd Open-Hadith-Data
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - **API Server**: http://localhost:3000
   - **Documentation**: http://localhost:3000/docs/
   - **Dashboard**: http://localhost:3000/dashboard.html
   - **API Tester**: http://localhost:3000/test.html

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
HOST=0.0.0.0
PORT=3000
LOG_LEVEL=info

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=1 minute

# Admin Configuration
ADMIN_EMAILS=admin@example.com,your-email@gmail.com
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:3000/auth/google/callback` to authorized redirect URIs
6. Copy Client ID and Secret to `.env` file

## 📖 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
Include your API token in requests:
```bash
# Header method
curl -H "X-API-Key: your-api-token" http://localhost:3000/api/v1/collections

# Query parameter method  
curl http://localhost:3000/api/v1/collections?api_key=your-api-token
```

### Core Endpoints

#### Collections
```bash
# Get all collections
GET /api/v1/collections

# Get specific collection
GET /api/v1/collections/{collectionId}

# Get hadiths from collection
GET /api/v1/collections/{collectionId}/hadiths?limit=20&offset=0

# Get specific hadith
GET /api/v1/collections/{collectionId}/hadiths/{hadithId}
```

#### Search
```bash
# Search hadiths
GET /api/v1/search?q=الصلاة&limit=10

# Search suggestions
GET /api/v1/search/suggestions?q=الصلاة&limit=5

# Advanced search
POST /api/v1/search/advanced
Content-Type: application/json
{
  "query": "الصلاة",
  "collections": ["sahih_al_bukhari"],
  "fileTypes": ["regular"]
}
```

#### Statistics
```bash
# Get overall statistics
GET /api/v1/stats

# Get collection statistics
GET /api/v1/stats/collections/{collectionId}

# Get text distribution
GET /api/v1/stats/distribution
```

### Response Format
```json
{
  "hadiths": [
    {
      "id": "1",
      "text": "حديث النبي صلى الله عليه وسلم",
      "collectionId": "sahih_al_bukhari",
      "collectionName": "Sahih Al-Bukhari",
      "fileType": "regular"
    }
  ],
  "pagination": {
    "total": 1000,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

## 🎛️ Dashboard Usage

### Login Options
1. **Google OAuth**: Click "Login with Google" (recommended)
2. **Demo Account**: Use `admin@example.com` / `admin123`

### Features
- **📊 Overview**: View API statistics and usage metrics
- **🔑 Token Management**: Create, edit, and delete API tokens
- **⚡ Quick Actions**: Fast access to common operations
- **📱 Responsive Design**: Works on desktop and mobile

### API Token Management
1. **Create Token**: Set name, permissions, and rate limits
2. **Configure Permissions**: Read, Write, Admin access levels
3. **Monitor Usage**: Track requests and performance
4. **Manage Tokens**: Update settings or revoke access

## 🛠️ Development

### Scripts
```bash
# Development with auto-restart
npm run dev

# Production start
npm start

# Run tests
npm test

# Watch tests
npm run test:watch
```

### Project Structure
```
Open-Hadith-Data/
├── server/                 # Backend server code
│   ├── index.js           # Main server file
│   ├── plugins/           # Fastify plugins
│   │   ├── dataLoader.js  # Data management
│   │   └── storage.js     # User/token storage
│   ├── routes/            # API route handlers
│   │   ├── api.js         # Main API routes
│   │   ├── auth.js        # Authentication
│   │   ├── collections.js # Collection endpoints
│   │   ├── search.js      # Search endpoints
│   │   ├── stats.js       # Statistics endpoints
│   │   └── health.js      # Health checks
│   ├── public/            # Static files
│   │   ├── index.html     # API documentation
│   │   ├── dashboard.html # Management dashboard
│   │   └── test.html      # API testing interface
│   └── data/              # Storage directory
├── data/                  # Hadith JSON data
├── scripts/               # Utility scripts
├── .env.example           # Environment template
├── package.json           # Dependencies and scripts
├── CHANGELOG.md           # Version history
└── README.md              # This file
```

### Adding New Features
1. Create feature branch
2. Implement changes with tests
3. Update documentation
4. Submit pull request

## 🧪 Testing

### API Testing
Use the built-in test interface at `/test.html` or use curl:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test collections
curl http://localhost:3000/api/v1/collections

# Test search (Arabic)
curl "http://localhost:3000/api/v1/search?q=الصلاة"
```

### Authentication Testing
```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Check status
curl http://localhost:3000/auth/status?sessionId=your-session-id
```

## 🔒 Security

### Built-in Security Features
- **JWT Authentication** with configurable expiration
- **Rate Limiting** (100 requests/minute by default)
- **CORS Protection** with configurable origins
- **Security Headers** via Helmet middleware
- **Input Validation** and sanitization
- **Role-based Access Control**

### Best Practices
- Use HTTPS in production
- Rotate JWT secrets regularly
- Monitor API usage patterns
- Implement proper logging
- Regular security audits

## 📈 Performance

### Optimization Features
- **In-memory caching** of hadith data (124K+ records)
- **Efficient indexing** for O(1) collection access
- **Search optimization** with relevance scoring
- **Pagination** to handle large result sets
- **Lazy loading** where applicable

### Monitoring
- Built-in health checks (`/health`, `/health/detailed`)
- Request/response logging with Pino
- Performance metrics in dashboard
- Error tracking and reporting

## 🌍 Deployment

### Production Setup
1. **Environment Configuration**
   ```bash
   NODE_ENV=production
   HOST=0.0.0.0
   PORT=3000
   ```

2. **Process Management**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start server/index.js --name "hadith-api"
   
   # Using Docker (optional)
   docker build -t hadith-api .
   docker run -p 3000:3000 hadith-api
   ```

3. **Reverse Proxy** (Nginx example)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

### Code Standards
- Follow existing code style
- Use meaningful commit messages
- Add JSDoc comments for functions
- Ensure tests pass
- Update changelog for significant changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Islamic Scholars** for the compilation and preservation of Hadith collections
- **Open Source Community** for the amazing tools and frameworks
- **Arabic Text Processing Community** for UTF-8 and RTL support guidance
- **Contributors** who help improve and maintain this project
- **Muhammad Hashim** for his early work on Hadith csv files -- [Checkout His GitHub](https://github.com/mhashim6)

## 📞 Support

- **Documentation**: Visit `/docs/` for comprehensive API documentation
- **Issues**: Report bugs on [GitHub Issues](https://github.com/foozio/Open-Hadith-Data/issues)
- **Discussions**: Join our [GitHub Discussions](https://github.com/foozio/Open-Hadith-Data/discussions)
- **Email**: Contact the maintainers at [nuzlilatief@gmail.com]

---

**Built with ❤️ for the Islamic developer community**

*"Seek knowledge from the cradle to the grave" - Prophet Muhammad (ﷺ)*