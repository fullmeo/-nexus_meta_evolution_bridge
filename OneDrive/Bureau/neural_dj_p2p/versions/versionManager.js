#!/usr/bin/env node

/**
 * NeuralMix P2P Version Manager
 * 
 * A tool for managing versions of the NeuralMix P2P project.
 * This script provides functionality to create, update, archive, and compare versions.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  manifestPath: path.join(__dirname, 'version-manifest.json'),
  archivePath: path.join(__dirname, 'archive'),
  projectRoot: path.join(__dirname, '..')
};

// Ensure directories exist
if (!fs.existsSync(CONFIG.archivePath)) {
  fs.mkdirSync(CONFIG.archivePath, { recursive: true });
}

/**
 * Load the version manifest
 * @returns {Object} The version manifest
 */
function loadManifest() {
  try {
    const data = fs.readFileSync(CONFIG.manifestPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading manifest:', error.message);
    process.exit(1);
  }
}

/**
 * Save the version manifest
 * @param {Object} manifest The version manifest to save
 */
function saveManifest(manifest) {
  try {
    const data = JSON.stringify(manifest, null, 2);
    fs.writeFileSync(CONFIG.manifestPath, data, 'utf8');
    console.log('✅ Manifest saved successfully');
  } catch (error) {
    console.error('Error saving manifest:', error.message);
    process.exit(1);
  }
}

/**
 * Calculate a hash for a file
 * @param {string} filePath Path to the file
 * @returns {string} SHA-256 hash of the file
 */
function calculateFileHash(filePath) {
  try {
    const fileBuffer = fs.readFileSync(path.join(CONFIG.projectRoot, filePath));
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    console.warn(`Warning: Could not calculate hash for ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Create a new version
 * @param {string} versionNumber The new version number
 * @param {string} description Description of the version
 * @param {string} author Author of the version
 */
function createVersion(versionNumber, description, author) {
  const manifest = loadManifest();
  
  // Check if version already exists
  const versionExists = manifest.versions.some(v => v.version === versionNumber);
  if (versionExists) {
    console.error(`Error: Version ${versionNumber} already exists`);
    process.exit(1);
  }
  
  // Get the latest version
  const latestVersion = manifest.versions[manifest.versions.length - 1];
  
  // Create a new version based on the latest
  const newVersion = {
    version: versionNumber,
    date: new Date().toISOString(),
    author: author || 'Unknown',
    description: description || `Version ${versionNumber}`,
    files: [],
    changes: [description || `Updated to version ${versionNumber}`]
  };
  
  // Copy files from the latest version and update their info
  for (const file of latestVersion.files) {
    const filePath = file.path;
    const fileExists = fs.existsSync(path.join(CONFIG.projectRoot, filePath));
    
    if (fileExists) {
      const hash = calculateFileHash(filePath);
      const fileInfo = {
        path: filePath,
        type: file.type,
        version: versionNumber,
        status: file.status,
        hash: hash
      };
      newVersion.files.push(fileInfo);
    } else {
      console.warn(`Warning: File ${filePath} not found, skipping`);
    }
  }
  
  // Add the new version to the manifest
  manifest.versions.push(newVersion);
  
  // Update the latest version reference
  manifest.latest = {
    version: versionNumber,
    date: newVersion.date
  };
  
  // Save the updated manifest
  saveManifest(manifest);
  
  // Archive the current version
  archiveVersion(versionNumber);
  
  console.log(`✅ Created version ${versionNumber}`);
}

/**
 * Archive a version
 * @param {string} versionNumber The version to archive
 */
function archiveVersion(versionNumber) {
  const manifest = loadManifest();
  
  // Find the version
  const version = manifest.versions.find(v => v.version === versionNumber);
  if (!version) {
    console.error(`Error: Version ${versionNumber} not found`);
    return;
  }
  
  // Create a directory for the version
  const versionDir = path.join(CONFIG.archivePath, `v${versionNumber}`);
  if (!fs.existsSync(versionDir)) {
    fs.mkdirSync(versionDir, { recursive: true });
  }
  
  // Copy each file to the archive
  for (const file of version.files) {
    try {
      const sourcePath = path.join(CONFIG.projectRoot, file.path);
      const targetDir = path.join(versionDir, path.dirname(file.path));
      const targetPath = path.join(versionDir, file.path);
      
      // Create directory structure if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Copy the file
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Archived: ${file.path}`);
    } catch (error) {
      console.warn(`Warning: Could not archive ${file.path}: ${error.message}`);
    }
  }
  
  // Create a version info file
  const versionInfo = {
    ...version,
    archivedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(versionDir, 'version-info.json'),
    JSON.stringify(versionInfo, null, 2),
    'utf8'
  );
  
  console.log(`✅ Archived version ${versionNumber} to ${versionDir}`);
}

