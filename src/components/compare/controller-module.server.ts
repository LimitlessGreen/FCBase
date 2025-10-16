import ControllerCompareTable, {
  compareComponentId,
  sortControllerItems,
  transformControllerEntry,
} from "./ControllerCompareTable";
import type {
  ControllerCompareContext,
  ControllerCompareItem,
} from "./ControllerCompareTable";

import { getComponentImageResolver } from "@/lib/component-registry";
import {
  getFirmwareMap,
  getManufacturersMap,
  getSensorsMap,
} from "@/lib/content-cache.server";

import type { CompareModule } from "./compare-module";

const loadControllerContext = async (): Promise<ControllerCompareContext> => {
  const [manufacturers, sensors, firmwareMap] = await Promise.all([
    getManufacturersMap(),
    getSensorsMap(),
    getFirmwareMap(),
  ]);

  return {
    manufacturers,
    sensors,
    firmwareMap,
    resolveImage: getComponentImageResolver("controller"),
  };
};

export const controllerCompareModule: CompareModule<
  typeof compareComponentId,
  "controllers",
  ControllerCompareItem,
  ControllerCompareContext
> = {
  id: compareComponentId,
  collectionKey: "controllers",
  Table: ControllerCompareTable,
  page: {
    title: "Compare Flight Controllers - FCBase",
    description:
      "Select multiple flight controllers to review MCU, I/O, and firmware capabilities side by side.",
    breadcrumbLabel: "Controllers",
  },
  loadContext: loadControllerContext,
  transformEntry: (entry, context) => transformControllerEntry(entry, context),
  sortItems: sortControllerItems,
};
