/**
 * Auto-migration script for power inputs
 * 
 * This script automatically migrates voltage_in strings to structured inputs
 * for high-confidence cases and generates TODO comments for manual review.
 */

import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { glob } from 'glob';

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  manual: number;
}

/**
 * Apply migration to a single file
 */
function migrateFile(filePath: string, dryRun: boolean = true): 'migrated' | 'skipped' | 'manual' {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = yaml.parse(content);

  if (!data.power?.voltage_in || typeof data.power.voltage_in !== 'string') {
    return 'skipped';
  }

  const voltageIn = data.power.voltage_in;
  
  // Simple patterns for high-confidence migration
  const patterns = [
    // Pattern: "X.X-Y.YV primary inputs"
    {
      regex: /^(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*V\s+primary\s+inputs(?:\s+via\s+(.+))?$/i,
      handler: (match: RegExpMatchArray) => ({
        inputs: [{
          name: 'POWER1',
          type: 'power_module' as const,
          connector: match[3] || undefined,
          voltage: {
            min: parseFloat(match[1]),
            max: parseFloat(match[2]),
            unit: 'V' as const
          }
        }],
        redundant: false
      })
    },
    // Pattern: "X-YV DC"
    {
      regex: /^(\d+)\s*-\s*(\d+)\s*V\s+DC(?:\s+(.+))?$/i,
      handler: (match: RegExpMatchArray) => ({
        inputs: [{
          name: 'POWER',
          type: undefined,
          voltage: {
            min: parseInt(match[1]),
            max: parseInt(match[2]),
            unit: 'V' as const
          },
          notes: match[3] || undefined
        }],
        redundant: false
      })
    },
    // Pattern: "XS-YS LiPo"
    {
      regex: /^(\d+)S\s*-\s*(\d+)S\s+LiPo(?:\s+(.+))?$/i,
      handler: (match: RegExpMatchArray) => {
        const minCells = parseInt(match[1]);
        const maxCells = parseInt(match[2]);
        return {
          inputs: [{
            name: 'BATTERY',
            type: 'battery' as const,
            voltage: {
              min: minCells * 3.0,
              max: maxCells * 4.2,
              unit: 'V' as const
            },
            notes: `${minCells}S-${maxCells}S LiPo${match[3] ? ` ${match[3]}` : ''}`
          }],
          redundant: false
        };
      }
    }
  ];

  // Try to match patterns
  for (const pattern of patterns) {
    const match = voltageIn.match(pattern.regex);
    if (match) {
      const migration = pattern.handler(match);
      
      // Apply migration
      delete data.power.voltage_in;
      data.power.inputs = migration.inputs;
      if (migration.redundant) {
        data.power.redundant = true;
      }

      if (!dryRun) {
        // Preserve original formatting where possible
        const doc = new yaml.Document(data);
        doc.commentBefore = ` Migrated from voltage_in: "${voltageIn}"`;
        const newContent = yaml.stringify(doc);
        fs.writeFileSync(filePath, newContent, 'utf-8');
      }

      return 'migrated';
    }
  }

  // No pattern matched - needs manual review
  return 'manual';
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  const verbose = args.includes('--verbose');

  console.log(`\n=== Power Input Auto-Migration ===`);
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (use --apply to actually migrate)' : '✏️  APPLY CHANGES'}\n`);

  const controllersDir = 'src/content/controllers';
  const files = await glob(`${controllersDir}/**/*.yaml`);

  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    manual: 0
  };

  const migratedFiles: string[] = [];
  const manualFiles: string[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const data = yaml.parse(content);

    if (data.power?.voltage_in && typeof data.power.voltage_in === 'string') {
      stats.total++;
      const result = migrateFile(file, dryRun);

      stats[result]++;

      if (result === 'migrated') {
        migratedFiles.push(file);
        if (verbose) {
          console.log(`✅ ${path.relative(process.cwd(), file)}`);
          console.log(`   "${data.power.voltage_in}"`);
        }
      } else if (result === 'manual') {
        manualFiles.push(file);
        if (verbose) {
          console.log(`⚠️  ${path.relative(process.cwd(), file)}`);
          console.log(`   "${data.power.voltage_in}" (needs manual review)`);
        }
      }
    }
  }

  // Print summary
  console.log(`\n=== Summary ===`);
  console.log(`Total with voltage_in: ${stats.total}`);
  console.log(`✅ Auto-migrated: ${stats.migrated}`);
  console.log(`⚠️  Manual review needed: ${stats.manual}`);
  console.log(`⏭️  Skipped (already migrated): ${stats.skipped}`);

  if (manualFiles.length > 0) {
    console.log(`\n=== Files Needing Manual Review ===`);
    for (const file of manualFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const data = yaml.parse(content);
      console.log(`\n${path.relative(process.cwd(), file)}:`);
      console.log(`  voltage_in: "${data.power.voltage_in}"`);
    }
  }

  if (dryRun && stats.migrated > 0) {
    console.log(`\n💡 Run with --apply to actually migrate ${stats.migrated} files`);
  } else if (!dryRun && stats.migrated > 0) {
    console.log(`\n✅ Successfully migrated ${stats.migrated} files!`);
    console.log(`   Don't forget to review the changes and commit them.`);
  }
}

main().catch(console.error);
