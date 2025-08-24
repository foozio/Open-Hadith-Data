# 🕌 Hadith API - Complete Usage Guide

A comprehensive RESTful API for accessing Islamic Hadith collections with full Arabic text support, search capabilities, and rich metadata.

## 📊 Quick Stats

- **🗂️ 9 Major Collections**: All canonical Hadith books
- **📚 124,338 Total Hadiths**: Complete authenticated texts
- **🔤 UTF-8 Encoded**: Proper Arabic character support
- **🎯 Diacritics Support**: Both regular and fully vowelized texts
- **⚡ Fast Search**: In-memory indexing for quick retrieval

## 🚀 Quick Start

### Start the Server
```bash
# Clone and setup
git clone <repository-url>
cd Open-Hadith-Data
npm install

# Convert CSV to JSON (if needed)
npm run convert

# Start the API server
npm run dev
# Server will start at http://localhost:3000
```

### Test Connection
```bash
curl http://localhost:3000/health
# Response: {"status":"healthy","timestamp":"2025-08-24T06:06:53.167Z",...}
```

## 📖 API Reference

### Base URL
```
http://localhost:3000/api/v1
```

## 🏥 Health & Monitoring

### Basic Health Check
```bash
curl http://localhost:3000/health
```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-24T06:06:53.167Z",
  "uptime": 12.832416375,
  "version": "1.0.0"
}
```

### Detailed Health Check
```bash
curl http://localhost:3000/health/detailed
```
**Response includes system metrics, data status, and memory usage.**

### Readiness Check (for Load Balancers)
```bash
curl http://localhost:3000/ready
```

## 📚 Collections

### 1. List All Collections
```bash
curl http://localhost:3000/api/v1/collections
```

**Response:**
```json
{
  "collections": [
    {
      "collectionId": "sahih_al_bukhari",
      "collectionName": "Sahih Al-Bukhari",
      "collectionNameArabic": "صحيح البخاري",
      "totalHadiths": 14016,
      "fileTypes": ["regular", "mushakkala_mufassala"]
    },
    {
      "collectionId": "sahih_muslim",
      "collectionName": "Sahih Muslim",
      "collectionNameArabic": "صحيح مسلم",
      "totalHadiths": 10724,
      "fileTypes": ["regular", "mushakkala_mufassala"]
    }
    // ... 7 more collections
  ],
  "total": 9
}
```

### 2. Get Collection Details
```bash
curl http://localhost:3000/api/v1/collections/sahih_al_bukhari
```

### 3. Get Hadiths from Collection
```bash
# Basic usage
curl "http://localhost:3000/api/v1/collections/sahih_al_bukhari/hadiths?limit=2"

# With diacritics
curl "http://localhost:3000/api/v1/collections/sahih_al_bukhari/hadiths?fileType=mushakkala_mufassala&limit=1"

# Pagination
curl "http://localhost:3000/api/v1/collections/sahih_al_bukhari/hadiths?limit=10&offset=100"
```

**Response:**
```json
{
  "hadiths": [
    {
      "id": "1",
      "text": "حدثنا الحميدي عبد الله بن الزبير قال حدثنا سفيان...",
      "textLength": 352,
      "hasFullDiacritics": false,
      "collectionId": "sahih_al_bukhari",
      "collectionName": "Sahih Al-Bukhari",
      "fileType": "regular"
    }
  ],
  "pagination": {
    "total": 14016,
    "limit": 2,
    "offset": 0,
    "hasMore": true
  }
}
```

### 4. Get Specific Hadith
```bash
# Regular text
curl "http://localhost:3000/api/v1/collections/sahih_al_bukhari/hadiths/1"

# With full diacritics
curl "http://localhost:3000/api/v1/collections/sahih_al_bukhari/hadiths/1?fileType=mushakkala_mufassala"
```

**Response (with diacritics):**
```json
{
  "id": "1",
  "text": "‏ ‏حَدَّثَنَا ‏ ‏الْحُمَيْدِيُّ عَبْدُ اللَّهِ بْنُ الزُّبَيْرِ ‏ ‏قَالَ حَدَّثَنَا ‏ ‏سُفْيَانُ...",
  "textLength": 669,
  "hasFullDiacritics": true,
  "collectionId": "sahih_al_bukhari",
  "collectionName": "Sahih Al-Bukhari",
  "fileType": "mushakkala_mufassala"
}
```

## 🔍 Search

### 1. Basic Text Search
```bash
# Search across all collections
curl -G "http://localhost:3000/api/v1/search" --data-urlencode "q=الصلاة" --data "limit=3"

# Search in specific collection
curl -G "http://localhost:3000/api/v1/search" --data-urlencode "q=النبي" --data "collection=sahih_al_bukhari&limit=2"

