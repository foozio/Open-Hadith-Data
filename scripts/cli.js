#!/usr/bin/env node

const { HadithConverter } = require('./csv-to-json-converter');
const path = require('path');

/**
 * Command Line Interface for Hadith CSV to JSON Converter
 */

function showHelp() {
    console.log(`
🕌 Hadith CSV to JSON Converter

Usage:
  npm run convert [data-directory] [output-file]
  node scripts/cli.js [data-directory] [output-file]

Arguments:
  data-directory    Directory containing hadith collection folders (default: current directory)
  output-file       Output JSON file path (default: ./data/hadith-data.json)

Examples:
  npm run convert
  npm run convert . ./output/hadith-complete.json
  npm run convert /path/to/hadith-data ./data/hadith.json

Options:
  --help, -h        Show this help message
  --version, -v     Show version information

The script will:
1. 📁 Scan for collection directories (Sahih_Al-Bukhari, Sahih_Muslim, etc.)
2. 📖 Process all CSV files in each collection
3. 🔄 Convert to structured JSON following the schema
4. 💾 Save the complete dataset to the output file

Supported Collections:
  • Sahih Al-Bukhari
  • Sahih Muslim  
  • Sunan Abu-Dawud
  • Sunan Al-Tirmidhi
  • Sunan Al-Nasai
  • Sunan Ibn-Maja
  • Maliks Muwataa
  • Sunan Al-Darimi
  • Musnad Ahmad Ibn-Hanbal
`);
}

function showVersion() {
    const pkg = require('../package.json');
    console.log(`Hadith Converter v${pkg.version}`);
}

async function main() {
    const args = process.argv.slice(2);
    
    // Handle help and version flags
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }
    
    if (args.includes('--version') || args.includes('-v')) {
        showVersion();
        return;
    }

    // Get arguments with defaults
    const dataDir = args[0] || process.cwd();
    const outputPath = args[1] || path.join(process.cwd(), 'data', 'hadith-data.json');

    console.log('🕌 Hadith CSV to JSON Converter\n');
    console.log(`📁 Data Directory: ${dataDir}`);
    console.log(`💾 Output File: ${outputPath}\n`);

    try {
        const converter = new HadithConverter();
        const jsonData = await converter.convertAll(dataDir);
        await converter.saveToFile(jsonData, outputPath);
        
        console.log('\n🎉 Conversion completed successfully!');
        console.log(`📄 Output saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('\n❌ Conversion failed:', error.message);
        
        if (error.code === 'ENOENT') {
            console.error('💡 Make sure the data directory exists and contains hadith collection folders');
        } else if (error.message.includes('Unknown collection')) {
            console.error('💡 Ensure collection directories have correct names (e.g., Sahih_Al-Bukhari)');
        }
        
        console.error('\nFor help, run: npm run convert -- --help');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}