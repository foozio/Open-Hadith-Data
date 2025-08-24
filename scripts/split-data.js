#!/usr/bin/env node

/**
 * Data Splitter Script for Open Hadith Data
 * 
 * This script splits the large hadith-data.json file into smaller,
 * manageable files that can be committed to GitHub without LFS.
 * Each collection gets its own file under 100MB.
 */

const fs = require('fs');
const path = require('path');

// File paths
const INPUT_FILE = path.join(__dirname, '../data/hadith-data.json');
const OUTPUT_DIR = path.join(__dirname, '../data/collections');
const MANIFEST_FILE = path.join(__dirname, '../data/collections-manifest.json');

console.log('🔄 Starting data split process...');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log('📁 Created collections directory');
}

try {
    // Read the large JSON file
    console.log('📖 Reading hadith-data.json...');
    const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
    const data = JSON.parse(rawData);
    
    if (!data.collections || !Array.isArray(data.collections)) {
        throw new Error('Invalid data structure: missing collections array');
    }
    
    console.log(`📊 Found ${data.collections.length} collections to process`);
    
    // Manifest to track all collections
    const manifest = {
        version: "1.4.0",
        generatedAt: new Date().toISOString(),
        totalCollections: data.collections.length,
        files: []
    };
    
    let totalHadiths = 0;
    let totalSize = 0;
    
    // Process each collection
    data.collections.forEach((collection, index) => {
        const filename = `${collection.collectionId}.json`;
        const filepath = path.join(OUTPUT_DIR, filename);
        
        // Create individual collection file
        const collectionData = {
            collection: collection,
            metadata: {
                splitFrom: 'hadith-data.json',
                generatedAt: new Date().toISOString(),
                version: "1.4.0"
            }
        };
        
        // Write collection file
        const jsonString = JSON.stringify(collectionData, null, 2);
        fs.writeFileSync(filepath, jsonString, 'utf8');
        
        // Calculate statistics
        const fileSize = Buffer.byteLength(jsonString, 'utf8');
        const hadithCount = collection.files ? 
            collection.files.reduce((sum, file) => sum + (file.hadiths ? file.hadiths.length : 0), 0) : 0;
        
        totalHadiths += hadithCount;
        totalSize += fileSize;
        
        // Add to manifest
        manifest.files.push({
            collectionId: collection.collectionId,
            collectionName: collection.collectionName,
            collectionNameArabic: collection.collectionNameArabic,
            filename: filename,
            fileSizeMB: (fileSize / (1024 * 1024)).toFixed(2),
            hadithCount: hadithCount
        });
        
        console.log(`✅ [${index + 1}/${data.collections.length}] ${collection.collectionName} → ${filename} (${(fileSize / (1024 * 1024)).toFixed(2)}MB, ${hadithCount} hadiths)`);
    });
    
    // Add summary to manifest
    manifest.summary = {
        totalHadiths: totalHadiths,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        largestFileMB: Math.max(...manifest.files.map(f => parseFloat(f.fileSizeMB))).toFixed(2),
        averageFileSizeMB: (totalSize / (1024 * 1024) / manifest.files.length).toFixed(2)
    };
    
    // Write manifest file
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf8');
    
    console.log('\n📋 Split Summary:');
    console.log(`   Total Collections: ${manifest.totalCollections}`);
    console.log(`   Total Hadiths: ${totalHadiths.toLocaleString()}`);
    console.log(`   Total Size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   Largest File: ${manifest.summary.largestFileMB} MB`);
    console.log(`   Average File Size: ${manifest.summary.averageFileSizeMB} MB`);
    console.log(`\n✅ Data split complete!`);
    console.log(`📁 Files created in: ${OUTPUT_DIR}`);
    console.log(`📋 Manifest created: ${MANIFEST_FILE}`);
    
} catch (error) {
    console.error('❌ Error splitting data:', error.message);
    process.exit(1);
}