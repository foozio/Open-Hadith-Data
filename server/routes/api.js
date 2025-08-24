/**
 * Main API Routes
 * Organizes all Hadith API endpoints under /api/v1
 */

async function apiRoutes(fastify, options) {
  
  // Register sub-route modules
  await fastify.register(require('./collections'), { prefix: '/collections' });
  await fastify.register(require('./search'), { prefix: '/search' });
  await fastify.register(require('./stats'), { prefix: '/stats' });

  /**
   * API Information endpoint
   */
  fastify.get('/', {
    schema: {
      description: 'API information and available endpoints',
      tags: ['API Info'],
      response: {
        200: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            version: { type: 'string' },
            description: { type: 'string' },
            endpoints: { type: 'object' },
            documentation: { type: 'string' },
            contact: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const pkg = require('../../package.json');
    const baseUrl = `${request.protocol}://${request.hostname}`;
    
    return {
      name: 'Hadith API',
      version: pkg.version,
      description: 'RESTful API for accessing Islamic Hadith collections',
      endpoints: {
        collections: `${baseUrl}${request.routerPath}/collections`,
        search: `${baseUrl}${request.routerPath}/search`,
        stats: `${baseUrl}${request.routerPath}/stats`,
        health: `${baseUrl}/health`,
        documentation: `${baseUrl}/docs/`
      },
      features: [
        'Nine major Hadith collections',
        'Arabic text with diacritic support',
        'Full-text search capabilities',
        'Collection-specific filtering',
        'Pagination support',
        'RESTful design'
      ],
      collections: [
        'Sahih Al-Bukhari',
        'Sahih Muslim',
        'Sunan Abu-Dawud',
        'Sunan Al-Tirmidhi',
        'Sunan Al-Nasai',
        'Sunan Ibn-Maja',
        'Maliks Muwataa',
        'Sunan Al-Darimi',
        'Musnad Ahmad Ibn-Hanbal'
      ],
      contact: {
        repository: pkg.repository?.url || 'https://github.com/your-username/hadith-api',
        issues: pkg.bugs?.url || 'https://github.com/your-username/hadith-api/issues'
      }
    };
  });

  /**
   * API Statistics summary
   */
  fastify.get('/info', {
    schema: {
      description: 'Quick API statistics and data summary',
      tags: ['API Info'],
      response: {
        200: {
          type: 'object',
          properties: {
            totalCollections: { type: 'number' },
            totalHadiths: { type: 'number' },
            totalFiles: { type: 'number' },
            dataVersion: { type: 'string' },
            lastUpdated: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const stats = fastify.hadithData.getStats();
    
    return {
      totalCollections: stats.metadata.totalCollections,
      totalHadiths: stats.metadata.totalHadiths,
      totalFiles: stats.metadata.totalFiles,
      dataVersion: stats.metadata.version,
      lastUpdated: stats.metadata.generatedAt
    };
  });

  fastify.log.info('🚀 Main API routes registered');
}

module.exports = apiRoutes;