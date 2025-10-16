export type ComponentCompareMetadata = {
  label: string;
  menuLabel: string;
  compareRoute: string;
  storageKey: string;
  legacyStorageKeys?: readonly string[];
};

export type ComponentMetadataEntry<Id extends string = string> = {
  id: Id;
  compare: ComponentCompareMetadata;
  navigation: {
    label: string;
    primaryRoute: string;
    ctaCopy: string;
  };
  homepage: {
    title: string;
    description: string;
    ctaCopy: string;
  };
};

export type ComponentNavigationMetadata = ComponentMetadataEntry['navigation'];
export type ComponentHomepageMetadata = ComponentMetadataEntry['homepage'];

export const componentMetadata = [
  {
    id: 'controller',
    compare: {
      label: 'Flight controllers',
      menuLabel: 'Compare FCs',
      compareRoute: '/controllers/compare',
      storageKey: 'fcbase:compare:controller',
      legacyStorageKeys: ['fcbase:compare'],
    },
    navigation: {
      label: 'Controllers',
      primaryRoute: '/controllers',
      ctaCopy: 'Browse Controllers',
    },
    homepage: {
      title: 'Flight Controllers',
      description:
        'Browse verified boards, compare MCUs, and filter by firmware support.',
      ctaCopy: 'Browse flight controllers',
    },
  },
  {
    id: 'transmitter',
    compare: {
      label: 'Transmitters',
      menuLabel: 'Compare TXs',
      compareRoute: '/transmitters/compare',
      storageKey: 'fcbase:compare:transmitter',
    },
    navigation: {
      label: 'Transmitters',
      primaryRoute: '/transmitters',
      ctaCopy: 'Browse Transmitters',
    },
    homepage: {
      title: 'Transmitters',
      description:
        'Explore EdgeTX radios, track support versions, and jump to FCC compliance records.',
      ctaCopy: 'Browse transmitters',
    },
  },
] as const satisfies readonly ComponentMetadataEntry[];

export type ComponentMetadata = (typeof componentMetadata)[number];

export type ComponentMetadataId = ComponentMetadata['id'];

export const componentMetadataRegistry = componentMetadata.reduce(
  (accumulator, entry) => {
    accumulator[entry.id] = entry;
    return accumulator;
  },
  {} as {
    [Entry in ComponentMetadata as Entry['id']]: Entry;
  },
);

export const componentMetadataIds = componentMetadata.map(
  (entry) => entry.id,
) as ComponentMetadataId[];
