const fp = require('fastify-plugin');
const path = require('path');
const fs = require('fs').promises;
const EnhancedDataLoader = require('./enhanced-data-loader');

/**
 * Data Loader Plugin for Hadith API
 * Enhanced version that can load from split files or unified data
 */

class HadithDataManager {
  constructor() {
    this.dataLoader = new EnhancedDataLoader();
    this.data = null;
    this.loaded = false;
    this.collections = new Map();
    this.searchIndex = new Map();
  }

  /**
   * Load data using enhanced loader (supports both split and unified files)
   */
  async loadData() {
    try {
      // Use the enhanced loader which handles both split and unified files
      this.data = await this.dataLoader.loadData();
      
      // Build collection index for faster access
      this.buildCollectionIndex();
      
      // Build basic search index
      this.buildSearchIndex();
      
      this.loaded = true;
      const stats = this.dataLoader.getStats();
      console.log(`✅ Loaded ${stats.hadithsCount.toLocaleString()} hadiths from ${stats.collectionsCount} collections using ${stats.loadingMethod}`);
      
    } catch (error) {
      console.error('❌ Failed to load Hadith data:', error.message);
      throw new Error(`Data loading failed: ${error.message}`);
    }
  }

  /**
   * Build collection index for O(1) access
   */
  buildCollectionIndex() {
    this.collections.clear();
    
    for (const collection of this.data.collections) {
      this.collections.set(collection.collectionId, collection);
    }
  }

  /**
   * Build basic search index (simplified for now)
   */
  buildSearchIndex() {
    this.searchIndex.clear();
    
    for (const collection of this.data.collections) {
      for (const file of collection.files) {
        for (const hadith of file.hadiths) {
          const key = `${collection.collectionId}-${file.fileType}-${hadith.id}`;
          this.searchIndex.set(key, {
            collectionId: collection.collectionId,
            collectionName: collection.collectionName,
            fileType: file.fileType,
            hadith: hadith
          });
        }
      }
    }
  }

  /**
   * Get all collections metadata
   */
  getCollections() {
    return this.data.collections.map(col => {
      // Calculate total hadiths for this collection
      let totalHadiths = 0;
      if (col.files && Array.isArray(col.files)) {
        col.files.forEach(file => {
          if (file.hadiths && Array.isArray(file.hadiths)) {
            totalHadiths += file.hadiths.length;
          }
        });
      }
      
      return {
        collectionId: col.collectionId,
        collectionName: col.collectionName,
        collectionNameArabic: col.collectionNameArabic,
        totalHadiths: totalHadiths,
        fileTypes: col.files ? col.files.map(f => f.fileType) : []
      };
    });
  }

  /**
   * Get specific collection by ID
   */
  getCollection(collectionId) {
    return this.collections.get(collectionId) || null;
  }

  /**
   * Get hadiths from a specific collection
   */
  getCollectionHadiths(collectionId, options = {}) {
    const collection = this.getCollection(collectionId);
    if (!collection) return null;

    const { fileType, limit = 50, offset = 0 } = options;
    let allHadiths = [];

    // Collect hadiths from specified file type or all files
    for (const file of collection.files) {
      if (!fileType || file.fileType === fileType) {
        for (const hadith of file.hadiths) {
          allHadiths.push({
            ...hadith,
            collectionId: collection.collectionId,
            collectionName: collection.collectionName,
            fileType: file.fileType
          });
        }
      }
    }

    // Apply pagination
    const total = allHadiths.length;
    const paginatedHadiths = allHadiths.slice(offset, offset + limit);

    return {
      hadiths: paginatedHadiths,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  /**
   * Get specific hadith by collection and ID
   */
  getHadith(collectionId, hadithId, fileType = 'regular') {
    const collection = this.getCollection(collectionId);
    if (!collection) return null;

    for (const file of collection.files) {
      if (file.fileType === fileType) {
        const hadith = file.hadiths.find(h => h.id === hadithId);
        if (hadith) {
          return {
            ...hadith,
            collectionId: collection.collectionId,
            collectionName: collection.collectionName,
            fileType: file.fileType
          };
        }
      }
    }

    return null;
  }

  /**
   * Basic text search across all hadiths
   */
  searchHadiths(query, options = {}) {
    const { 
      collectionId, 
      fileType,
      limit = 50, 
      offset = 0,
      exactMatch = false 
    } = options;

    if (!query || query.trim().length === 0) {
      return { hadiths: [], pagination: { total: 0, limit, offset, hasMore: false } };
    }

    const searchTerm = query.trim().toLowerCase();
    const results = [];

    for (const collection of this.data.collections) {
      // Filter by collection if specified
      if (collectionId && collection.collectionId !== collectionId) {
        continue;
      }

      for (const file of collection.files) {
        // Filter by file type if specified
        if (fileType && file.fileType !== fileType) {
          continue;
        }

        for (const hadith of file.hadiths) {
          const hadithText = hadith.text.toLowerCase();
          
          // Simple text matching (can be enhanced with better search algorithms)
          const matches = exactMatch 
            ? hadithText.includes(searchTerm)
            : this.fuzzySearch(hadithText, searchTerm);

          if (matches) {
            results.push({
              ...hadith,
              collectionId: collection.collectionId,
              collectionName: collection.collectionName,
              fileType: file.fileType,
              relevanceScore: this.calculateRelevance(hadithText, searchTerm)
            });
          }
        }
      }
    }

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply pagination
    const total = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

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
        options
      }
    };
  }

  /**
   * Simple fuzzy search (can be enhanced)
   */
  fuzzySearch(text, term) {
    // Simple word-based search
    const words = term.split(/\s+/);
    return words.some(word => text.includes(word));
  }

  /**
   * Calculate relevance score for search results
   */
  calculateRelevance(text, term) {
    const termLower = term.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Exact match gets highest score
    if (textLower.includes(termLower)) {
      const index = textLower.indexOf(termLower);
      // Earlier matches get higher scores
      return 100 - (index / text.length) * 50;
    }
    
    // Word-based matching
    const words = termLower.split(/\s+/);
    let score = 0;
    for (const word of words) {
      if (textLower.includes(word)) {
        score += 10;
      }
    }
    
    return score;
  }

  /**
   * Get statistics about the data
   */
  getStats() {
    if (!this.loaded) return null;

    return {
      metadata: this.data.metadata,
      collections: this.getCollections(),
      indexSize: this.searchIndex.size,
      memoryUsage: process.memoryUsage()
    };
  }
}

/**
 * Fastify plugin function
 */
async function dataLoaderPlugin(fastify, options) {
  const dataManager = new HadithDataManager();
  
  // Load data using enhanced loader (auto-detects split vs unified files)
  await dataManager.loadData();
  
  // Decorate fastify instance with data manager
  fastify.decorate('hadithData', dataManager);
  
  // Add hook to check data availability
  fastify.addHook('preHandler', async (request, reply) => {
    if (!fastify.hadithData.loaded) {
      reply.status(503).send({
        error: true,
        message: 'Hadith data not available',
        statusCode: 503
      });
    }
  });
  
  fastify.log.info('🗄️  Enhanced data loader plugin registered successfully');
}

module.exports = fp(dataLoaderPlugin, {
  name: 'hadith-data-loader',
  dependencies: []
});