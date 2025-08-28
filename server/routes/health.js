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
    
    // Check if hadithData is available
    if (!fastify.hadithData) {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: pkg.version,
        data: {
          loaded: false,
          message: 'Data manager not initialized'
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch
        }
      };
    }
    
    // Check if data is loaded
    if (!fastify.hadithData.loaded) {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: pkg.version,
        data: {
          loaded: false,
          message: 'Data still loading'
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch
        }
      };
    }
    
    const stats = fastify.hadithData.getStats();
    
    // Check if stats are available
    if (!stats) {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: pkg.version,
        data: {
          loaded: true,
          message: 'Stats not available'
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch
        }
      };
    }
    
    // Log stats for debugging
    console.log('Stats:', JSON.stringify(stats, null, 2));
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: pkg.version,
      data: {
        loaded: fastify.hadithData.loaded,
        totalCollections: stats.metadata?.totalCollections || 0,
        totalHadiths: stats.metadata?.totalHadiths || 0,
        indexSize: stats.indexSize || 0,
        lastUpdated: stats.metadata?.generatedAt || 'Unknown'
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        memory: process.memoryUsage()
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