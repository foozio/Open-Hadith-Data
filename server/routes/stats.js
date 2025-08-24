/**
 * Statistics Routes
 * Endpoints for analytics and data insights about Hadith collections
 */

async function statsRoutes(fastify, options) {

  /**
   * Get overall statistics
   */
  fastify.get('/', {
    schema: {
      description: 'Get comprehensive statistics about all Hadith data',
      tags: ['Statistics'],
      response: {
        200: {
          type: 'object',
          properties: {
            overview: {
              type: 'object',
              properties: {
                totalCollections: { type: 'number' },
                totalHadiths: { type: 'number' },
                totalFiles: { type: 'number' },
                averageHadithLength: { type: 'number' },
                totalCharacters: { type: 'number' }
              }
            },
            collections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  collectionId: { type: 'string' },
                  collectionName: { type: 'string' },
                  hadithCount: { type: 'number' },
                  percentage: { type: 'number' },
                  fileTypes: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            metadata: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const stats = fastify.hadithData.getStats();
    const collections = fastify.hadithData.getCollections();
    
    // Calculate additional statistics
    let totalCharacters = 0;
    let hadithLengths = [];
    
    for (const collection of fastify.hadithData.data.collections) {
      for (const file of collection.files) {
        for (const hadith of file.hadiths) {
          totalCharacters += hadith.textLength;
          hadithLengths.push(hadith.textLength);
        }
      }
    }
    
    const averageHadithLength = Math.round(totalCharacters / hadithLengths.length);
    
    // Add percentages to collections
    const collectionsWithPercentages = collections.map(col => ({
      ...col,
      percentage: Math.round((col.totalHadiths / stats.metadata.totalHadiths) * 100 * 100) / 100
    }));

    return {
      overview: {
        totalCollections: stats.metadata.totalCollections,
        totalHadiths: stats.metadata.totalHadiths,
        totalFiles: stats.metadata.totalFiles,
        averageHadithLength,
        totalCharacters
      },
      collections: collectionsWithPercentages,
      metadata: {
        dataVersion: stats.metadata.version,
        generatedAt: stats.metadata.generatedAt,
        sourceFormat: stats.metadata.sourceFormat,
        encoding: stats.metadata.encoding
      }
    };
  });

  /**
   * Get collection-specific statistics
   */
  fastify.get('/collections/:collectionId', {
    schema: {
      description: 'Get detailed statistics for a specific collection',
      tags: ['Statistics'],
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
      response: {
        200: {
          type: 'object',
          properties: {
            collection: {
              type: 'object',
              properties: {
                collectionId: { type: 'string' },
                collectionName: { type: 'string' },
                collectionNameArabic: { type: 'string' },
                totalHadiths: { type: 'number' }
              }
            },
            files: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  fileType: { type: 'string' },
                  count: { type: 'number' },
                  averageLength: { type: 'number' },
                  minLength: { type: 'number' },
                  maxLength: { type: 'number' },
                  withDiacritics: { type: 'number' },
                  withoutDiacritics: { type: 'number' }
                }
              }
            },
            analysis: {
              type: 'object',
              properties: {
                totalCharacters: { type: 'number' },
                lengthDistribution: { type: 'object' },
                diacriticsAnalysis: { type: 'object' }
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

    // Analyze each file type
    const fileStats = [];
    let totalCharacters = 0;
    const allLengths = [];

    for (const file of collection.files) {
      const lengths = file.hadiths.map(h => h.textLength);
      const withDiacritics = file.hadiths.filter(h => h.hasFullDiacritics).length;
      const fileCharacters = lengths.reduce((sum, len) => sum + len, 0);
      
      totalCharacters += fileCharacters;
      allLengths.push(...lengths);

      fileStats.push({
        fileType: file.fileType,
        count: file.count,
        averageLength: Math.round(fileCharacters / file.count),
        minLength: Math.min(...lengths),
        maxLength: Math.max(...lengths),
        withDiacritics,
        withoutDiacritics: file.count - withDiacritics
      });
    }

    // Length distribution analysis
    const lengthRanges = {
      'very_short': allLengths.filter(l => l < 100).length,
      'short': allLengths.filter(l => l >= 100 && l < 300).length,
      'medium': allLengths.filter(l => l >= 300 && l < 600).length,
      'long': allLengths.filter(l => l >= 600 && l < 1000).length,
      'very_long': allLengths.filter(l => l >= 1000).length
    };

    // Diacritics analysis
    const totalWithDiacritics = fileStats.reduce((sum, file) => sum + file.withDiacritics, 0);
    const diacriticsAnalysis = {
      totalWithDiacritics,
      totalWithoutDiacritics: collection.totalHadiths - totalWithDiacritics,
      percentageWithDiacritics: Math.round((totalWithDiacritics / collection.totalHadiths) * 100 * 100) / 100
    };

    return {
      collection: {
        collectionId: collection.collectionId,
        collectionName: collection.collectionName,
        collectionNameArabic: collection.collectionNameArabic,
        totalHadiths: collection.totalHadiths
      },
      files: fileStats,
      analysis: {
        totalCharacters,
        lengthDistribution: lengthRanges,
        diacriticsAnalysis
      }
    };
  });

  /**
   * Get text length distribution across all collections
   */
  fastify.get('/distribution', {
    schema: {
      description: 'Get text length distribution analysis',
      tags: ['Statistics'],
      querystring: {
        type: 'object',
        properties: {
          collection: { 
            type: 'string',
            description: 'Analyze specific collection only'
          },
          fileType: { 
            type: 'string', 
            enum: ['regular', 'mushakkala_mufassala'],
            description: 'Analyze specific file type only'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            distribution: {
              type: 'object',
              properties: {
                ranges: { type: 'object' },
                statistics: { type: 'object' },
                percentiles: { type: 'object' }
              }
            },
            filters: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { collection: collectionId, fileType } = request.query;
    
    let allLengths = [];
    const collections = collectionId 
      ? [fastify.hadithData.getCollection(collectionId)]
      : fastify.hadithData.data.collections;

    // Collect lengths based on filters
    for (const collection of collections) {
      if (!collection) continue;
      
      for (const file of collection.files) {
        if (fileType && file.fileType !== fileType) continue;
        
        const lengths = file.hadiths.map(h => h.textLength);
        allLengths.push(...lengths);
      }
    }

    if (allLengths.length === 0) {
      return {
        distribution: {
          ranges: {},
          statistics: {},
          percentiles: {}
        },
        filters: { collectionId, fileType },
        note: 'No data found for the specified filters'
      };
    }

    // Sort for percentile calculations
    allLengths.sort((a, b) => a - b);

    // Calculate ranges
    const ranges = {
      '0-99': allLengths.filter(l => l < 100).length,
      '100-299': allLengths.filter(l => l >= 100 && l < 300).length,
      '300-599': allLengths.filter(l => l >= 300 && l < 600).length,
      '600-999': allLengths.filter(l => l >= 600 && l < 1000).length,
      '1000+': allLengths.filter(l => l >= 1000).length
    };

    // Calculate statistics
    const total = allLengths.length;
    const sum = allLengths.reduce((a, b) => a + b, 0);
    const mean = Math.round(sum / total);
    const median = allLengths[Math.floor(total / 2)];
    const min = allLengths[0];
    const max = allLengths[total - 1];

    // Calculate percentiles
    const percentiles = {};
    [10, 25, 50, 75, 90, 95, 99].forEach(p => {
      const index = Math.floor((p / 100) * total);
      percentiles[`p${p}`] = allLengths[index];
    });

    return {
      distribution: {
        ranges: Object.keys(ranges).reduce((acc, range) => {
          acc[range] = {
            count: ranges[range],
            percentage: Math.round((ranges[range] / total) * 100 * 100) / 100
          };
          return acc;
        }, {}),
        statistics: {
          total,
          mean,
          median,
          min,
          max,
          standardDeviation: Math.round(Math.sqrt(
            allLengths.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / total
          ))
        },
        percentiles
      },
      filters: { collectionId, fileType }
    };
  });

  /**
   * Get top frequent words or phrases
   */
  fastify.get('/frequent-terms', {
    schema: {
      description: 'Get most frequent Arabic terms across collections',
      tags: ['Statistics'],
      querystring: {
        type: 'object',
        properties: {
          collection: { 
            type: 'string',
            description: 'Analyze specific collection only'
          },
          limit: { 
            type: 'integer', 
            minimum: 1, 
            maximum: 100, 
            default: 20,
            description: 'Number of terms to return'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            frequentTerms: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  term: { type: 'string' },
                  frequency: { type: 'number' },
                  percentage: { type: 'number' }
                }
              }
            },
            analysis: {
              type: 'object',
              properties: {
                totalTerms: { type: 'number' },
                uniqueTerms: { type: 'number' },
                analyzedHadiths: { type: 'number' }
              }
            },
            filters: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { collection: collectionId, limit = 20 } = request.query;
    
    // This is a simplified frequency analysis
    // In production, you'd want more sophisticated Arabic text processing
    const termFrequency = new Map();
    let totalTerms = 0;
    let analyzedHadiths = 0;

    const collections = collectionId 
      ? [fastify.hadithData.getCollection(collectionId)]
      : fastify.hadithData.data.collections;

    for (const collection of collections) {
      if (!collection) continue;
      
      for (const file of collection.files) {
        // Only analyze regular files to avoid duplicate counting
        if (file.fileType !== 'regular') continue;
        
        for (const hadith of file.hadiths) {
          analyzedHadiths++;
          
          // Simple word extraction (can be improved with Arabic NLP)
          const words = hadith.text
            .split(/\s+/)
            .filter(word => word.length > 2) // Filter very short words
            .slice(0, 50); // Limit to first 50 words per hadith for performance
          
          for (const word of words) {
            const cleanWord = word.replace(/[^\u0600-\u06FF\u0750-\u077F]/g, ''); // Keep only Arabic
            if (cleanWord.length > 2) {
              termFrequency.set(cleanWord, (termFrequency.get(cleanWord) || 0) + 1);
              totalTerms++;
            }
          }
        }
      }
    }

    // Convert to array and sort by frequency
    const sortedTerms = Array.from(termFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([term, frequency]) => ({
        term,
        frequency,
        percentage: Math.round((frequency / totalTerms) * 100 * 100) / 100
      }));

    return {
      frequentTerms: sortedTerms,
      analysis: {
        totalTerms,
        uniqueTerms: termFrequency.size,
        analyzedHadiths
      },
      filters: { collectionId },
      note: 'This is a simplified frequency analysis. For production use, consider implementing proper Arabic text processing.'
    };
  });

  fastify.log.info('📊 Statistics routes registered');
}

module.exports = statsRoutes;