/**
 * List all versions
 */
function listVersions() {
  const manifest = loadManifest();
  
  console.log('\n📋 NeuralMix P2P Versions:');
  console.log('==========================');
  
  manifest.versions.forEach(version => {
    const date = new Date(version.date).toLocaleDateString();
    const isCurrent = version.version === manifest.latest.version;
    const marker = isCurrent ? '* ' : '  ';
    
    console.log(`${marker}v${version.version} (${date}) - ${version.description}`);
    console.log(`  Author: ${version.author}`);
    console.log(`  Files: ${version.files.length}`);
    console.log('  Changes:');
    version.changes.forEach(change => {
      console.log(`    - ${change}`);
    });
    console.log('');
  });
  
  console.log(`Current version: v${manifest.latest.version}`);
}

/**
 * Compare two versions
 * @param {string} version1 First version to compare
 * @param {string} version2 Second version to compare
 */
function compareVersions(version1, version2) {
  const manifest = loadManifest();
  
  // Find the versions
  const v1 = manifest.versions.find(v => v.version === version1);
  const v2 = manifest.versions.find(v => v.version === version2);
  
  if (!v1 || !v2) {
    console.error('Error: One or both versions not found');
    return;
  }
  
  console.log(`\n🔍 Comparing v${version1} and v${version2}:`);
  console.log('===============================');
  
  // Compare dates
  const date1 = new Date(v1.date);
  const date2 = new Date(v2.date);
  const timeDiff = Math.abs(date2 - date1);
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  
  console.log(`Time between versions: ${daysDiff} days`);
  console.log(`v${version1} author: ${v1.author}`);
  console.log(`v${version2} author: ${v2.author}`);
  
  // Compare files
  const files1 = v1.files.map(f => f.path);
  const files2 = v2.files.map(f => f.path);
  
  const addedFiles = files2.filter(f => !files1.includes(f));
  const removedFiles = files1.filter(f => !files2.includes(f));
  const commonFiles = files1.filter(f => files2.includes(f));
  
  console.log(`\nFiles added in v${version2}: ${addedFiles.length}`);
  addedFiles.forEach(f => console.log(`  + ${f}`));
  
  console.log(`\nFiles removed in v${version2}: ${removedFiles.length}`);
  removedFiles.forEach(f => console.log(`  - ${f}`));
  
  console.log(`\nCommon files: ${commonFiles.length}`);
  
  // Compare changes
  console.log('\nChanges:');
  console.log(`v${version1}:`);
  v1.changes.forEach(c => console.log(`  - ${c}`));
  
  console.log(`v${version2}:`);
  v2.changes.forEach(c => console.log(`  - ${c}`));
}

/**
 * Add a file to version tracking
 * @param {string} filePath Path to the file to add
 * @param {string} fileType Type of the file (html, javascript, css, etc.)
 */
