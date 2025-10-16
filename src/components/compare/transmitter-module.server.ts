import type {
  TransmitterCompareContext,
  TransmitterCompareItem,
} from "./TransmitterCompareTable";
import TransmitterCompareTable, {
  compareComponentId,
  sortTransmitterItems,
  transformTransmitterEntry,
} from "./TransmitterCompareTable";

import { getComponentImageResolver } from "@/lib/component-registry";
import { getManufacturersMap } from "@/lib/content-cache.server";

import type { CompareModule } from "./compare-module";

const loadTransmitterContext = async (): Promise<TransmitterCompareContext> => ({
  manufacturers: await getManufacturersMap(),
  resolveImage: getComponentImageResolver("transmitter"),
});

export const transmitterCompareModule: CompareModule<
  typeof compareComponentId,
  "transmitters",
  TransmitterCompareItem,
  TransmitterCompareContext
> = {
  id: compareComponentId,
  collectionKey: "transmitters",
  Table: TransmitterCompareTable,
  page: {
    title: "Compare Transmitters - FCBase",
    description:
      "Review EdgeTX transmitter support levels, hardware variants, and compliance records side by side.",
    breadcrumbLabel: "Transmitters",
  },
  loadContext: loadTransmitterContext,
  transformEntry: (entry, context) => transformTransmitterEntry(entry, context),
  sortItems: sortTransmitterItems,
};
