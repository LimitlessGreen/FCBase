/**
 * Migration script to convert unstructured voltage_in strings to structured power.inputs
 * 
 * This script analyzes voltage_in strings and suggests structured input configurations.
 * 
 * Usage: tsx scripts/migrate-power-inputs.ts
 */

import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { glob } from 'glob';

interface VoltageRange {
  min: number;
  max: number;
  unit: 'V';
}

interface PowerInput {
  name: string;
  type?: 'power_module' | 'usb' | 'battery' | 'regulator' | 'servo_rail' | 'other';
  connector?: string;
  voltage?: VoltageRange;
  notes?: string;
}

interface AnalysisResult {
  file: string;
  currentVoltageIn: string;
  suggestedInputs: PowerInput[];
  confidence: 'high' | 'medium' | 'low';
  notes: string[];
}

/**
 * Parse voltage range strings like "4.9-5.5V", "2S-8S LiPo", "9-36V DC"
 */
function parseVoltageRange(text: string): VoltageRange | null {
  // Match patterns like "4.9-5.5V", "4.75-5.25V"
  const rangeMatch = text.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*V/i);
  if (rangeMatch) {
    return {
      min: parseFloat(rangeMatch[1]),
      max: parseFloat(rangeMatch[2]),
      unit: 'V'
    };
  }

  // Match "up to XVmatch" or "max XVmatch" patterns
  const maxMatch = text.match(/(?:up\s+to|max)\s+(\d+\.?\d*)\s*V/i);
  if (maxMatch) {
    return {
      min: 0,
      max: parseFloat(maxMatch[1]),
      unit: 'V'
    };
  }

  // Match single voltage like "USB 5V"
  const singleMatch = text.match(/USB\s+(\d+\.?\d*)\s*V/i);
  if (singleMatch) {
    const voltage = parseFloat(singleMatch[1]);
    return {
      min: voltage * 0.95,  // Allow 5% tolerance
      max: voltage * 1.05,
      unit: 'V'
    };
  }

  // Match LiPo cell counts like "2S-8S" (3.7V per cell nominal, 4.2V max)
  const lipoMatch = text.match(/(\d+)S\s*-\s*(\d+)S/i);
  if (lipoMatch) {
    return {
      min: parseInt(lipoMatch[1]) * 3.7,
      max: parseInt(lipoMatch[2]) * 4.2,
      unit: 'V'
    };
  }

  // Match single LiPo cell count like "6S" or "3-6S"
  const singleLipoMatch = text.match(/(?:(\d+)\s*-\s*)?(\d+)S\s+LiPo/i);
  if (singleLipoMatch) {
    const minCells = singleLipoMatch[1] ? parseInt(singleLipoMatch[1]) : parseInt(singleLipoMatch[2]);
    const maxCells = parseInt(singleLipoMatch[2]);
    return {
      min: minCells * 3.0,  // Minimum safe voltage
      max: maxCells * 4.2,  // Maximum charge voltage
      unit: 'V'
    };
  }

  return null;
}

/**
 * Detect input type from text
 */
function detectInputType(text: string): PowerInput['type'] | undefined {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('usb')) return 'usb';
  if (lowerText.includes('servo rail')) return 'servo_rail';
  if (lowerText.includes('battery') || lowerText.includes('lipo')) return 'battery';
  if (lowerText.includes('power module') || lowerText.includes('pm')) return 'power_module';
  if (lowerText.includes('regulator')) return 'regulator';
  
  return undefined;
}

/**
 * Detect connector type from text
 */
function detectConnector(text: string): string | undefined {
  const connectors = [
    'USB-C',
    'USB Type-C',
    'Micro-USB',
    'PowerBrick',
    'JST-GH',
    'XT60',
    'XT30',
    'Deans',
  ];

  for (const connector of connectors) {
    if (text.includes(connector)) {
      return connector;
    }
  }

  return undefined;
}

/**
 * Analyze voltage_in string and suggest structured inputs
 */
