const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);

// Configuration
const SRC_DIR = path.join(__dirname, '../public/images');
const DEST_DIR = path.join(__dirname, '../public/optimized-images');
const QUALITY = 85;
const WIDTHS = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
const FORMATS = ['webp', 'avif'];

// Ensure the output directory exists
async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

// Process a single image
async function processImage(filePath, relativePath) {
  const ext = path.extname(filePath).toLowerCase();
  const name = path.basename(filePath, ext);
  
  // Skip non-image files
  if (!['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
    return;
  }
  
  console.log(`Processing ${filePath}...`);
  
  try {
    // Read the image
    const image = sharp(filePath);
    const metadata = await image.metadata();
    
    // Process for each format
    for (const format of FORMATS) {
      // Skip if already in the target format
      if (ext === `.${format}`) continue;
      
      // Create output directory
      const formatDir = path.join(DEST_DIR, format, path.dirname(relativePath));
      await ensureDir(formatDir);
      
      // Generate responsive sizes
      for (const width of WIDTHS) {
        if (width > metadata.width) continue;
        
        const outputPath = path.join(
          formatDir,
          `${name}-${width}w.${format}`
        );
        
        // Skip if already processed
        if (fs.existsSync(outputPath)) continue;
        
        // Resize and convert
        await image
          .resize(width)
          [format]({ quality: QUALITY })
          .toFile(outputPath);
        
        console.log(`  → ${outputPath}`);
      }
    }
    
    // Generate a placeholder
    const placeholder = await image
      .resize(20, 20)
      .blur()
      .toBuffer();
    
    return {
      src: `/optimized-images/webp/${relativePath.replace(/\.[^/.]+$/, '')}.webp`,
      placeholder: `data:image/webp;base64,${placeholder.toString('base64')}`,
      width: metadata.width,
      height: metadata.height,
      alt: name.replace(/[-_]/g, ' '),
    };
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

// Recursively process a directory
async function processDirectory(dir, relativeDir = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(relativeDir, entry.name);
    
    if (entry.isDirectory()) {
      const subResults = await processDirectory(fullPath, relativePath);
      results.push(...subResults);
    } else {
      const result = await processImage(fullPath, relativePath);
      if (result) {
        results.push({
          ...result,
          name: path.basename(entry.name, path.extname(entry.name)),
        });
      }
    }
  }
  
  return results;
}

// Main function
async function main() {
  console.log('Starting image optimization...');
  
  try {
    // Ensure the output directory exists
    await ensureDir(DEST_DIR);
    
    // Process all images
    const results = await processDirectory(SRC_DIR);
    
    // Save the results to a JSON file
    const outputPath = path.join(DEST_DIR, 'images.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    console.log(`\nOptimization complete! Processed ${results.length} images.`);
    console.log(`Results saved to ${outputPath}`);
  } catch (err) {
    console.error('Error during optimization:', err);
    process.exit(1);
  }
}

// Run the script
main();
