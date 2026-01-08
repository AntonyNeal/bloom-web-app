#!/usr/bin/env node
/**
 * Verify Function Registration
 * 
 * This script ensures that all compiled functions in dist/functions/ are properly
 * imported in index.ts. If a function is compiled but not imported, it won't be
 * registered with Azure Functions and will return 404.
 * 
 * Usage: node verify-function-registration.js
 * Exit codes: 0 = success, 1 = missing registrations found
 */

const fs = require('fs');
const path = require('path');

const FUNCTIONS_DIR = path.join(__dirname, 'dist', 'functions');
const INDEX_FILE = path.join(__dirname, 'src', 'index.ts');

// Functions that are intentionally not registered (e.g., utilities, not HTTP triggers)
const EXCLUDED_FUNCTIONS = new Set([
  'halaxy-webhook', // Queue trigger, not HTTP
  'process-booking-notification', // Queue trigger
  'admin-run-migration', // Internal only
]);

console.log('🔍 Verifying function registration...\n');

// Get all compiled function files
const compiledFunctions = fs.readdirSync(FUNCTIONS_DIR)
  .filter(file => file.endsWith('.js') && !file.endsWith('.map'))
  .map(file => file.replace('.js', ''))
  .filter(name => !EXCLUDED_FUNCTIONS.has(name))
  .sort();

console.log(`📁 Found ${compiledFunctions.length} compiled functions in dist/functions/`);

// Read index.ts and find all imports
const indexContent = fs.readFileSync(INDEX_FILE, 'utf-8');
const importedFunctions = [];
const importRegex = /import\s+['"]\.\/functions\/([^'"]+)['"]/g;
let match;

while ((match = importRegex.exec(indexContent)) !== null) {
  importedFunctions.push(match[1]);
}

console.log(`📝 Found ${importedFunctions.length} functions imported in src/index.ts\n`);

// Find functions that are compiled but not imported
const missingImports = compiledFunctions.filter(
  fn => !importedFunctions.includes(fn)
);

// Find imports that don't have corresponding compiled files
const extraImports = importedFunctions.filter(
  fn => !compiledFunctions.includes(fn) && !EXCLUDED_FUNCTIONS.has(fn)
);

// Report results
let hasErrors = false;

if (missingImports.length > 0) {
  hasErrors = true;
  console.error('❌ MISSING FUNCTION REGISTRATIONS:');
  console.error('   These functions are compiled but NOT imported in src/index.ts:');
  console.error('   They will NOT be available in Azure Functions!\n');
  missingImports.forEach(fn => {
    console.error(`   ✗ ${fn}`);
    console.error(`     Add: import './functions/${fn}';`);
  });
  console.error('');
}

if (extraImports.length > 0) {
  console.warn('⚠️  WARNING: Extra imports found:');
  console.warn('   These are imported but not compiled:');
  extraImports.forEach(fn => {
    console.warn(`   - ${fn}`);
  });
  console.warn('');
}

if (!hasErrors && extraImports.length === 0) {
  console.log('✅ All functions are properly registered!');
  console.log(`   ${compiledFunctions.length} functions compiled and imported\n`);
  
  // Show the list for confirmation
  console.log('📋 Registered functions:');
  compiledFunctions.forEach(fn => {
    console.log(`   ✓ ${fn}`);
  });
  
  process.exit(0);
} else if (!hasErrors) {
  console.log('✅ All compiled functions are registered (warnings only)\n');
  process.exit(0);
} else {
  console.error('❌ Function registration verification FAILED!');
  console.error('   Fix the missing imports in src/index.ts and rebuild.\n');
  process.exit(1);
}