function addFile(filePath, fileType) {
  const manifest = loadManifest();
  const latestVersion = manifest.latest.version;
  const version = manifest.versions.find(v => v.version === latestVersion);
  
  // Check if file exists
  const fullPath = path.join(CONFIG.projectRoot, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: File ${filePath} not found`);
    return;
  }
  
  // Check if file is already tracked
  const isTracked = version.files.some(f => f.path === filePath);
  if (isTracked) {
    console.error(`Error: File ${filePath} is already tracked`);
    return;
  }
  
  // Add the file to tracking
  const hash = calculateFileHash(filePath);
  const fileInfo = {
    path: filePath,
    type: fileType || getFileType(filePath),
    version: latestVersion,
    status: 'stable',
    hash: hash
  };
  
  version.files.push(fileInfo);
  
  // Save the updated manifest
  saveManifest(manifest);
  
  console.log(`✅ Added ${filePath} to version tracking`);
}

/**
 * Remove a file from version tracking
 * @param {string} filePath Path to the file to remove
 */
function removeFile(filePath) {
  const manifest = loadManifest();
  const latestVersion = manifest.latest.version;
  const version = manifest.versions.find(v => v.version === latestVersion);
  
  // Check if file is tracked
  const fileIndex = version.files.findIndex(f => f.path === filePath);
  if (fileIndex === -1) {
    console.error(`Error: File ${filePath} is not tracked`);
    return;
  }
  
  // Remove the file from tracking
  version.files.splice(fileIndex, 1);
  
  // Save the updated manifest
  saveManifest(manifest);
  
  console.log(`✅ Removed ${filePath} from version tracking`);
}

/**
 * Get the type of a file based on its extension
 * @param {string} filePath Path to the file
 * @returns {string} Type of the file
 */
function getFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    case '.html':
    case '.htm':
      return 'html';
    case '.js':
      return 'javascript';
    case '.css':
      return 'css';
    case '.json':
      return 'json';
    case '.md':
      return 'markdown';
    default:
      return 'other';
  }
}

/**
 * Generate a report for a version
 * @param {string} versionNumber The version to generate a report for
 */
function generateReport(versionNumber) {
  const manifest = loadManifest();
  
  // Find the version
  const version = manifest.versions.find(v => v.version === versionNumber);
  if (!version) {
    console.error(`Error: Version ${versionNumber} not found`);
    return;
  }
  
  // Create a report
  const report = {
    version: version.version,
    date: version.date,
    author: version.author,
    description: version.description,
    fileCount: version.files.length,
    fileTypes: {},
    changes: version.changes
  };
  
  // Count file types
  version.files.forEach(file => {
    if (!report.fileTypes[file.type]) {
      report.fileTypes[file.type] = 0;
    }
    report.fileTypes[file.type]++;
  });
  
  // Generate a report file
  const reportPath = path.join(CONFIG.archivePath, `report-v${versionNumber}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  
  console.log(`✅ Generated report for version ${versionNumber} at ${reportPath}`);
  
  // Print a summary
  console.log('\n📊 Version Report Summary:');
  console.log('=========================');
  console.log(`Version: v${report.version}`);
  console.log(`Date: ${new Date(report.date).toLocaleDateString()}`);
  console.log(`Author: ${report.author}`);
  console.log(`Description: ${report.description}`);
  console.log(`Total files: ${report.fileCount}`);
  
  console.log('\nFile types:');
  Object.entries(report.fileTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  console.log('\nChanges:');
  report.changes.forEach(change => {
    console.log(`  - ${change}`);
  });
}

/**
 * Main function to parse command line arguments and execute commands
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    showHelp();
    return;
  }
  
  switch (command) {
    case 'create':
      if (args.length < 2) {
        console.error('Error: Version number required');
        return;
      }
      createVersion(args[1], args[2], args[3]);
      break;
      
    case 'archive':
      if (args.length < 2) {
        console.error('Error: Version number required');
        return;
      }
      archiveVersion(args[1]);
      break;
      
    case 'list':
      listVersions();
      break;
      
    case 'compare':
      if (args.length < 3) {
        console.error('Error: Two version numbers required');
        return;
      }
      compareVersions(args[1], args[2]);
      break;
      
    case 'add':
      if (args.length < 2) {
        console.error('Error: File path required');
        return;
      }
      addFile(args[1], args[2]);
      break;
      
    case 'remove':
      if (args.length < 2) {
        console.error('Error: File path required');
        return;
      }
      removeFile(args[1]);
      break;
      
    case 'report':
      if (args.length < 2) {
        console.error('Error: Version number required');
        return;
      }
      generateReport(args[1]);
      break;
      
    case 'help':
      showHelp();
      break;
      
    default:
      console.error(`Error: Unknown command '${command}'`);
      showHelp();
  }
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
NeuralMix P2P Version Manager
=============================

Usage: node versionManager.js <command> [options]

Commands:
  create <version> [description] [author]  Create a new version
  archive <version>                        Archive a version
  list                                     List all versions
  compare <version1> <version2>            Compare two versions
  add <filePath> [fileType]                Add a file to version tracking
  remove <filePath>                        Remove a file from version tracking
  report <version>                         Generate a report for a version
  help                                     Show this help information

Examples:
  node versionManager.js create 11.1.0 "Fixed audio sync issues" "Serigne Diagne"
  node versionManager.js list
  node versionManager.js add src/js/newFeature.js javascript
  node versionManager.js compare 11.0.0 11.1.0
  `);
}

// Execute the main function
main();