# Exact matching
curl -G "http://localhost:3000/api/v1/search" --data-urlencode "q=رسول الله" --data "exact=true&limit=5"
```

**Response:**
```json
{
  "hadiths": [
    {
      "id": "21107",
      "text": "حدثنا عبد الله حدثني أبي حدثنا يونس...",
      "textLength": 3003,
      "hasFullDiacritics": false,
      "collectionId": "musnad_ahmad_ibn_hanbal",
      "collectionName": "Musnad Ahmad Ibn-Hanbal",
      "fileType": "regular",
      "relevanceScore": 98.01864801864802
    }
  ],
  "pagination": {
    "total": 3585,
    "limit": 3,
    "offset": 0,
    "hasMore": true
  },
  "query": {
    "term": "الصلاة",
    "options": {}
  }
}
```

### 2. Search Suggestions
```bash
curl -G "http://localhost:3000/api/v1/search/suggestions" --data-urlencode "q=صل" --data "limit=5"
```

### 3. Advanced Search
```bash
curl -X POST "http://localhost:3000/api/v1/search/advanced" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "النبي",
    "collections": ["sahih_al_bukhari", "sahih_muslim"],
    "fileTypes": ["regular"],
    "minLength": 200,
    "maxLength": 1000,
    "limit": 2
  }'
```

**Response includes filtering details:**
```json
{
  "hadiths": [...],
  "pagination": {...},
  "query": {...},
  "filters": {
    "applied": {
      "collections": 2,
      "fileTypes": 1,
      "lengthFilter": true,
      "diacriticsFilter": false
    },
    "resultsBeforeFiltering": 1250,
    "resultsAfterFiltering": 856
  }
}
```

## 📊 Statistics & Analytics

### 1. Overall Statistics
```bash
curl http://localhost:3000/api/v1/stats
```

**Response:**
```json
{
  "overview": {
    "totalCollections": 9,
    "totalHadiths": 124338,
    "totalFiles": 18,
    "averageHadithLength": 467,
    "totalCharacters": 58066157
  },
  "collections": [
    {
      "collectionId": "musnad_ahmad_ibn_hanbal",
      "collectionName": "Musnad Ahmad Ibn-Hanbal",
      "percentage": 42.41,
      "fileTypes": ["regular", "mushakkala_mufassala"]
    }
    // ... other collections with percentages
  ],
  "metadata": {
    "dataVersion": "1.0.0",
    "generatedAt": "2025-08-24T05:59:40.009Z",
    "sourceFormat": "CSV",
    "encoding": "UTF-8"
  }
}
```

### 2. Collection-Specific Statistics
```bash
curl http://localhost:3000/api/v1/stats/collections/sahih_al_bukhari
```

### 3. Text Length Distribution
```bash
# Overall distribution
curl http://localhost:3000/api/v1/stats/distribution

# Specific collection
curl "http://localhost:3000/api/v1/stats/distribution?collection=sahih_al_bukhari"

# Specific file type
curl "http://localhost:3000/api/v1/stats/distribution?fileType=mushakkala_mufassala"
```

### 4. Frequent Terms Analysis
```bash
curl "http://localhost:3000/api/v1/stats/frequent-terms?limit=10"
```

## 🌐 Complete Collection Reference

| Collection ID | Arabic Name | English Name | Hadiths Count |
|---------------|-------------|--------------|---------------|
| `sahih_al_bukhari` | صحيح البخاري | Sahih Al-Bukhari | 14,016 |
| `sahih_muslim` | صحيح مسلم | Sahih Muslim | 10,724 |
| `sunan_abu_dawud` | سنن أبي داود | Sunan Abu-Dawud | 9,180 |
| `sunan_al_tirmidhi` | سنن الترمذي | Sunan Al-Tirmidhi | 7,782 |
| `sunan_al_nasai` | سنن النسائي | Sunan Al-Nasai | 11,324 |
| `sunan_ibn_maja` | سنن ابن ماجه | Sunan Ibn-Maja | 8,664 |
| `maliks_muwataa` | موطأ مالك | Maliks Muwataa | 3,188 |
| `sunan_al_darimi` | سنن الدارمي | Sunan Al-Darimi | 6,734 |
| `musnad_ahmad_ibn_hanbal` | مسند أحمد بن حنبل | Musnad Ahmad Ibn-Hanbal | 52,726 |

## 🛠️ Advanced Usage Examples

### Search Workflow Example
```bash
# 1. Get suggestions for user input
curl -G "http://localhost:3000/api/v1/search/suggestions" --data-urlencode "q=صلا"

# 2. Perform search with full term
curl -G "http://localhost:3000/api/v1/search" --data-urlencode "q=الصلاة" --data "limit=10"

# 3. Refine with specific collection
curl -G "http://localhost:3000/api/v1/search" --data-urlencode "q=الصلاة" --data "collection=sahih_al_bukhari&limit=5"

