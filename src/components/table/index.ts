/**
 * Professional table components for ultra-compact information sheets
 * 
 * @module components/table
 * 
 * Components:
 * - ProfessionalTable: Base wrapper with professional styling
 * - TableSection: Color-coded section headers
 * - TableRow: Single label-value row
 * - TableRow2Col: Two label-value pairs per row (4-column layout)
 * 
 * Usage example:
 * ```astro
 * <ProfessionalTable>
 *   <TableSection title="Hardware" color="blue" />
 *   <TableRow2Col 
 *     label1="MCU" value1="STM32H743" 
 *     label2="Flash" value2="2 MB" 
 *     mono1 mono2 
 *   />
 *   <TableRow label="IMU" value="ICM-42688-P" mono />
 * </ProfessionalTable>
 * ```
 */

export { default as ProfessionalTable } from './ProfessionalTable.astro';
export { default as TableSection } from './TableSection.astro';
export { default as TableRow } from './TableRow.astro';
export { default as TableRow2Col } from './TableRow2Col.astro';
