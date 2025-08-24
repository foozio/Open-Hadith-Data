/**
 * Health Check Routes
 * Provides endpoints for monitoring server and data availability
 */

async function healthRoutes(fastify, options) {
  
  /**
   * Basic health check
   */
  fastify.get('/health', {
    schema: {
      description: 'Basic health check endpoint',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            version: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const pkg = require('../../package.json');
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: pkg.version
    };
  });

  /**
   * Detailed health check with data status
   */
  fastify.get('/health/detailed', {
    schema: {
      description: 'Detailed health check with data and system information',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            data: { type: 'object' },
            system: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const pkg = require('../../package.json');
    const stats = fastify.hadithData.getStats();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: pkg.version,
      data: {
        loaded: fastify.hadithData.loaded,
        totalCollections: stats.metadata.totalCollections,
        totalHadiths: stats.metadata.totalHadiths,
        indexSize: stats.indexSize,
        lastUpdated: stats.metadata.generatedAt
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        memory: stats.memoryUsage
      }
    };
  });

  /**
   * Readiness check
   */
  fastify.get('/ready', {
    schema: {
      description: 'Readiness check for load balancers',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            ready: { type: 'boolean' },
            timestamp: { type: 'string' }
          }
        },
        503: {
          type: 'object',
          properties: {
            ready: { type: 'boolean' },
            timestamp: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const isReady = fastify.hadithData.loaded;
    
    if (isReady) {
      return {
        ready: true,
        timestamp: new Date().toISOString()
      };
    } else {
      reply.status(503).send({
        ready: false,
        timestamp: new Date().toISOString(),
        message: 'Data not loaded'
      });
    }
  });

  /**
   * Liveness check
   */
  fastify.get('/alive', {
    schema: {
      description: 'Liveness check for container orchestration',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            alive: { type: 'boolean' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      alive: true,
      timestamp: new Date().toISOString()
    };
  });

  fastify.log.info('🏥 Health check routes registered');
}

module.exports = healthRoutes;