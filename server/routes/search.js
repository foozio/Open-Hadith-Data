/**
 * Search Routes
 * Endpoints for searching across Hadith collections
 */

async function searchRoutes(fastify, options) {

  /**
   * Search hadiths by text
   */
  fastify.get('/', {
    schema: {
      description: 'Search hadiths by text query across all or specific collections',
      tags: ['Search'],
      querystring: {
        type: 'object',
        properties: {
          q: { 
            type: 'string',
            minLength: 1,
            description: 'Search query text'
          },
          collection: { 
            type: 'string',
            description: 'Specific collection to search in'
          },
          fileType: { 
            type: 'string', 
            enum: ['regular', 'mushakkala_mufassala'],
            description: 'Type of text to search'
          },
          exact: { 
            type: 'boolean', 
            default: false,
            description: 'Use exact matching instead of fuzzy search'
          },
          limit: { 
            type: 'integer', 
            minimum: 1, 
            maximum: 100, 
            default: 20,
            description: 'Number of results per page'
          },
          offset: { 
            type: 'integer', 
            minimum: 0, 
            default: 0,
            description: 'Number of results to skip'
          }
        },
        required: ['q']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            hadiths: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  text: { type: 'string' },
                  textLength: { type: 'number' },
                  hasFullDiacritics: { type: 'boolean' },
                  collectionId: { type: 'string' },
                  collectionName: { type: 'string' },
                  fileType: { type: 'string' },
                  relevanceScore: { type: 'number' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                limit: { type: 'number' },
                offset: { type: 'number' },
                hasMore: { type: 'boolean' }
              }
            },
            query: {
              type: 'object',
              properties: {
                term: { type: 'string' },
                options: { type: 'object' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'boolean' },
            message: { type: 'string' },
            statusCode: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { 
      q: query, 
      collection: collectionId, 
      fileType, 
      exact: exactMatch = false,
      limit = 20, 
      offset = 0 
    } = request.query;

    // Validate query
    if (!query || query.trim().length === 0) {
      reply.status(400).send({
        error: true,
        message: 'Search query cannot be empty',
        statusCode: 400
      });
      return;
    }

    // Validate collection if provided
    if (collectionId) {
      const collection = fastify.hadithData.getCollection(collectionId);
      if (!collection) {
        reply.status(400).send({
          error: true,
          message: `Collection '${collectionId}' not found`,
          statusCode: 400
        });
        return;
      }
    }

    const result = fastify.hadithData.searchHadiths(query, {
      collectionId,
      fileType,
      exactMatch,
      limit: Math.min(limit, 100), // Cap at 100
      offset
    });

    return result;
  });

  /**
   * Search suggestions (for autocomplete)
   */
  fastify.get('/suggestions', {
    schema: {
      description: 'Get search suggestions based on partial query',
      tags: ['Search'],
      querystring: {
        type: 'object',
        properties: {
          q: { 
            type: 'string',
            minLength: 2,
            description: 'Partial search query'
          },
          limit: { 
            type: 'integer', 
            minimum: 1, 
            maximum: 20, 
            default: 10,
            description: 'Number of suggestions'
          }
        },
        required: ['q']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: { type: 'string' }
            },
            query: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { q: query, limit = 10 } = request.query;

    // Simple suggestion implementation
    // In a production system, you'd want a more sophisticated approach
    const suggestions = [];
    
    // Add the query itself as first suggestion
    suggestions.push(query);
    
    // Add some common Islamic terms that might match
    const commonTerms = [
      'رسول الله',
      'صلى الله عليه وسلم',
      'حدثنا',
      'أخبرنا',
      'قال',
      'النبي',
      'الصلاة',
      'الزكاة',
      'الحج',
      'الصوم'
    ];

    const queryLower = query.toLowerCase();
    for (const term of commonTerms) {
      if (term.toLowerCase().includes(queryLower) && suggestions.length < limit) {
        suggestions.push(term);
      }
    }

    return {
      suggestions: suggestions.slice(0, limit),
      query
    };
  });

  /**
   * Advanced search with multiple parameters
   */
  fastify.post('/advanced', {
    schema: {
      description: 'Advanced search with multiple criteria',
      tags: ['Search'],
      body: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Main search text' },
          collections: { 
            type: 'array', 
            items: { type: 'string' },
            description: 'List of collections to search in'
          },
          fileTypes: { 
            type: 'array', 
            items: { type: 'string', enum: ['regular', 'mushakkala_mufassala'] },
            description: 'Types of text to include'
          },
          minLength: { 
            type: 'integer', 
            minimum: 0,
            description: 'Minimum hadith text length'
          },
          maxLength: { 
            type: 'integer', 
            minimum: 0,
            description: 'Maximum hadith text length'
          },
          hasFullDiacritics: { 
            type: 'boolean',
            description: 'Filter by diacritic presence'
          },
          limit: { 
            type: 'integer', 
            minimum: 1, 
            maximum: 100, 
            default: 20
          },
          offset: { 
            type: 'integer', 
            minimum: 0, 
            default: 0
          }
        },
        required: ['query']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            hadiths: { type: 'array' },
            pagination: { type: 'object' },
            query: { type: 'object' },
            filters: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const {
      query,
      collections = [],
      fileTypes = [],
      minLength,
      maxLength,
      hasFullDiacritics,
      limit = 20,
      offset = 0
    } = request.body;

    // Start with basic search
    let results = fastify.hadithData.searchHadiths(query, {
      limit: 1000, // Get more results to filter
      offset: 0
    });

    // Apply additional filters
    let filteredHadiths = results.hadiths.filter(hadith => {
      // Collection filter
      if (collections.length > 0 && !collections.includes(hadith.collectionId)) {
        return false;
      }
      
      // File type filter
      if (fileTypes.length > 0 && !fileTypes.includes(hadith.fileType)) {
        return false;
      }
      
      // Length filters
      if (minLength !== undefined && hadith.textLength < minLength) {
        return false;
      }
      
      if (maxLength !== undefined && hadith.textLength > maxLength) {
        return false;
      }
      
      // Diacritics filter
      if (hasFullDiacritics !== undefined && hadith.hasFullDiacritics !== hasFullDiacritics) {
        return false;
      }
      
      return true;
    });

    // Apply pagination to filtered results
    const total = filteredHadiths.length;
    const paginatedResults = filteredHadiths.slice(offset, offset + limit);

    return {
      hadiths: paginatedResults,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      query: {
        term: query,
        options: request.body
      },
      filters: {
        applied: {
          collections: collections.length,
          fileTypes: fileTypes.length,
          lengthFilter: minLength !== undefined || maxLength !== undefined,
          diacriticsFilter: hasFullDiacritics !== undefined
        },
        resultsBeforeFiltering: results.hadiths.length,
        resultsAfterFiltering: total
      }
    };
  });

  fastify.log.info('🔍 Search routes registered');
}

module.exports = searchRoutes;