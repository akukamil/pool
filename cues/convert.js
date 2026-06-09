const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const inputFolder = './original';    // Change this to your source folder
const outputFolder = './converted';    // Change this to your destination folder
const targetWidth = 800;

// Ensure output directory exists
if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
    console.log(`Created output folder: ${outputFolder}`);
}

// Read all files from input folder
fs.readdir(inputFolder, (err, files) => {
    if (err) {
        console.error('Error reading input folder:', err);
        return;
    }

    // Filter only .webp files
    const webpFiles = files.filter(file => path.extname(file).toLowerCase() === '.webp');

    if (webpFiles.length === 0) {
        console.log('No WebP files found in the input folder.');
        return;
    }

    console.log(`Found ${webpFiles.length} WebP file(s). Starting conversion...\n`);

    let processedCount = 0;
    let errorCount = 0;

    webpFiles.forEach(file => {
        const inputPath = path.join(inputFolder, file);
		const only_file_name=path.basename(file, '.webp').slice(5, -4);
        const outputFilename = only_file_name + '.png';
        const outputPath = path.join(outputFolder, outputFilename);

        // Process each image with Sharp
        sharp(inputPath)
            .resize(targetWidth, null, {
                // null for height maintains aspect ratio
                withoutEnlargement: true, // Don't enlarge if image is smaller than target width
                fit: 'contain'
            })
            .png({
                compressionLevel: 9,      // Maximum compression (0-9)
                quality: 100              // High quality
            })
            .toFile(outputPath)
            .then(() => {
                processedCount++;
                console.log(`✓ Converted: ${file} -> ${outputFilename} (Width: ${targetWidth}px)`);
                
                if (processedCount + errorCount === webpFiles.length) {
                    console.log(`\n✅ Conversion complete!`);
                    console.log(`   Successfully converted: ${processedCount} files`);
                    if (errorCount > 0) {
                        console.log(`   Failed: ${errorCount} files`);
                    }
                    console.log(`   Output folder: ${outputFolder}`);
                }
            })
            .catch(error => {
                errorCount++;
                console.error(`✗ Error processing ${file}:`, error.message);
                
                if (processedCount + errorCount === webpFiles.length) {
                    console.log(`\n✅ Conversion complete!`);
                    console.log(`   Successfully converted: ${processedCount} files`);
                    console.log(`   Failed: ${errorCount} files`);
                }
            });
    });
});