# 4. Get detailed hadith
curl "http://localhost:3000/api/v1/collections/sahih_al_bukhari/hadiths/1?fileType=mushakkala_mufassala"
```

### Data Analysis Workflow
```bash
# 1. Get overall statistics
curl http://localhost:3000/api/v1/stats

# 2. Analyze specific collection
curl http://localhost:3000/api/v1/stats/collections/sahih_al_bukhari

# 3. Check text distribution
curl "http://localhost:3000/api/v1/stats/distribution?collection=sahih_al_bukhari"

# 4. Find frequent terms
curl "http://localhost:3000/api/v1/stats/frequent-terms?collection=sahih_al_bukhari&limit=20"
```

## 🔧 Configuration & Environment

### Environment Variables
```bash
# Server Configuration
HOST=0.0.0.0                    # Server host
PORT=3000                       # Server port
NODE_ENV=development            # Environment
LOG_LEVEL=info                  # Logging level

# Security
RATE_LIMIT_MAX=100             # Requests per window
RATE_LIMIT_WINDOW="1 minute"   # Rate limit window
ALLOWED_ORIGINS=               # CORS origins (production)

# Data
DATA_PATH=./data/hadith-data.json  # JSON data file path
```

### Start with Custom Configuration
```bash
# Custom port
PORT=8080 npm run dev

# Production mode
NODE_ENV=production npm start

# Custom data file
DATA_PATH=/path/to/custom-data.json npm run dev
```

## 📋 Response Format Reference

### Standard Success Response
```json
{
  "data": "...",          // Requested data
  "metadata": "...",      // Optional metadata
  "pagination": "..."     // For paginated responses
}
```

### Error Response
```json
{
  "error": true,
  "message": "Descriptive error message",
  "statusCode": 400,
  "path": "/api/v1/invalid-endpoint"  // Optional
}
```

### Pagination Object
```json
{
  "pagination": {
    "total": 14016,        // Total items available
    "limit": 20,           // Items per page
    "offset": 0,           // Items skipped
    "hasMore": true        // More items available
  }
}
```

## 🚦 HTTP Status Codes

- **200** - Success
- **400** - Bad Request (invalid parameters)
- **404** - Not Found (collection/hadith not found)
- **429** - Rate Limit Exceeded
- **500** - Internal Server Error
- **503** - Service Unavailable (data not loaded)

## 🎯 Best Practices

### 1. URL Encoding for Arabic Text
```bash
# Correct: URL encode Arabic characters
curl -G "http://localhost:3000/api/v1/search" --data-urlencode "q=الصلاة"

# Alternative: Manual encoding
curl "http://localhost:3000/api/v1/search?q=%D8%A7%D9%84%D8%B5%D9%84%D8%A7%D8%A9"
```

### 2. Pagination for Large Results
```bash
# Get first page
curl "http://localhost:3000/api/v1/collections/musnad_ahmad_ibn_hanbal/hadiths?limit=50&offset=0"

# Get next page
curl "http://localhost:3000/api/v1/collections/musnad_ahmad_ibn_hanbal/hadiths?limit=50&offset=50"
```

### 3. File Type Selection
```bash
# For display: use regular text (cleaner)
curl "http://localhost:3000/api/v1/collections/sahih_al_bukhari/hadiths/1?fileType=regular"

# For academic study: use diacritics (complete)
curl "http://localhost:3000/api/v1/collections/sahih_al_bukhari/hadiths/1?fileType=mushakkala_mufassala"
```

### 4. Rate Limiting Handling
```bash
# Check rate limit headers
curl -v "http://localhost:3000/api/v1/collections"
# Look for: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
```

## 🔍 Troubleshooting

### Common Issues

**1. Empty Search Results**
```bash
# Check if query is URL encoded
curl -G "http://localhost:3000/api/v1/search" --data-urlencode "q=your_query"
```

**2. Collection Not Found**
```bash
# List all available collections first
curl "http://localhost:3000/api/v1/collections"
```

**3. Server Not Responding**
```bash
# Check if server is running
curl "http://localhost:3000/health"

# Check data loading status
curl "http://localhost:3000/health/detailed"
```

**4. Rate Limit Exceeded**
```bash
# Wait for rate limit reset or reduce request frequency
# Check X-RateLimit-Reset header for reset time
```

## 📈 Performance Tips

1. **Use pagination** for large collections (limit ≤ 100)
2. **Cache frequently accessed data** on client side
3. **Use specific collections** instead of searching all
4. **Implement request debouncing** for search suggestions
5. **Consider text length** when displaying results

## 🤝 Contributing

Found an issue or want to contribute? Check our GitHub repository for:
- Bug reports
- Feature requests  
- Pull requests
- Documentation improvements

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

---

**📚 Happy searching through the authentic Hadith collections! 🕌**