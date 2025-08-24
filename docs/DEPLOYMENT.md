# 🚀 Deployment Guide - Hadith API

Complete guide for deploying the Hadith API to production environments with best practices for security, performance, and reliability.

## 📋 Prerequisites

### System Requirements
- **Node.js**: 16.0.0 or higher
- **RAM**: Minimum 1GB (2GB+ recommended for full dataset)
- **Storage**: 500MB for data + application files
- **CPU**: 1 core minimum (2+ cores recommended)

### Dependencies
```bash
# Production dependencies
npm ci --only=production

# Or if using yarn
yarn install --production
```

## 🏗️ Production Setup

### 1. Environment Configuration

Create `.env.production`:
```bash
# Server Configuration
NODE_ENV=production
HOST=0.0.0.0
PORT=3000

# Security
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW="15 minutes"
ALLOWED_ORIGINS="https://yourdomain.com,https://api.yourdomain.com"

# Logging
LOG_LEVEL=warn

# Data
DATA_PATH=/app/data/hadith-data.json

# Optional: JWT Secret for future authentication
JWT_SECRET=your-super-secret-key-here

# Optional: Database connection (future enhancement)
# DATABASE_URL=postgresql://user:pass@localhost:5432/hadith_db
```

### 2. Data Preparation

```bash
# Convert CSV to JSON if not done
npm run convert

# Verify data integrity
node -e "
const data = require('./data/hadith-data.json');
console.log('Collections:', data.metadata.totalCollections);
console.log('Total Hadiths:', data.metadata.totalHadiths);
console.log('File size:', (require('fs').statSync('./data/hadith-data.json').size / 1024 / 1024).toFixed(2), 'MB');
"
```

### 3. Security Hardening

```bash
# Install security updates
npm audit fix

# Add security headers (already included via @fastify/helmet)
# Rate limiting (already configured)
# CORS protection (configured via environment)
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S hadith -u 1001 -G nodejs

# Change ownership of app directory
RUN chown -R hadith:nodejs /app
USER hadith

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start application
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  hadith-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - RATE_LIMIT_MAX=1000
      - LOG_LEVEL=info
    volumes:
      - ./data:/app/data:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optional: Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - hadith-api
    restart: unless-stopped

  # Optional: Redis for caching (future enhancement)
  redis:
    image: redis:alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

### Build and Deploy
```bash
# Build image
docker build -t hadith-api:latest .

# Run with docker-compose
docker-compose up -d

# Check logs
docker-compose logs -f hadith-api

