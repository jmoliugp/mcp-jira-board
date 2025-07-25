#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '..', 'dist');

function addExtensionsToFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Add .js extension to local imports (those starting with ./ or ../)
    content = content.replace(/from ['"](\.\.?\/[^'"]*)['"]/g, (match, importPath) => {
      // Skip if it already has an extension
      if (importPath.endsWith('.js')) {
        return match;
      }
      // Skip if it's a package import (doesn't start with .)
      if (!importPath.startsWith('.')) {
        return match;
      }
      return `from '${importPath}.js'`;
    });

    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.js')) {
      addExtensionsToFile(filePath);
    }
  }
}

console.log('🔧 Adding .js extensions to local imports...');
processDirectory(distDir);
console.log('✅ Finished adding extensions!');
