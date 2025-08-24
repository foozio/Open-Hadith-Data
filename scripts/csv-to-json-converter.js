#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

/**
 * CSV to JSON Converter for Hadith Data
 * Converts CSV files to structured JSON following the hadith-schema.json
 * Handles UTF-8 encoding and Arabic text processing
 */

class HadithConverter {
    constructor() {
        this.collections = [];
        this.metadata = {
            generatedAt: new Date().toISOString(),
            version: "1.0.0",
            sourceFormat: "CSV",
            encoding: "UTF-8",
            totalCollections: 0,
            totalFiles: 0,
            totalHadiths: 0,
            collections: []
        };
        
        // Collection mapping with proper names
        this.collectionMap = {
            'Sahih_Al-Bukhari': {
                id: 'sahih_al_bukhari',
                name: 'Sahih Al-Bukhari',
                nameArabic: 'صحيح البخاري'
            },
            'Sahih_Muslim': {
                id: 'sahih_muslim',
                name: 'Sahih Muslim',
                nameArabic: 'صحيح مسلم'
            },
            'Sunan_Abu-Dawud': {
                id: 'sunan_abu_dawud',
                name: 'Sunan Abu-Dawud',
                nameArabic: 'سنن أبي داود'
            },
            'Sunan_Al-Tirmidhi': {
                id: 'sunan_al_tirmidhi',
                name: 'Sunan Al-Tirmidhi',
                nameArabic: 'سنن الترمذي'
            },
            'Sunan_Al-Nasai': {
                id: 'sunan_al_nasai',
                name: 'Sunan Al-Nasai',
                nameArabic: 'سنن النسائي'
            },
            'Sunan_Ibn-Maja': {
                id: 'sunan_ibn_maja',
                name: 'Sunan Ibn-Maja',
                nameArabic: 'سنن ابن ماجه'
            },
            'Maliks_Muwataa': {
                id: 'maliks_muwataa',
                name: 'Maliks Muwataa',
                nameArabic: 'موطأ مالك'
            },
            'Sunan_Al-Darimi': {
                id: 'sunan_al_darimi',
                name: 'Sunan Al-Darimi',
                nameArabic: 'سنن الدارمي'
            },
            'Musnad_Ahmad_Ibn-Hanbal': {
                id: 'musnad_ahmad_ibn_hanbal',
                name: 'Musnad Ahmad Ibn-Hanbal',
                nameArabic: 'مسند أحمد بن حنبل'
            }
        };
    }

    /**
     * Check if text contains Arabic diacritical marks
     * @param {string} text - Arabic text to check
     * @returns {boolean} - True if text has diacritics
     */
    hasArabicDiacritics(text) {
        // Arabic diacritical marks Unicode ranges
        const diacriticRegex = /[\u064B-\u065F\u0670\u06D6-\u06ED]/;
        return diacriticRegex.test(text);
    }

    /**
     * Clean and normalize Arabic text
     * @param {string} text - Raw text from CSV
     * @returns {string} - Cleaned text
     */
    cleanArabicText(text) {
        if (!text) return '';
        
        // Remove surrounding quotes and extra whitespace
        let cleaned = text.toString().trim();
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.slice(1, -1);
        }
        