# Scale if needed
docker-compose up -d --scale hadith-api=3
```

## ☁️ Cloud Deployment

### AWS ECS Deployment

1. **Create Task Definition**:
```json
{
  "family": "hadith-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "hadith-api",
      "image": "your-account.dkr.ecr.region.amazonaws.com/hadith-api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:3000/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/hadith-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

2. **Create Service**:
```bash
aws ecs create-service \
  --cluster hadith-cluster \
  --service-name hadith-api \
  --task-definition hadith-api:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

### Google Cloud Run
```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/hadith-api

# Deploy to Cloud Run
gcloud run deploy hadith-api \
  --image gcr.io/PROJECT_ID/hadith-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --port 3000 \
  --set-env-vars NODE_ENV=production,RATE_LIMIT_MAX=1000
```

### Heroku Deployment
```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create your-hadith-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set RATE_LIMIT_MAX=1000
heroku config:set LOG_LEVEL=info

# Deploy
git push heroku main

# Scale
heroku ps:scale web=2
```

## 🔧 Load Balancer Configuration

### Nginx Configuration
```nginx
upstream hadith_api {
    least_conn;
    server hadith-api-1:3000 max_fails=3 fail_timeout=30s;
    server hadith-api-2:3000 max_fails=3 fail_timeout=30s;
    server hadith-api-3:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        application/json
        application/javascript
        text/css
        text/javascript
        text/xml
        text/plain;
    
    location / {
        proxy_pass http://hadith_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }
    
    # Health check endpoint (don't rate limit)
    location /health {
        proxy_pass http://hadith_api;
        limit_req off;
        access_log off;
    }
    
    # Static documentation
    location /docs/ {
        proxy_pass http://hadith_api;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
}
```

## 📊 Monitoring & Logging

### Application Performance Monitoring (APM)

#### New Relic Integration
```javascript
// Add to top of server/index.js (before other requires)
if (process.env.NODE_ENV === 'production') {
  require('newrelic');
}
```

#### Datadog Integration
```javascript
// Add to server/index.js
const tracer = require('dd-trace').init({
  service: 'hadith-api',
  env: process.env.NODE_ENV,
  version: process.env.npm_package_version
});
```

### Health Monitoring Script
```bash
#!/bin/bash
# health-monitor.sh

API_URL="https://api.yourdomain.com"
SLACK_WEBHOOK="your-slack-webhook-url"

# Check API health
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")

if [ $response -ne 200 ]; then
    # Send alert to Slack
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"🚨 Hadith API is down! Status code: '$response'"}' \
        $SLACK_WEBHOOK
    
    # Log to file
    echo "$(date): API health check failed with status $response" >> /var/log/hadith-api-monitor.log
fi

# Check data availability
data_check=$(curl -s "$API_URL/api/v1/info" | jq -r '.totalHadiths')
if [ "$data_check" != "124338" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"⚠️ Hadith API data integrity issue! Total hadiths: '$data_check'"}' \
        $SLACK_WEBHOOK
fi
```

### Log Aggregation
```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  hadith-api:
    # ... existing configuration
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    
  # ELK Stack for log aggregation
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    
  logstash:
    image: docker.elastic.co/logstash/logstash:7.15.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch
    
  kibana:
    image: docker.elastic.co/kibana/kibana:7.15.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch-data:
```

## 🔒 Security Best Practices

### 1. Environment Security
```bash
# Set proper file permissions
chmod 600 .env.production
chown root:root .env.production

# Use secrets management in production
# AWS Secrets Manager, Azure Key Vault, etc.
```

### 2. Network Security
```bash
# Firewall rules (example for UFW)
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 3. Container Security
```dockerfile
# Use specific versions
FROM node:18.17.1-alpine

# Run as non-root user
USER node

# Read-only filesystem where possible
RUN chmod -R 755 /app && \
    chmod -R 644 /app/data
```

## 📈 Performance Optimization

### 1. Caching Strategy
```javascript
// Add Redis caching (future enhancement)
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Cache frequent searches
fastify.addHook('preHandler', async (request, reply) => {
  if (request.method === 'GET' && request.url.startsWith('/api/v1/search')) {
    const cacheKey = `search:${Buffer.from(request.url).toString('base64')}`;
    const cached = await client.get(cacheKey);
    if (cached) {
      reply.send(JSON.parse(cached));
      return;
    }
  }
});
```

### 2. Database Migration (Future)
```sql
-- Example schema for future database migration
CREATE TABLE collections (
    id SERIAL PRIMARY KEY,
    collection_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_arabic VARCHAR(100) NOT NULL,
    total_hadiths INTEGER NOT NULL
);

CREATE TABLE hadiths (
    id SERIAL PRIMARY KEY,
    hadith_id VARCHAR(20) NOT NULL,
    collection_id INTEGER REFERENCES collections(id),
    text TEXT NOT NULL,
    text_with_diacritics TEXT,
    text_length INTEGER NOT NULL,
    has_full_diacritics BOOLEAN NOT NULL,
    file_type VARCHAR(20) NOT NULL
);

-- Full-text search index
CREATE INDEX idx_hadiths_text_fts ON hadiths USING gin(to_tsvector('arabic', text));
CREATE INDEX idx_hadiths_collection ON hadiths(collection_id);
CREATE INDEX idx_hadiths_length ON hadiths(text_length);
```

### 3. CDN Configuration
```javascript
// Cloudflare example cache rules
const cacheHeaders = {
  '/api/v1/collections': 'public, max-age=3600',
  '/api/v1/collections/*': 'public, max-age=1800',
  '/api/v1/stats': 'public, max-age=3600',
  '/docs/*': 'public, max-age=86400'
};
```

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] Data file present and verified
- [ ] SSL certificates installed
- [ ] Firewall rules configured
- [ ] Monitoring set up
- [ ] Backup strategy implemented

### Deployment
- [ ] Zero-downtime deployment strategy
- [ ] Health checks configured
- [ ] Load balancer ready
- [ ] DNS records updated
- [ ] SSL/TLS configured

### Post-deployment
- [ ] Health checks passing
- [ ] Logs flowing correctly
- [ ] Performance metrics normal
- [ ] Security scan completed
- [ ] Documentation updated

## 🔄 Maintenance

### Regular Tasks
```bash
# Daily health check
curl -f https://api.yourdomain.com/health

# Weekly security updates
npm audit fix
docker image prune -f

# Monthly log rotation
logrotate /etc/logrotate.d/hadith-api

# Quarterly dependency updates
npm update
npm audit
```

### Backup Strategy
```bash
#!/bin/bash
# backup.sh

# Data backup
aws s3 cp /app/data/hadith-data.json s3://your-backup-bucket/data/$(date +%Y%m%d)/

# Configuration backup
tar -czf config-backup-$(date +%Y%m%d).tar.gz \
    .env.production \
    nginx.conf \
    docker-compose.yml

aws s3 cp config-backup-$(date +%Y%m%d).tar.gz s3://your-backup-bucket/config/
```

## 📞 Support & Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Monitor with `docker stats`
   - Consider data compression
   - Implement pagination limits

2. **Slow Response Times**
   - Check database query performance
   - Implement caching
   - Add CDN

3. **Rate Limiting Issues**
   - Adjust rate limits based on usage
   - Implement user authentication
   - Add request queuing

### Getting Help
- Check application logs: `docker logs hadith-api`
- Monitor system resources: `htop`, `docker stats`
- Review error rates in monitoring dashboard
- Contact support with logs and error details

---

**🎯 Your Hadith API is now ready for production! 🚀**