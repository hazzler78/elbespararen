#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Clean build script to remove large cache files before deployment
 */

console.log('🧹 Cleaning build artifacts...');

const pathsToRemove = [
  '.next/cache',
  'cache',
];

let removedCount = 0;
let errorCount = 0;

pathsToRemove.forEach(dirPath => {
  const fullPath = path.join(process.cwd(), dirPath);
  
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Removed: ${dirPath}`);
      removedCount++;
    } catch (error) {
      console.error(`❌ Failed to remove ${dirPath}:`, error.message);
      errorCount++;
    }
  } else {
    console.log(`⏭️  Skipping (not found): ${dirPath}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Removed: ${removedCount}`);
console.log(`   Errors: ${errorCount}`);
console.log(`   ✅ Build cleaning complete!`);

process.exit(errorCount > 0 ? 1 : 0);

