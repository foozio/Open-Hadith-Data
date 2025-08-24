// Load environment variables
require('dotenv').config();

const fastify = require('fastify');
const path = require('path');
const fs = require('fs');

/**
 * Hadith API Server using Fastify
 * Provides RESTful endpoints for searching and accessing Islamic Hadith data
 */

// Server configuration
const config = {
  host: process.env.HOST || '0.0.0.0',
  port: process.env.PORT || 3000,
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard'
      }
    } : undefined
  }
};

// Create Fastify instance
const server = fastify({
  logger: config.logger,
  trustProxy: true,
  maxParamLength: 500
});

/**
 * Global error handler
 */
server.setErrorHandler(async (error, request, reply) => {
  server.log.error(error);
  
  const statusCode = error.statusCode || 500;
  const errorResponse = {
    error: true,
    message: error.message || 'Internal Server Error',
    statusCode
  };
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    errorResponse.message = 'Internal Server Error';
  }
  
  reply.status(statusCode).send(errorResponse);
});

/**
 * Global not found handler
 */
server.setNotFoundHandler(async (request, reply) => {
  reply.status(404).send({
    error: true,
    message: 'Route not found',
    statusCode: 404,
    path: request.url
  });
});

/**
 * Register plugins and routes
 */
async function registerPlugins() {
  // CORS plugin
  await server.register(require('@fastify/cors'), {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.ALLOWED_ORIGINS?.split(',') || false
      : true,
    credentials: true
  });

  // Security headers
  await server.register(require('@fastify/helmet'), {
    global: true,
    contentSecurityPolicy: false
  });

  // Rate limiting (simplified for now)
  await server.register(require('@fastify/rate-limit'), {
    max: process.env.RATE_LIMIT_MAX || 100,
    timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
    errorResponseBuilder: function (request, context) {
      return {
        error: true,
        message: 'Rate limit exceeded. Too many requests.',
        statusCode: 429,
        retryAfter: Math.round(context.ttl / 1000)
      };
    }
  });

  // Static files (for API documentation)
  await server.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/docs/'
  });

  // Static files (for root access - test page, etc.)
  await server.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    decorateReply: false
  });

  // Data loading plugin
  await server.register(require('./plugins/dataLoader'));

  // Authentication routes
  await server.register(require('./routes/auth'), { prefix: '/auth' });

  // API routes
  await server.register(require('./routes/api'), { prefix: '/api/v1' });
  
  // Health check route
  await server.register(require('./routes/health'));
}

/**
 * Graceful shutdown handler
 */
async function closeGracefully(signal) {
  server.log.info(`Received signal ${signal}, closing server gracefully`);
  
  try {
    await server.close();
    server.log.info('Server closed successfully');
    process.exit(0);
  } catch (error) {
    server.log.error('Error during server shutdown:', error);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => closeGracefully('SIGTERM'));
process.on('SIGINT', () => closeGracefully('SIGINT'));

/**
 * Start the server
 */
async function start() {
  try {
    // Register all plugins and routes
    await registerPlugins();
    
    // Start listening
    const address = await server.listen({
      host: config.host,
      port: config.port
    });
    
    server.log.info(`🕌 Hadith API Server started successfully`);
    server.log.info(`📡 Server listening at ${address}`);
    server.log.info(`📚 API Documentation available at ${address}/docs/`);
    server.log.info(`🏥 Health check available at ${address}/health`);
    
  } catch (error) {
    server.log.error('Failed to start server:', error);
    console.error('Detailed error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Start the server if this file is executed directly
if (require.main === module) {
  start();
}

module.exports = { server, start };