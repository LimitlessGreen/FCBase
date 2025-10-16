export type CompareComponentDefinition = {
  id: string;
  label: string;
  /** Label used when rendering navigation or action buttons. */
  menuLabel: string;
  /** Absolute route (from the site root) to the compare table page. */
  compareRoute: string;
  /** Local storage key that tracks selected IDs for this component type. */
  storageKey: string;
  /** Optional list of legacy storage keys that should be migrated. */
  legacyStorageKeys?: readonly string[];
};

export const compareComponentDefinitions = [
  {
    id: 'controller',
    label: 'Flight controllers',
    menuLabel: 'Compare FCs',
    compareRoute: '/controllers/compare',
    storageKey: 'fcbase:compare:controller',
    legacyStorageKeys: ['fcbase:compare'],
  },
  {
    id: 'transmitter',
    label: 'Transmitters',
    menuLabel: 'Compare TXs',
    compareRoute: '/transmitters/compare',
    storageKey: 'fcbase:compare:transmitter',
  },
] as const satisfies ReadonlyArray<CompareComponentDefinition>;

export type CompareComponentId =
  (typeof compareComponentDefinitions)[number]['id'];

export type CompareComponentRegistry = {
  readonly [Definition in (typeof compareComponentDefinitions)[number] as Definition['id']]: Definition;
};

const registry = compareComponentDefinitions.reduce<
  Partial<Record<CompareComponentId, (typeof compareComponentDefinitions)[number]>>
>((accumulator, definition) => {
  accumulator[definition.id] = definition;
  return accumulator;
}, {});

export const compareComponentRegistry = registry as CompareComponentRegistry;

export const compareComponentIds: readonly CompareComponentId[] =
  compareComponentDefinitions.map((definition) => definition.id);

export function getCompareComponentDefinition(
  id: CompareComponentId,
): CompareComponentRegistry[CompareComponentId] {
  return compareComponentRegistry[id];
}
