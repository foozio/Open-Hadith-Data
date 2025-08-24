/**
 * Collections Routes
 * Endpoints for accessing Hadith collections and individual hadiths
 */

async function collectionsRoutes(fastify, options) {

  /**
   * Get all collections
   */
  fastify.get('/', {
    schema: {
      description: 'Get list of all available Hadith collections',
      tags: ['Collections'],
      response: {
        200: {
          type: 'object',
          properties: {
            collections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  collectionId: { type: 'string' },
                  collectionName: { type: 'string' },
                  collectionNameArabic: { type: 'string' },
                  totalHadiths: { type: 'number' },
                  fileTypes: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            total: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const collections = fastify.hadithData.getCollections();
    
    return {
      collections,
      total: collections.length
    };
  });

  /**
   * Get specific collection details
   */
  fastify.get('/:collectionId', {
    schema: {
      description: 'Get details of a specific Hadith collection',
      tags: ['Collections'],
      params: {
        type: 'object',
        properties: {
          collectionId: { 
            type: 'string',
            description: 'Collection identifier (e.g., sahih_al_bukhari)'
          }
        },
        required: ['collectionId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            collectionId: { type: 'string' },
            collectionName: { type: 'string' },
            collectionNameArabic: { type: 'string' },
            totalHadiths: { type: 'number' },
            files: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  fileType: { type: 'string' },
                  fileName: { type: 'string' },
                  count: { type: 'number' }
                }
              }
            }
          }
        },
        404: {
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
    const { collectionId } = request.params;
    const collection = fastify.hadithData.getCollection(collectionId);
    
    if (!collection) {
      reply.status(404).send({
        error: true,
        message: `Collection '${collectionId}' not found`,
        statusCode: 404
      });
      return;
    }

    // Return collection info without the actual hadiths
    return {
      collectionId: collection.collectionId,
      collectionName: collection.collectionName,
      collectionNameArabic: collection.collectionNameArabic,
      totalHadiths: collection.totalHadiths,
      files: collection.files.map(file => ({
        fileType: file.fileType,
        fileName: file.fileName,
        count: file.count
      }))
    };
  });

  /**
   * Get hadiths from a specific collection
   */
  fastify.get('/:collectionId/hadiths', {
    schema: {
      description: 'Get hadiths from a specific collection with pagination',
      tags: ['Collections'],
      params: {
        type: 'object',
        properties: {
          collectionId: { 
            type: 'string',
            description: 'Collection identifier'
          }
        },
        required: ['collectionId']
      },
      querystring: {
        type: 'object',
        properties: {
          fileType: { 
            type: 'string', 
            enum: ['regular', 'mushakkala_mufassala'],
            description: 'Type of text (regular or with diacritics)'
          },
          limit: { 
            type: 'integer', 
            minimum: 1, 
            maximum: 100, 
            default: 20,
            description: 'Number of hadiths per page'
          },
          offset: { 
            type: 'integer', 
            minimum: 0, 
            default: 0,
            description: 'Number of hadiths to skip'
          }
        }
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
                  fileType: { type: 'string' }
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
            }
          }
        },
        404: {
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
    const { collectionId } = request.params;
    const { fileType, limit = 20, offset = 0 } = request.query;
    
    const result = fastify.hadithData.getCollectionHadiths(collectionId, {
      fileType,
      limit: Math.min(limit, 100), // Cap at 100
      offset
    });
    
    if (!result) {
      reply.status(404).send({
        error: true,
        message: `Collection '${collectionId}' not found`,
        statusCode: 404
      });
      return;
    }

    return result;
  });

  /**
   * Get specific hadith by ID
   */
  fastify.get('/:collectionId/hadiths/:hadithId', {
    schema: {
      description: 'Get a specific hadith by collection and hadith ID',
      tags: ['Collections'],
      params: {
        type: 'object',
        properties: {
          collectionId: { 
            type: 'string',
            description: 'Collection identifier'
          },
          hadithId: { 
            type: 'string',
            description: 'Hadith ID within the collection'
          }
        },
        required: ['collectionId', 'hadithId']
      },
      querystring: {
        type: 'object',
        properties: {
          fileType: { 
            type: 'string', 
            enum: ['regular', 'mushakkala_mufassala'],
            default: 'regular',
            description: 'Type of text to retrieve'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            text: { type: 'string' },
            textLength: { type: 'number' },
            hasFullDiacritics: { type: 'boolean' },
            collectionId: { type: 'string' },
            collectionName: { type: 'string' },
            fileType: { type: 'string' }
          }
        },
        404: {
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
    const { collectionId, hadithId } = request.params;
    const { fileType = 'regular' } = request.query;
    
    const hadith = fastify.hadithData.getHadith(collectionId, hadithId, fileType);
    
    if (!hadith) {
      reply.status(404).send({
        error: true,
        message: `Hadith '${hadithId}' not found in collection '${collectionId}' with file type '${fileType}'`,
        statusCode: 404
      });
      return;
    }

    return hadith;
  });

  fastify.log.info('📚 Collections routes registered');
}

module.exports = collectionsRoutes;