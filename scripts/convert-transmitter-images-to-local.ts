#!/usr/bin/env tsx

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { execSync } from 'child_process';

interface TransmitterImageInfo {
  yamlPath: string;
  yamlId: string;
  imageUrl: string;
  localFilename: string;
}

const TRANSMITTERS_DIR = '/home/green/workspace/FCBase/src/content/transmitters';
const IMAGES_DIR = '/home/green/workspace/FCBase/src/assets/images/transmitters';

// Create images directory if it doesn't exist
if (!existsSync(IMAGES_DIR)) {
  mkdirSync(IMAGES_DIR, { recursive: true });
  console.log(`📁 Created directory: ${IMAGES_DIR}\n`);
}

function extractImageUrl(yamlContent: string): string | null {
  const match = yamlContent.match(/src:\s*"(https?:\/\/[^"]+)"/);
  return match ? match[1] : null;
}

function getImageExtension(url: string): string {
  // Remove query parameters
  const cleanUrl = url.split('?')[0];
  const ext = extname(cleanUrl).toLowerCase();
  
  // Map common extensions
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
    return ext;
  }
  
  // Default to .jpg if no extension or unknown
  return '.jpg';
}

function scanTransmitters(): TransmitterImageInfo[] {
  const transmitters: TransmitterImageInfo[] = [];
  const manufacturers = readdirSync(TRANSMITTERS_DIR);
  
  for (const manufacturer of manufacturers) {
    const manufacturerPath = join(TRANSMITTERS_DIR, manufacturer);
    
    try {
      const files = readdirSync(manufacturerPath);
      
      for (const file of files) {
        if (!file.endsWith('.yaml')) continue;
        
        const yamlPath = join(manufacturerPath, file);
        const content = readFileSync(yamlPath, 'utf-8');
        const imageUrl = extractImageUrl(content);
        
        if (imageUrl) {
          const yamlId = file.replace('.yaml', '');
          const extension = getImageExtension(imageUrl);
          const localFilename = `${yamlId}${extension}`;
          
          transmitters.push({
            yamlPath,
            yamlId,
            imageUrl,
            localFilename,
          });
        }
      }
    } catch (error) {
      console.error(`Error processing ${manufacturer}: ${error}`);
    }
  }
  
  return transmitters;
}

function downloadImage(url: string, outputPath: string): boolean {
  try {
    console.log(`  📥 Downloading: ${url.substring(0, 60)}...`);
    execSync(`curl -L -s -o "${outputPath}" "${url}"`, { stdio: 'pipe' });
    
    // Check if file was created and has content
    const stats = existsSync(outputPath) ? statSync(outputPath) : null;
    if (stats && stats.size > 100) {
      console.log(`  ✅ Saved as: ${outputPath.split('/').pop()} (${(stats.size / 1024).toFixed(1)} KB)`);
      return true;
    } else {
      console.log(`  ⚠️  Download failed or file too small`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error}`);
    return false;
  }
}

function updateYamlFile(yamlPath: string, oldUrl: string, newFilename: string): boolean {
  try {
    let content = readFileSync(yamlPath, 'utf-8');
    
    // Replace the URL with just the filename
    const updated = content.replace(
      `src: "${oldUrl}"`,
      `src: ${newFilename}`
    );
    
    if (updated === content) {
      console.log(`  ⚠️  No changes made to YAML`);
      return false;
    }
    
    writeFileSync(yamlPath, updated, 'utf-8');
    console.log(`  ✅ Updated YAML: ${yamlPath.split('/').pop()}`);
    return true;
  } catch (error) {
    console.log(`  ❌ Error updating YAML: ${error}`);
    return false;
  }
}

async function main() {
  console.log('🔄 Converting transmitter images from online URLs to local files...\n');
  
  const transmitters = scanTransmitters();
  console.log(`📊 Found ${transmitters.length} transmitters with online images\n`);
  
  let downloaded = 0;
  let updated = 0;
  let failed = 0;
  
  for (const transmitter of transmitters) {
    console.log(`\n🎯 Processing: ${transmitter.yamlId}`);
    
    const outputPath = join(IMAGES_DIR, transmitter.localFilename);
    
    // Download image
    const downloadSuccess = downloadImage(transmitter.imageUrl, outputPath);
    
    if (downloadSuccess) {
      downloaded++;
      
      // Update YAML file
      const updateSuccess = updateYamlFile(
        transmitter.yamlPath,
        transmitter.imageUrl,
        transmitter.localFilename
      );
      
      if (updateSuccess) {
        updated++;
      }
    } else {
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`  ✅ Downloaded: ${downloaded}`);
  console.log(`  📝 YAML updated: ${updated}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📦 Total: ${transmitters.length}`);
  console.log('='.repeat(60));
  
  console.log('\n✨ Done! Check the images in:');
  console.log(`   ${IMAGES_DIR}`);
}

main().catch(console.error);
