/**
 * Centralized badge styling utilities for consistent theming across FCBase.
 * 
 * This module provides type-safe badge variants and utility functions for
 * firmware status, verification levels, and hardware openness indicators.
 * 
 * @example
 * ```typescript
 * import { getFirmwareBadgeClass, BadgeSizes } from '@/lib/badge-styles';
 * 
 * const classes = getFirmwareBadgeClass('stable');
 * const size = BadgeSizes.md;
 * ```
 */

export const BadgeVariants = {
  firmware: {
    beta: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    stable: 'bg-green-500/10 text-green-500 border-green-500/20',
    deprecated: 'bg-red-500/10 text-red-500 border-red-500/20',
    community: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  } as const,

  verification: {
    unverified: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    community: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    reviewed: 'bg-green-500/10 text-green-500 border-green-500/20',
  } as const,

  hardware: {
    open: 'bg-green-500/10 text-green-500 border-green-500/20',
    closed: 'bg-red-500/10 text-red-500 border-red-500/20',
    partial: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  } as const,

  // Default badge for generic use
  default: {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary/10 text-secondary border-secondary/20',
    muted: 'bg-muted/10 text-muted-foreground border-muted/20',
  } as const,
} as const;

export type FirmwareStatus = keyof typeof BadgeVariants.firmware;
export type VerificationLevel = keyof typeof BadgeVariants.verification;
export type HardwareOpenness = keyof typeof BadgeVariants.hardware;
export type DefaultVariant = keyof typeof BadgeVariants.default;

/**
 * Get badge classes for firmware status
 * @param status - The firmware status (beta, stable, deprecated, community)
 * @returns Tailwind CSS classes for the badge
 */
export function getFirmwareBadgeClass(status: FirmwareStatus): string {
  return BadgeVariants.firmware[status];
}

/**
 * Get badge classes for verification level
 * @param level - The verification level (unverified, community, reviewed)
 * @returns Tailwind CSS classes for the badge
 */
export function getVerificationBadgeClass(level: VerificationLevel): string {
  return BadgeVariants.verification[level];
}

/**
 * Get badge classes for hardware openness
 * @param openness - The hardware openness level (open, closed, partial)
 * @returns Tailwind CSS classes for the badge
 */
export function getHardwareBadgeClass(openness: HardwareOpenness): string {
  return BadgeVariants.hardware[openness];
}

/**
 * Get default badge variant classes
 * @param variant - The default variant (primary, secondary, muted)
 * @returns Tailwind CSS classes for the badge
 */
export function getDefaultBadgeClass(variant: DefaultVariant): string {
  return BadgeVariants.default[variant];
}

/**
 * Badge size presets for consistent sizing across the application
 */
export const BadgeSizes = {
  xs: 'px-1.5 py-0 text-[10px]',
  sm: 'px-1.5 py-0 text-xs',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
  xl: 'px-3 py-1.5 text-sm',
} as const;

export type BadgeSize = keyof typeof BadgeSizes;

/**
 * Get size classes for a badge
 * @param size - The badge size preset
 * @returns Tailwind CSS classes for the size
 */
export function getBadgeSizeClass(size: BadgeSize = 'md'): string {
  return BadgeSizes[size];
}

/**
 * Capitalize first letter of a string
 * Useful for displaying status text
 */
export function capitalizeStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