        // Normalize whitespace but preserve Arabic text structure
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        
        return cleaned;
    }

    /**
     * Determine file type based on filename
     * @param {string} fileName - CSV filename
     * @returns {string} - File type
     */
    getFileType(fileName) {
        if (fileName.includes('mushakkala') || fileName.includes('mufassala')) {
            return 'mushakkala_mufassala';
        }
        return 'regular';
    }

    /**
     * Parse a single CSV file
     * @param {string} filePath - Path to CSV file
     * @returns {Promise<Object>} - Parsed file data
     */
    async parseCSVFile(filePath) {
        return new Promise((resolve, reject) => {
            const hadiths = [];
            const fileName = path.basename(filePath);
            const fileType = this.getFileType(fileName);
            
            console.log(`📖 Processing: ${fileName}`);
            
            fs.createReadStream(filePath, { encoding: 'utf8' })
                .pipe(csv({
                    headers: ['id', 'text'],
                    skipEmptyLines: true,
                    strict: false
                }))
                .on('data', (row) => {
                    try {
                        const cleanText = this.cleanArabicText(row.text);
                        if (cleanText && row.id) {
                            const hadith = {
                                id: row.id.toString().trim(),
                                text: cleanText,
                                textLength: cleanText.length,
                                hasFullDiacritics: this.hasArabicDiacritics(cleanText)
                            };
                            hadiths.push(hadith);
                        }
                    } catch (error) {
                        console.warn(`⚠️  Warning: Error processing row in ${fileName}:`, error.message);
                    }
                })
                .on('end', () => {
                    console.log(`✅ Processed ${hadiths.length} hadiths from ${fileName}`);
                    resolve({
                        fileType,
                        fileName,
                        hadiths,
                        count: hadiths.length
                    });
                })
                .on('error', (error) => {
                    console.error(`❌ Error reading ${fileName}:`, error);
                    reject(error);
                });
        });
    }

    /**
     * Process a single collection directory
     * @param {string} collectionPath - Path to collection directory
     * @returns {Promise<Object>} - Collection data
     */
    async processCollection(collectionPath) {
        const collectionName = path.basename(collectionPath);
        const collectionInfo = this.collectionMap[collectionName];
        
        if (!collectionInfo) {
            throw new Error(`Unknown collection: ${collectionName}`);
        }

        console.log(`\n📚 Processing collection: ${collectionInfo.name}`);
        
        // Find CSV files in the collection directory
        const files = fs.readdirSync(collectionPath)
            .filter(file => file.endsWith('.csv'))
            .map(file => path.join(collectionPath, file));

        if (files.length === 0) {
            console.warn(`⚠️  No CSV files found in ${collectionName}`);
            return null;
        }

        // Process all CSV files in this collection
        const fileDataPromises = files.map(file => this.parseCSVFile(file));
        const filesData = await Promise.all(fileDataPromises);

        // Calculate total hadiths for this collection
        const totalHadiths = filesData.reduce((sum, file) => sum + file.count, 0);

        const collection = {
            collectionId: collectionInfo.id,
            collectionName: collectionInfo.name,
            collectionNameArabic: collectionInfo.nameArabic,
            files: filesData,
            totalHadiths
        };

        // Update metadata
        this.metadata.collections.push({
            collectionId: collectionInfo.id,
            collectionName: collectionInfo.name,
            hadithCount: totalHadiths,
            fileTypes: filesData.map(f => f.fileType)
        });

        console.log(`✅ Collection ${collectionInfo.name}: ${totalHadiths} total hadiths`);
        return collection;
    }

    /**
     * Process all collections in the data directory
     * @param {string} dataDir - Root data directory path
     * @returns {Promise<Object>} - Complete JSON structure
     */
    async convertAll(dataDir) {
        console.log('🚀 Starting CSV to JSON conversion...\n');
        
        // Find all collection directories
        const entries = fs.readdirSync(dataDir, { withFileTypes: true });
        const collectionDirs = entries
            .filter(entry => entry.isDirectory() && this.collectionMap[entry.name])
            .map(entry => path.join(dataDir, entry.name));

        if (collectionDirs.length === 0) {
            throw new Error('No valid collection directories found');
        }

        console.log(`Found ${collectionDirs.length} collections to process\n`);

        // Process all collections
        const collectionPromises = collectionDirs.map(dir => this.processCollection(dir));
        const results = await Promise.all(collectionPromises);
        
        // Filter out null results and store valid collections
        this.collections = results.filter(collection => collection !== null);

        // Update final metadata
        this.metadata.totalCollections = this.collections.length;
        this.metadata.totalFiles = this.collections.reduce((sum, col) => sum + col.files.length, 0);
        this.metadata.totalHadiths = this.collections.reduce((sum, col) => sum + col.totalHadiths, 0);

        const result = {
            collections: this.collections,
            metadata: this.metadata
        };

        console.log('\n📊 Conversion Summary:');
        console.log(`   Collections: ${this.metadata.totalCollections}`);
        console.log(`   Files: ${this.metadata.totalFiles}`);
        console.log(`   Total Hadiths: ${this.metadata.totalHadiths.toLocaleString()}`);

        return result;
    }

    /**
     * Save JSON data to file
     * @param {Object} data - JSON data to save
     * @param {string} outputPath - Output file path
     */
    async saveToFile(data, outputPath) {
        console.log(`\n💾 Saving to ${outputPath}...`);
        
        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write JSON file with proper formatting
        const jsonString = JSON.stringify(data, null, 2);
        fs.writeFileSync(outputPath, jsonString, 'utf8');
        
        const fileSizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
        console.log(`✅ JSON file saved successfully (${fileSizeMB} MB)`);
    }
}

/**
 * Main execution function
 */
async function main() {
    try {
        const args = process.argv.slice(2);
        const dataDir = args[0] || '.';
        const outputPath = args[1] || './data/hadith-data.json';

        const converter = new HadithConverter();
        const jsonData = await converter.convertAll(dataDir);
        await converter.saveToFile(jsonData, outputPath);

        console.log('\n🎉 Conversion completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Conversion failed:', error.message);
        process.exit(1);
    }
}

// Run the converter if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = { HadithConverter };