function analyzeVoltageIn(voltageIn: string): Omit<AnalysisResult, 'file' | 'currentVoltageIn'> {
  const inputs: PowerInput[] = [];
  const notes: string[] = [];
  let confidence: 'high' | 'medium' | 'low' = 'medium';

  // Split by common delimiters
  const parts = voltageIn.split(/[,;]|\s+or\s+|\s+and\s+/i);

  for (const part of parts) {
    const trimmedPart = part.trim();
    if (!trimmedPart) continue;

    const voltage = parseVoltageRange(trimmedPart);
    const type = detectInputType(trimmedPart);
    const connector = detectConnector(trimmedPart);

    // Determine input name
    let name = 'POWER';
    if (type === 'usb') name = 'USB';
    else if (type === 'servo_rail') name = 'SERVO';
    else if (type === 'battery') name = 'BATTERY';
    else if (type === 'power_module') name = 'PM';
    else if (connector) name = connector;

    const input: PowerInput = {
      name,
      type,
      connector,
      voltage: voltage || undefined,
    };

    // Add notes if parsing was incomplete
    if (!voltage) {
      input.notes = trimmedPart;
      notes.push(`Could not parse voltage from: "${trimmedPart}"`);
      confidence = 'low';
    }

    inputs.push(input);
  }

  // Check for redundancy indicators
  const hasRedundancy = /redundant/i.test(voltageIn);
  if (hasRedundancy) {
    notes.push('Detected redundant power - set redundant: true');
  }

  // Confidence adjustment
  if (inputs.length === 0) {
    confidence = 'low';
    notes.push('No inputs could be parsed - manual review required');
  } else if (inputs.every(i => i.voltage && i.type)) {
    confidence = 'high';
  }

  return {
    suggestedInputs: inputs,
    confidence,
    notes,
  };
}

/**
 * Main migration function
 */
async function main() {
  const controllersDir = 'src/content/controllers';
  const files = await glob(`${controllersDir}/**/*.yaml`);
  
  const results: AnalysisResult[] = [];
  let totalWithVoltageIn = 0;
  let totalWithStructuredInputs = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const data = yaml.parse(content);

    if (data.power?.voltage_in && typeof data.power.voltage_in === 'string') {
      totalWithVoltageIn++;
      
      const analysis = analyzeVoltageIn(data.power.voltage_in);
      results.push({
        file: path.relative(process.cwd(), file),
        currentVoltageIn: data.power.voltage_in,
        ...analysis,
      });
    }

    if (data.power?.inputs && Array.isArray(data.power.inputs)) {
      totalWithStructuredInputs++;
    }
  }

  // Print summary
  console.log('\n=== Power Input Migration Analysis ===\n');
  console.log(`Total controllers: ${files.length}`);
  console.log(`With voltage_in (unstructured): ${totalWithVoltageIn}`);
  console.log(`With inputs (structured): ${totalWithStructuredInputs}`);
  console.log(`\n=== Migration Suggestions ===\n`);

  // Group by confidence
  const highConfidence = results.filter(r => r.confidence === 'high');
  const mediumConfidence = results.filter(r => r.confidence === 'medium');
  const lowConfidence = results.filter(r => r.confidence === 'low');

  console.log(`✅ High confidence (${highConfidence.length}):`);
  for (const result of highConfidence.slice(0, 3)) {
    printResult(result);
  }

  console.log(`\n⚠️  Medium confidence (${mediumConfidence.length}):`);
  for (const result of mediumConfidence.slice(0, 3)) {
    printResult(result);
  }

  console.log(`\n❌ Low confidence (${lowConfidence.length}) - Manual review required:`);
  for (const result of lowConfidence.slice(0, 5)) {
    printResult(result);
  }

  // Generate migration YAML examples
  console.log('\n=== Example Migrations ===\n');
  
  if (highConfidence.length > 0) {
    const example = highConfidence[0];
    console.log(`File: ${example.file}`);
    console.log(`\nBefore:`);
    console.log(`power:`);
    console.log(`  voltage_in: "${example.currentVoltageIn}"`);
    console.log(`\nAfter:`);
    console.log(`power:`);
    console.log(`  inputs:`);
    for (const input of example.suggestedInputs) {
      console.log(`  - name: ${input.name}`);
      if (input.type) console.log(`    type: ${input.type}`);
      if (input.connector) console.log(`    connector: ${input.connector}`);
      if (input.voltage) {
        console.log(`    voltage:`);
        console.log(`      min: ${input.voltage.min}`);
        console.log(`      max: ${input.voltage.max}`);
        console.log(`      unit: V`);
      }
      if (input.notes) console.log(`    notes: "${input.notes}"`);
    }
  }

  // Save full results to JSON for further processing
  const outputFile = 'power-migration-results.json';
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\n✅ Full results saved to: ${outputFile}`);
}

function printResult(result: AnalysisResult) {
  console.log(`\n${result.file}:`);
  console.log(`  Current: "${result.currentVoltageIn}"`);
  console.log(`  Suggested inputs: ${result.suggestedInputs.length}`);
  for (const input of result.suggestedInputs) {
    console.log(`    - ${input.name}: ${input.voltage ? `${input.voltage.min}-${input.voltage.max}V` : 'NO VOLTAGE'} ${input.type ? `(${input.type})` : ''}`);
  }
  if (result.notes.length > 0) {
    console.log(`  Notes: ${result.notes.join(', ')}`);
  }
}

main().catch(console.error);
