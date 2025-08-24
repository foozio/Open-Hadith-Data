/**
 * Enhanced Hadith Data Loader
 * 
 * This module handles loading hadith data from either:
 * 1. Split collection files (collections/*.json)
 * 2. Unified data file (hadith-data.json) - fallback
 * 
 * Provides the same interface regardless of storage method.
 */

const fs = require('fs');
const path = require('path');

class HadithDataLoader {
    constructor() {
        this.data = null;
        this.isLoaded = false;
        this.loadingMethod = null;
        this.stats = {
            collectionsCount: 0,
            hadithsCount: 0,
            loadTime: 0,
            memoryUsage: 0
        };
    }

    /**
     * Load hadith data using the best available method
     */
    async loadData() {
        const startTime = Date.now();
        console.log('🔄 Loading hadith data...');

        try {
            // Try to load from split files first
            if (await this.loadFromSplitFiles()) {
                this.loadingMethod = 'split-files';
                console.log('✅ Loaded data from split collection files');
            }
            // Fallback to unified file
            else if (await this.loadFromUnifiedFile()) {
                this.loadingMethod = 'unified-file';
                console.log('✅ Loaded data from unified hadith-data.json');
            }
            else {
                throw new Error('No data files found');
            }

            this.isLoaded = true;
            const endTime = Date.now();
            this.stats.loadTime = endTime - startTime;
            
            // Calculate memory usage
            const memUsage = process.memoryUsage();
            this.stats.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024);

            console.log(`📊 Data loaded successfully:`);
            console.log(`   Method: ${this.loadingMethod}`);
            console.log(`   Collections: ${this.stats.collectionsCount}`);
            console.log(`   Hadiths: ${this.stats.hadithsCount.toLocaleString()}`);
            console.log(`   Load Time: ${this.stats.loadTime}ms`);
            console.log(`   Memory Usage: ${this.stats.memoryUsage}MB`);

            return this.data;
        } catch (error) {
            console.error('❌ Failed to load hadith data:', error.message);
            throw error;
        }
    }

    /**
     * Load data from split collection files
     */
    async loadFromSplitFiles() {
        const collectionsDir = path.join(__dirname, '../../data/collections');
        const manifestPath = path.join(__dirname, '../../data/collections-manifest.json');

        console.log(`📁 Checking for split files in: ${collectionsDir}`);
        console.log(`📋 Checking for manifest at: ${manifestPath}`);

        // Check if split files exist
        if (!fs.existsSync(collectionsDir) || !fs.existsSync(manifestPath)) {
            console.log('⚠️  Split files or manifest not found');
            return false;
        }

        try {
            // Read manifest
            const manifestData = fs.readFileSync(manifestPath, 'utf8');
            const manifest = JSON.parse(manifestData);

            console.log(`📋 Found manifest with ${manifest.totalCollections} collections`);

            // Load all collection files
            const collections = [];
            let totalHadiths = 0;

            for (const fileInfo of manifest.files) {
                const filePath = path.join(collectionsDir, fileInfo.filename);
                
                if (fs.existsSync(filePath)) {
                    const fileData = fs.readFileSync(filePath, 'utf8');
                    const collectionData = JSON.parse(fileData);
                    
                    collections.push(collectionData.collection);
                    totalHadiths += fileInfo.hadithCount;
                    
                    console.log(`  📖 Loaded ${fileInfo.collectionName} (${fileInfo.hadithCount} hadiths)`);
                } else {
                    console.warn(`⚠️  Missing file: ${fileInfo.filename}`);
                }
            }

            // Reconstruct the original data structure
            this.data = {
                collections: collections,
                metadata: {
                    loadedFrom: 'split-files',
                    manifest: manifest,
                    loadedAt: new Date().toISOString()
                }
            };

            this.stats.collectionsCount = collections.length;
            this.stats.hadithsCount = totalHadiths;

            return true;
        } catch (error) {
            console.error('Failed to load from split files:', error.message);
            return false;
        }
    }

    /**
     * Load data from unified hadith-data.json file
     */
    async loadFromUnifiedFile() {
        const unifiedPath = path.join(__dirname, '../../data/hadith-data.json');

        console.log(`📜 Checking for unified file at: ${unifiedPath}`);

        if (!fs.existsSync(unifiedPath)) {
            console.log('⚠️  Unified file not found');
            return false;
        }

        try {
            console.log('📖 Loading from unified hadith-data.json...');
            const rawData = fs.readFileSync(unifiedPath, 'utf8');
            this.data = JSON.parse(rawData);

            // Calculate statistics
            let totalHadiths = 0;
            if (this.data.collections && Array.isArray(this.data.collections)) {
                this.data.collections.forEach(collection => {
                    if (collection.files && Array.isArray(collection.files)) {
                        collection.files.forEach(file => {
                            if (file.hadiths && Array.isArray(file.hadiths)) {
                                totalHadiths += file.hadiths.length;
                            }
                        });
                    }
                });
            }

            this.stats.collectionsCount = this.data.collections ? this.data.collections.length : 0;
            this.stats.hadithsCount = totalHadiths;

            return true;
        } catch (error) {
            console.error('Failed to load unified file:', error.message);
            return false;
        }
    }

    /**
     * Get all collections
     */
    getCollections() {
        if (!this.isLoaded) {
            throw new Error('Data not loaded. Call loadData() first.');
        }
        return this.data.collections || [];
    }

    /**
     * Get collection by ID
     */
    getCollection(collectionId) {
        const collections = this.getCollections();
        return collections.find(c => c.collectionId === collectionId);
    }

    /**
     * Get all hadiths from a collection
     */
    getCollectionHadiths(collectionId, options = {}) {
        const collection = this.getCollection(collectionId);
        if (!collection) return [];

        let allHadiths = [];
        
        if (collection.files && Array.isArray(collection.files)) {
            collection.files.forEach(file => {
                if (file.hadiths && Array.isArray(file.hadiths)) {
                    file.hadiths.forEach(hadith => {
                        allHadiths.push({
                            ...hadith,
                            collectionId: collection.collectionId,
                            collectionName: collection.collectionName,
                            fileType: file.fileType
                        });
                    });
                }
            });
        }

        // Apply pagination if specified
        if (options.limit || options.offset) {
            const offset = parseInt(options.offset) || 0;
            const limit = parseInt(options.limit) || 50;
            return allHadiths.slice(offset, offset + limit);
        }

        return allHadiths;
    }

    /**
     * Search hadiths across all collections
     */
    searchHadiths(query, options = {}) {
        if (!query || typeof query !== 'string') return [];
        
        const searchTerm = query.toLowerCase().trim();
        const results = [];
        const collections = this.getCollections();

        collections.forEach(collection => {
            // Filter by collection if specified
            if (options.collections && !options.collections.includes(collection.collectionId)) {
                return;
            }

            if (collection.files && Array.isArray(collection.files)) {
                collection.files.forEach(file => {
                    // Filter by file type if specified
                    if (options.fileTypes && !options.fileTypes.includes(file.fileType)) {
                        return;
                    }

                    if (file.hadiths && Array.isArray(file.hadiths)) {
                        file.hadiths.forEach(hadith => {
                            if (hadith.text && hadith.text.toLowerCase().includes(searchTerm)) {
                                results.push({
                                    ...hadith,
                                    collectionId: collection.collectionId,
                                    collectionName: collection.collectionName,
                                    collectionNameArabic: collection.collectionNameArabic,
                                    fileType: file.fileType,
                                    relevanceScore: this.calculateRelevance(hadith.text, searchTerm)
                                });
                            }
                        });
                    }
                });
            }
        });

        // Sort by relevance
        results.sort((a, b) => b.relevanceScore - a.relevanceScore);

        // Apply pagination
        if (options.limit || options.offset) {
            const offset = parseInt(options.offset) || 0;
            const limit = parseInt(options.limit) || 50;
            return results.slice(offset, offset + limit);
        }

        return results;
    }

    /**
     * Calculate relevance score for search results
     */
    calculateRelevance(text, searchTerm) {
        if (!text || !searchTerm) return 0;
        
        const lowerText = text.toLowerCase();
        const lowerSearch = searchTerm.toLowerCase();
        
        // Count occurrences
        const matches = (lowerText.match(new RegExp(lowerSearch, 'g')) || []).length;
        
        // Base score from match count
        let score = matches * 100;
        
        // Bonus for matches at the beginning
        if (lowerText.startsWith(lowerSearch)) {
            score += 50;
        }
        
        // Bonus for exact word matches
        const wordBoundaryRegex = new RegExp(`\\b${lowerSearch}\\b`, 'g');
        const exactMatches = (lowerText.match(wordBoundaryRegex) || []).length;
        score += exactMatches * 25;
        
        // Penalty for longer texts (prefer shorter, more relevant results)
        score = score / Math.sqrt(text.length / 100);
        
        return Math.round(score);
    }

    /**
     * Get loading statistics
     */
    getStats() {
        return {
            ...this.stats,
            isLoaded: this.isLoaded,
            loadingMethod: this.loadingMethod
        };
    }
}

module.exports = HadithDataLoader;